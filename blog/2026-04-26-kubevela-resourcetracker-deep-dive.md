---
title: "KubeVela ResourceTracker Pattern: How Self-Healing Works Without Watching Every Resource"
author: Vishal Kumar
author_title: KubeVela Contributor
author_url: https://github.com/vishal210893
author_image_url: https://avatars.githubusercontent.com/u/20546312?v=4
tags: [KubeVela, Kubernetes, Operator, ResourceTracker, Multicluster, controller-runtime, CNCF]
description: "A deep dive into KubeVela's ResourceTracker pattern: why the Application controller watches only three CRDs, how periodic reconciliation drives self-healing, and how the design scales to any resource type across clusters."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

Every Kubernetes operator answers the same question whenever a child resource changes: *"which parent should I reconcile?"* The usual answer is `controller-runtime`'s `.Owns()` helper, which registers an Informer per child type, caches them, and reads the OwnerReference on each child to find its parent. That's fine when you know your child types up front. It stops being fine when your operator is a platform engine and users keep inventing new resource types.

KubeVela takes a different route. The Application controller doesn't watch Pods, Deployments, or Services at all. It watches three KubeVela CRDs and keeps a separate record — the **ResourceTracker** — that lists everything an Application is supposed to have created. This post covers why the design exists, how self-healing works without event-driven watches on children, what you can tune, and how the approach compares to plain `client-go` and `controller-runtime`.

<!--truncate-->

## 1. The Problem Space

A controller needs to know when its child resources are created, modified, or deleted. The standard way to get those notifications is to register an Informer per child type. That works fine when the set of child types is small and known. It doesn't work as well when your operator is a platform that can produce any resource type its users want.

:::info The question
Look at KubeVela's controller setup and you'll notice it doesn't watch Pods, Deployments, or Services. So how does it notice when one of them gets deleted and recreate it?
:::

```go
// Application controller setup — SetupWithManager
func (r *Reconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        Watches(
            &v1beta1.ResourceTracker{},
            ctrlHandler.EnqueueRequestsFromMapFunc(findObjectForResourceTracker)).
        WithOptions(controller.Options{
            MaxConcurrentReconciles: r.concurrentReconciles,
        }).
        WithEventFilter(predicate.Funcs{ /* ... */ }).
        Watches(
            &v1beta1.PolicyDefinition{},
            ctrlHandler.EnqueueRequestsFromMapFunc(r.handlePolicyDefinitionChange),
        ).
        For(&v1beta1.Application{}).
        Complete(r)
}
// Notice: NO .Owns(&corev1.Pod{}), NO .Owns(&appsv1.Deployment{})
```

:::tip The answer
KubeVela combines a **ResourceTracker** record with **periodic reconciliation** instead of watching child resources directly. The trade is real: you give up millisecond event-driven reaction and get back constant-memory, type-agnostic tracking.
:::

### The Traditional `.Owns()` Pattern

In a typical Kubebuilder controller, you register direct watches on every child resource type:

```go
func (r *MyReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&v1beta1.MyApp{}).
        Owns(&corev1.Pod{}).           // Direct watch on Pods
        Owns(&appsv1.Deployment{}).    // Direct watch on Deployments
        Owns(&corev1.Service{}).       // Direct watch on Services
        Complete(r)
}
```

Each `.Owns()` call creates a dedicated Informer that:

1. Opens a persistent watch stream to the API server for that type
2. Caches every instance of that type cluster-wide in memory
3. Fires create/update/delete handlers and reads the OwnerReference to find the parent

### The Scaling Problem

This works well when you have 2–5 known child types. KubeVela is built for the opposite case — it has to handle dynamic, user-defined workloads. A single Application can produce:

**Standard Kubernetes resources**

- Pods, Deployments, StatefulSets
- Services, Ingresses
- ConfigMaps, Secrets
- PVCs, ServiceAccounts
- Jobs, CronJobs

**Third-party CRDs**

- Prometheus ServiceMonitors
- Istio VirtualServices
- Cert-Manager Certificates
- Crossplane AWS / GCP resources
- User-defined custom trait CRDs

:::warning The cost of `.Owns()` at scale
If an Application can produce 100 different resource types, you need 100 `.Owns()` lines. Each one creates a separate Informer that caches every instance of that type in the cluster. With 10,000 Pods running, the Pod Informer holds all 10,000 in memory, even if only 50 of them belong to your controller.

And you can't enumerate the types up front anyway. Users keep adding new CRDs through CUE definitions, and `.Owns()` requires a controller restart for each new type.
:::

## 2. The ResourceTracker Pattern

### Architecture

The ResourceTracker is a custom resource that holds a list of everything an Application has created. The Application controller watches three KubeVela CRDs only, and reads the ResourceTracker to know what's supposed to be in the cluster.

```text
Application (your CR)
    │ creates & owns
    ▼
ResourceTracker (tracking metadata)
    │ records references to
    ▼
[ Pod, Deployment, Service, ConfigMap, Ingress, CRD X, … ]
```

![Figure 2 — Three RT types per Application](/img/blog/resourcetracker-pattern/figure-2-rt-fanout.png)

*Figure 2 — The three RT types each handle a different lifecycle. The `cluster` field on every entry is what enables multicluster references without OwnerReferences.*

:::info Key insight
The Application controller watches three KubeVela CRDs: Application, ResourceTracker, and PolicyDefinition. The last one is there so that policy schema changes invalidate the cached renders. It does not watch Pods, Deployments, Services, or any other child. Three Informers total, no matter what users create.
:::

### ResourceTracker Types

KubeVela uses three ResourceTracker variants, each tied to a different lifecycle:

| Type | Purpose | Lifecycle |
|---|---|---|
| `root` | Resources that persist across upgrades | Recycled only when Application is deleted |
| `versioned` | Version-specific resources for rollback | Recycled when version is unused and not in latest RT |
| `component-revision` | Stores component revision history | Tracks all component revisions used |

This split lets KubeVela do version-aware garbage collection: clean up resources from old revisions while keeping the root ones alive, and keep component revision history around for rollback. None of it requires watching a single managed child.

### ManagedResource struct

```go
type ManagedResource struct {
    common.ClusterObjectReference `json:",inline"`  // apiVersion, kind, name, namespace, cluster
    common.OAMObjectReference     `json:",inline"`  // component, trait info
    Data    *runtime.RawExtension   `json:"raw,omitempty"`     // full resource spec
    Deleted bool                    `json:"deleted,omitempty"` // marks for deletion
    SkipGC  bool                    `json:"skipGC,omitempty"`  // skip garbage collection
}
```

Each `ManagedResource` carries enough to identify the resource (for the existence check) and to recreate it (the full spec lives in `Data`). The `Deleted` flag is there for two-phase GC: a resource gets marked first, then deleted on a later pass, which leaves a window for rollback.

:::info Design decision: storing full specs
Because the full rendered spec is in `Data`, self-healing doesn't have to re-run CUE template rendering. The controller can `Apply()` the stored spec directly. That keeps the self-healing path independent of the rendering pipeline, which matters when one of those is broken and the other isn't.
:::

## 3. Self-Healing Mechanism

With no Informers on the children, the controller has nothing to react to when one gets deleted. So it doesn't react. It comes back on a timer and re-checks. This is eventual consistency, and it's a real departure from the event-driven model most operators use.

### Periodic reconciliation

After each successful reconcile the controller requeues the Application for the next pass:

```go
func (r *reconcileResult) ret() (ctrl.Result, error) {
    if r.Duration.Seconds() != 0 {
        return ctrl.Result{RequeueAfter: r.Duration}, r.err
    } else if r.err != nil {
        return ctrl.Result{}, r.err
    }
    return ctrl.Result{RequeueAfter: common2.ApplicationReSyncPeriod}, nil
}
```

```go
// ApplicationReSyncPeriod re-sync period to reconcile application
ApplicationReSyncPeriod = time.Minute * 5
```

:::info Why 5 minutes?
The default is **5 minutes**, not 30 seconds (some older docs say 30s; that's wrong for current versions). It's a deliberate choice: with thousands of Applications in a cluster, a 30s cadence would hammer the API server. Five minutes gives you reasonable detection latency without that cost. If you need faster recovery for things like Pod restarts, you already have it — Kubernetes' built-in ReplicaSet controller handles Pod recreation in seconds. KubeVela's self-healing is for the level above: re-rendering the full Application spec when something at the top has gone missing.
:::

### Health check pipeline

Each reconcile pass also evaluates component health:

```go
// Simplified health evaluation flow
func evalStatus(ctx, handler, appFile, appParser) bool {
    healthCheck := handler.checkComponentHealth(appParser, appFile)

    if !hasHealthCheckPolicy(appFile.ParsedPolicies) {
        applyComponentHealthToServices(ctx, handler, componentMap, healthCheck)
        handler.app.Status.Services = handler.services
        return isHealthy(handler.services)
    }
    return true
}
```

The health pipeline does more than check whether things exist. For each tracked resource it:

1. Fetches the resource from the API server using the reference in the ResourceTracker
2. Runs a type-specific health check (Deployment readiness, Pod status, and so on)
3. Compares actual state to the desired state stored in `Data` to detect drift
4. Re-applies the desired state via server-side apply if drift is found

## 4. Tuning the ResourceTracker Reconcile Window

The 5-minute default from Section 3 isn't a fixed property of the system. The period is a flag. You can shorten it when drift recovery has to be fast, lengthen it when you have a lot of Applications and want to spare the API server, or leave it alone, which is the right answer most of the time. This section walks through the flag, the cost of moving it in either direction, and a few related flags people confuse with it.

![Figure 1 — Drift detection latency vs. --application-re-sync-period](/img/blog/resourcetracker-pattern/figure-1-reconcile-window.png)

*Figure 1 — Each marker is one possible value of `--application-re-sync-period`. The bracket shows the worst-case time before KubeVela notices higher-level drift. Spacing is for clarity, not linear time.*

### The flag — `--application-re-sync-period`

The flag takes a Go `time.Duration` string (`30s`, `1m`, `15m`, …) and defaults to `5m`. There are two ways to set it depending on whether you run the binary directly or use the Helm chart.

**Direct CLI**

```bash
vela-core --application-re-sync-period=1m
```

**Helm chart override (`charts/vela-core/values.yaml`)**

```yaml
controllerArgs:
  reSyncPeriod: 1m
```

### Trade-offs

The cost calculation is simple. On every cycle, the controller walks every `ManagedResource` in every `ResourceTracker`, does a `Get` per resource against the API server, and an `Apply` when drift is detected. The period is the divisor on the cluster-wide work rate.

| Direction | What you gain | What you pay |
|---|---|---|
| **Shorter** (e.g. `1m`) | Faster recovery from higher-level drift — deleted Deployments, missing ConfigMaps, removed Services, mutated Ingresses. | API server reads scale roughly as `Σ tracked resources / period`. With 500 Apps × 8 resources × 60s period that is ~67 reads/sec just for health checks. Status updates and drift re-applies stack on top. |
| **Default** (`5m`) | Balanced for typical fleets up to ~1000 Applications. | Drift detection latency ≤ 5 minutes. Pod-level drift unaffected (handled in milliseconds by Kubernetes' built-in controllers). |
| **Longer** (e.g. `15m`) | Lower steady-state API server pressure on large fleets. Frees headroom to raise `--concurrent-reconciles` for spec-change throughput without overloading etcd. | Drift detection latency up to 15 minutes. A deleted Service, ConfigMap or Ingress stays missing for that window. Acceptable when the platform is trusted and you let lower-level controllers handle pod-level recovery. |

### Companion knobs

These flags all interact in this area. Keep them straight before changing anything:

| Flag | Default | What it controls |
|---|---|---|
| `--application-re-sync-period` | `5m` | Period between RT re-evaluation cycles. **This is the one you usually want.** Helm: `controllerArgs.reSyncPeriod`. |
| `--concurrent-reconciles` | `4` | Worker count for the Application controller. Raise this if shortening the period creates a queue backlog. Helm: `concurrentReconciles`. |
| `--informer-sync-period` | `10h` | Kubernetes Informer cache full-resync interval. Not related to the RT reconcile loop and almost never worth touching. |
| `--kube-api-qps` | `50` | QPS limit on the controller's API client. If you raise `--concurrent-reconciles`, raise this proportionally or you will hit client-side throttling silently. |
| `--kube-api-burst` | `100` | Burst limit on the API client. The flag's own help text recommends keeping it at `qps × 2`; bump it alongside `--kube-api-qps`. |

### Tuning recipes

Starting points, not benchmarks. Profile after any change. The right setting depends on resources per Application, custom traits, controller-runtime version, and how busy the rest of your control plane is.

| Cluster profile | re-sync period | concurrent-reconciles | kube-api-qps / burst |
|---|---|---|---|
| Dev / small (&lt;100 Apps), drift-sensitive | `1m` | `4` (default) | `50` / `100` (defaults) |
| Production / typical (100–1000 Apps) | `5m` (default) | `4`–`8` | `50`–`100` / `100`–`200` |
| Large fleet (1000–10k Apps) | `10m`–`15m` | `16`–`32` | `200`–`400` / `400`–`800` |
| Edge / quiet workloads, very high stability | `30m`+ | `4` | `50` / `100` (defaults) |

:::warning Don't tune blindly
Before shortening the period, check whether the drift you care about actually needs it. Pod restarts, `CrashLoopBackOff` recovery, Deployment scale-up — Kubernetes handles all of that in seconds without help from the RT loop. The RT period only matters when something deletes or modifies a top-level resource owned by the Application.

If your postmortem says *"we lost a ConfigMap and didn't notice for five minutes"*, a shorter period helps. If it says *"a Pod CrashLooped"*, the period is irrelevant and you should be looking at probes, resource limits, or the image instead.
:::

## 5. Complete Flow: Deletion to Recreation

Walk through what happens when someone manually deletes a Pod that came from a KubeVela Application.

![Figure 3 — Pod deletion → 5-minute silence → periodic reconcile → re-apply](/img/blog/resourcetracker-pattern/figure-3-deletion-flow.png)

*Figure 3 — The Application controller hears nothing about the deletion (no Pod Informer) and only wakes up when the next re-sync timer fires. The five steps below trace each phase.*

**Step 1: Pod deletion**

Someone runs `kubectl delete pod my-app-pod-1`. The API server drops the Pod from etcd. The Application controller hears nothing about it because there is no Pod Informer.

If the Pod is owned by a Deployment, the ReplicaSet controller puts it back within seconds. That's not KubeVela's job. KubeVela's self-healing lives one layer above.

**Step 2: Periodic reconciliation fires (up to 5 min later)**

The re-sync timer eventually goes off. `Reconcile(ctx, Request{Name: "my-app"})` runs, and the work queue hands the Application to a worker.

**Step 3: ResourceTracker lookup**

The reconciler reads the Application CR and pulls its ResourceTracker(s). Each tracker entry is a `ManagedResource` carrying the full rendered spec in `Data`.

**Step 4: Health check & drift detection**

For each `ManagedResource`, the controller does the obvious thing:

```go
r.Get(ctx, namespacedName, &obj)
if apierrors.IsNotFound(err) {
    // Resource should exist but doesn't! Re-apply it.
    r.Apply(ctx, desiredSpec)
}
```

If the resource is gone, re-apply it. If it's still there but drifted, server-side apply pushes the desired state back in.

**Step 5: Recreation & requeue**

Anything missing or drifted gets re-applied, the Application status is rewritten, and the controller schedules the next pass:

```go
return ctrl.Result{RequeueAfter: 5 * time.Minute}, nil
```

Then it goes back to sleep until the timer fires again.

:::info Layered self-healing
KubeVela's self-healing rides on top of Kubernetes' built-in controllers, not in place of them. Delete a Pod under a Deployment and the ReplicaSet controller has it back in seconds. The 5-minute KubeVela loop is for the layer above that: deleted Deployments, modified Services, missing ConfigMaps, whole resource graphs that need to come back.
:::

## 6. Event Filtering: Preventing Infinite Loops

Any controller that updates its own `status` during reconciliation can loop on itself: the status write fires an event, the event triggers another reconcile, that reconcile writes status again. KubeVela's Application controller is more exposed to this than most. A single pass can update workflow progress, health results, and the applied-resource list, each one a separate write.

The fix is event predicates: filters that decide whether an update event is worth reacting to. The rule is simple — only reconcile when a human (or some external system) changed the spec, or when the periodic timer fires. Everything else is the controller talking to itself and can be dropped.

| What changed? | Decision | Why |
|---|---|---|
| User edited the `spec` (generation incremented) | ✓ Reconcile | User intent — always honor |
| Periodic re-sync (old == new) | ✓ Reconcile | Health check trigger |
| Workflow progress, phase transitions, applied resources | ✗ Skip | Controller's own writes — not user action |
| `managedFields` or `resourceVersion` only | ✗ Skip | API server bookkeeping |

:::info ResourceTracker: delete-only trigger
The ResourceTracker has the same loop risk: the controller updates it on every reconcile to record newly applied resources. The chosen fix is aggressive — by default, RT events only enqueue a reconcile when the tracker is being deleted. Create and update events are dropped on the floor.

This works because the controller already reconciles Applications on a timer. It doesn't need RT update events to know when to look at things. The only RT event that matters is deletion, which means GC is in progress and the owning Application needs to respond.
:::

## 7. `.Watches()` vs `.Owns()`

`controller-runtime` gives you two ways to watch related resources. The difference is what makes KubeVela's design possible.

**`.Owns()`**

- Automatically maps child → parent via OwnerReference
- Requires the child to have an `ownerReferences` entry pointing to the parent
- One Informer per child type
- Cannot work cross-namespace (OwnerRef requires same namespace for namespaced owners)
- Cannot work cross-cluster

**`.Watches()`**

- Requires a custom mapping function (`EnqueueRequestsFromMapFunc`)
- Can use any logic to map source → target (labels, annotations, any field)
- Only watches the source type you specify
- Can map across namespaces
- Can map across clusters (with a custom client)

![Figure 4 — Two paths from a child event to the Application reconcile queue](/img/blog/resourcetracker-pattern/figure-4-owns-vs-watches.png)

*Figure 4 — `.Owns()` reads OwnerReferences from each child type's Informer. `.Watches()` reads ResourceTracker labels through the custom MapFunc `findObjectForResourceTracker`.*

### `findObjectForResourceTracker`

```go
func findObjectForResourceTracker(_ context.Context, rt client.Object) []reconcile.Request {
    // Optimization: only trigger on RT deletion
    if EnableResourceTrackerDeleteOnlyTrigger && rt.GetDeletionTimestamp() == nil {
        return nil
    }
    if labels := rt.GetLabels(); labels != nil {
        var request reconcile.Request
        request.Name = labels[oam.LabelAppName]
        request.Namespace = labels[oam.LabelAppNamespace]
        if request.Namespace != "" && request.Name != "" {
            return []reconcile.Request{request}
        }
    }
    return nil
}
```

Instead of reading the OwnerReference from a child's metadata, this function reads labels off the ResourceTracker (`app.oam.dev/name`, `app.oam.dev/namespace`) to find the owning Application. That breaks the dependency on Kubernetes' ownership model, which is what makes cross-namespace and cross-cluster references possible.

## 8. Pattern Comparison

| Aspect | Traditional `.Owns()` | KubeVela ResourceTracker |
|---|---|---|
| Informers needed | One per child type — O(n) | Three total — O(1) |
| Memory cache | All instances of each watched type | Only Applications, ResourceTrackers & PolicyDefinitions |
| Detection latency | Milliseconds (event-driven) | Up to 5 min (periodic) |
| New CRD support | Requires code change + controller restart | Automatic — no changes needed |
| Cross-namespace | ✗ Not supported (OwnerRef requires same namespace) | ✓ Supported via label-based mapping |
| Cross-cluster | ✗ Not supported | ✓ Supported (`ClusterObjectReference`) |
| API server watch streams | One per resource type | Three total |
| Garbage collection | Kubernetes built-in (cascading delete via OwnerRef) | Custom GC with versioned tracking & two-phase delete |
| Rollback support | Not built-in | Versioned ResourceTrackers enable revision history |
| Implementation complexity | Simple (1 line per type) | Significant (custom CRD, GC logic, health pipeline) |

## 9. Why KubeVela Chose This Design

The ResourceTracker pattern isn't there for performance. It comes out of a few architectural calls:

### 1. Type agnosticism

KubeVela's whole pitch is that users write workloads as CUE templates — ComponentDefinitions, TraitDefinitions — and those templates can render any Kubernetes resource type. The controller can't know its child types at compile time. `.Owns()` requires every type to be registered at compile time. Those two facts don't fit together.

### 2. Multicluster resource management

KubeVela ships workloads across multiple clusters through the cluster gateway. OwnerReferences are single-cluster only — they identify the parent by UID, and UIDs are cluster-scoped. ResourceTracker uses `ClusterObjectReference`, which carries a `cluster` field, so it can track resources across cluster boundaries.

### 3. Version-aware lifecycle management

Versioned ResourceTrackers keep a record of which resources belonged to which Application revision. That gets you:

- **Rollback:** re-activate an older version's ResourceTracker (via the `app.oam.dev/publishVersion` annotation) and you have the exact resource set from that revision back.
- **Safe GC:** old versioned RTs are kept around as history. Their resources are only garbage collected once a newer RT has taken responsibility for managing them.

### 4. Separation of concerns

The ResourceTracker draws a line between the rendering pipeline (CUE evaluation, resource generation) and the dispatch pipeline (apply, track, self-heal). Rendering writes to the tracker. Dispatch reads from it. Neither has to know how the other works.

### 5. Bounded resource consumption

In a cluster with 100 CRD types and 50,000 total resources, the `.Owns()` approach would cache all 50,000 across 100 Informers. KubeVela caches Application, ResourceTracker, and PolicyDefinition objects only, which is usually orders of magnitude fewer. Memory tracks the number of Applications, not the number of managed resources or resource types.

:::warning The trade-off is real
There are real costs:

- Detection latency up to 5 minutes (configurable via `ApplicationReSyncPeriod`)
- API server load from periodic GETs against every tracked resource
- Custom GC logic instead of Kubernetes' built-in cascading delete
- The controller has to handle stale RT data without breaking

For a platform engine that manages dynamic, user-defined workloads across clusters, these are the right costs to take on. For a single-cluster operator with five known child types, they aren't.
:::

## 10. OwnerReference Handling: client-go vs controller-runtime

To see what the ResourceTracker pattern is replacing, it helps to look at the standard approach. Every controller has to answer one question when a child changes: which parent should I reconcile? The ecosystem has three answers at three levels of abstraction.

### The ownership problem

When a Deployment is deleted, the controller that owns it has to find out. Kubernetes doesn't automatically tell "whoever created this resource". The controller has to:

1. **Watch** the child resource type (set up an Informer)
2. **Receive** the deletion event
3. **Map** the child back to its parent (find who owns it)
4. **Enqueue** the parent for reconciliation

Step 3 uses the OwnerReference: a field in the child's metadata that points back to the parent.

```yaml
# Every child resource carries a pointer to its parent
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
  ownerReferences:
    - apiVersion: mygroup.io/v1
      kind: MyApp                # parent type
      name: my-app               # parent name
      controller: true           # "I am the controller owner"
      uid: abc-123               # parent UID
```

How much of this you write yourself depends on which level of abstraction you pick.

### Level 1: Raw client-go (maximum control)

Kubernetes' own [sample-controller](https://github.com/kubernetes/sample-controller) uses client-go directly. You assemble every piece of the pipeline yourself.

:::warning What you write yourself
For each child type you want to watch:

- Create a `SharedInformerFactory` and pull out the typed Informer
- Register three event handlers (Add, Update, Delete)
- In each handler, extract the OwnerReference from the child
- Check that the owner is your specific CRD Kind
- Look up the parent through a Lister
- Enqueue the parent's key into the work queue

Cost: roughly 100 lines per child type. Three child types = nine handler functions and around 300 lines.
:::

You also build the OwnerReference yourself when creating each child. Every field (`apiVersion`, `kind`, `name`, `uid`, `controller: true`) is yours to get right.

### Level 2: controller-runtime `.Owns()` (automated wiring)

controller-runtime, used by Kubebuilder and Operator SDK, folds the whole client-go pipeline into one method call:

```go
func (r *MyReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&myv1.MyApp{}).
        Owns(&appsv1.Deployment{}).   // this one line replaces ~100 lines of client-go
        Owns(&corev1.Service{}).
        Owns(&corev1.ConfigMap{}).
        Complete(r)
}
```

**What `.Owns()` does behind the scenes**

| Step | client-go (you write it) | `.Owns()` (generated) |
|---|---|---|
| Create Informer | `NewSharedInformerFactory` + typed getter | Auto-created from the GVK |
| Register handlers | `AddEventHandler` with 3 functions | Uses built-in `EnqueueRequestForOwner` |
| Extract OwnerRef | `GetControllerOf` + Kind check | Automatic: matches Kind + APIVersion + controller flag |
| Enqueue parent | `workqueue.Add(key)` | Returns `reconcile.Request` automatically |
| Set OwnerRef on create | Build `OwnerReferences` array manually | One-liner: `ctrl.SetControllerReference()` |

:::tip The result
Watching three child types drops from ~300 lines (client-go) to 3 lines (controller-runtime). For operators with a known, fixed set of child types, this is the right answer.
:::

### Level 3: KubeVela ResourceTracker (type-agnostic)

Both client-go and controller-runtime share one assumption: you know your child types at compile time. Each type has to be registered explicitly. The cost differs (100 lines vs 1 line per type), but the assumption is the same.

KubeVela drops the assumption:

```go
// KubeVela's entire watch setup — handles ANY managed resource type
ctrl.NewControllerManagedBy(mgr).
    For(&v1beta1.Application{}).
    Watches(&v1beta1.ResourceTracker{}, ...).
    Watches(&v1beta1.PolicyDefinition{}, ...).
    Complete(r)
// Three Informers total: Application, ResourceTracker, PolicyDefinition.
// None of them is a managed child. Handles Pods, Deployments, Services,
// Istio VirtualServices, Crossplane RDS instances, user-defined CRDs.
// Anything, dynamically, with zero .Owns() calls.
```

Instead of registering a watch per type, the ResourceTracker records what got created. Instead of an OwnerReference-driven event mapping, the controller polls tracked resources on a timer to see whether they still exist. The ownership model moves from "embedded in the child" to "written down in a separate record".

### The abstraction spectrum

![Figure 5 — Three abstraction levels for child-resource ownership, at a glance](/img/blog/resourcetracker-pattern/figure-5-abstraction-spectrum.png)

*Figure 5 — Levels 1 and 2 differ in code size, not capability. Level 3 is the only one that breaks the same-namespace, fixed-types ceiling. Color coding: red is a constraint, amber is a caveat, green is unrestricted.*

:::info Choosing your level
Each level trades simplicity for flexibility:

- **client-go** — reach for it when you need event handling that controller-runtime's abstractions can't express. This is rare.
- **controller-runtime `.Owns()`** — the right answer for almost every operator. If you know your child types and they live in the same namespace, this is where you start.
- **ResourceTracker pattern** — use it when you're building a platform that manages user-defined resource types across namespaces or clusters. The added complexity only pays off when `.Owns()` literally cannot do the job.
:::

## 11. Choosing Your Pattern

**Use `.Owns()` when:**

- You manage 2–10 known resource types
- All resources live in the same namespace
- It's a single-cluster operator
- You need immediate event-driven self-healing
- You want Kubernetes' built-in cascading delete
- Simplicity matters more than scale

**Consider ResourceTracker when:**

- You manage unknown or user-defined resource types
- Resources span multiple namespaces or clusters
- The set of resource types is large or unbounded
- You need version-aware tracking and rollback
- Memory at scale is a real constraint
- Eventual consistency in the seconds-to-minutes range is acceptable

:::tip The bottom line
ResourceTracker isn't a replacement for `.Owns()`. It solves a different problem. Traditional operators know their child types at compile time. Platform engines like KubeVela don't. If you're writing a small operator, use `.Owns()`. If you're writing a platform that manages dynamic, user-defined workloads across cluster boundaries, the ResourceTracker pattern is worth studying as one way to do type-agnostic self-healing with bounded memory.
:::

## 12. Case Study: Crossplane RBAC Manager OOMs at Scale

Up to here the argument has been theoretical: unbounded watches make controller memory grow with cluster size. Here's a production failure where that growth crossed the memory limit, and a look at why the same failure mode can't happen to KubeVela's Application controller.

### What happened

A team running Crossplane across a fleet of clusters hit a confusing problem. The `crossplane-rbac-manager` pod was crash-looping on one cluster but running fine on every other cluster from the same Helm release. Same image, same providers, same arguments, same 2 GiB memory limit. Over 13 days the affected pod logged:

- 56 `OOMKilled` events (exit code 137), roughly four per day
- Each crash hit within about 20 seconds of pod start, during initial informer cache sync
- Re-kills lined up with the controller's hourly `SyncPeriod` cache re-LIST, when controller-runtime re-fetches every watched object from the API server

In the windows where the pod stayed up, steady-state memory was around 293 MiB, less than a seventh of the limit. So this wasn't a slow leak burning down to the limit. The pod ran comfortably for hours, then died in a single sub-minute spike during a re-LIST.

What looked like a leak wasn't one. By every Crossplane-internal number the controller was fine. It was managing about 36 ProviderRevisions and 680 ClusterRoles, both well inside the design envelope. The thing that was actually driving memory growth was outside Crossplane's own resource graph, and none of those metrics caught it.

The only real difference between the broken cluster and the healthy ones was the total Deployment count:

| Cluster | Total Deployments | RBAC manager status |
|---|---|---|
| Affected cluster | **6,073** | OOMKilled, 56 restarts in 13 days |
| All sister clusters | &lt; 600 | Healthy, zero restarts |

Roughly 10× the Deployment density. Nothing else differed.

### The cause

The RBAC manager's binding controller (`internal/controller/rbac/provider/binding/reconciler.go`) sets up its watches like this:

```go
return ctrl.NewControllerManagedBy(mgr).
    Named(name).
    For(&v1.ProviderRevision{}).
    Owns(&rbacv1.ClusterRoleBinding{}).
    Watches(&appsv1.Deployment{},
        handler.EnqueueRequestForOwner(mgr.GetScheme(), mgr.GetRESTMapper(), &v1.ProviderRevision{})).
    WithOptions(o.ForControllerRuntime()).
    Complete(errors.WithSilentRequeueOnConflict(r))
```

`EnqueueRequestForOwner` filters which Deployment events get turned into reconcile requests — only Deployments owned by a `ProviderRevision` enqueue work. That part is fine. The problem is what happens before the handler runs.

`Watches(&appsv1.Deployment{}, ...)` registers an informer on Deployments. The informer's cache is what holds the objects, and there is no namespace filter, no field selector, and no `cache.ByObject` constraint anywhere in the manager setup. Every Deployment in the cluster, regardless of who owns it, gets materialized in the controller's informer cache. The handler-level owner filter narrows the *event* path; it does not narrow the *cache* path. Cache cost is `O(cluster Deployment count)`, not `O(Crossplane-managed resources)`.

At 600 Deployments the cache fits comfortably inside 2 GiB. At 6,073, the periodic re-LIST occasionally pushes the working set above 2 GiB and the kernel's OOM-killer takes the process down. Same Helm chart, same providers, same memory limit. The only thing that changed was the count of unrelated Deployments, and that was enough to crash the controller.

### Why KubeVela doesn't have this failure mode

The KubeVela Application controller doesn't watch `Deployment` at all. Its `SetupWithManager` registers three Informers (Application, ResourceTracker, PolicyDefinition) and that set is fixed no matter what users build on top of it. Pods, Deployments, Services, Ingresses, custom CRDs — none of them sit in the controller's cache. The cluster can have 60 Deployments or 60,000 and the controller's memory footprint looks the same.

The property that matters: the controller's memory profile is decoupled from the cluster's resource inventory. It scales with the number of Applications you've defined, not with anything else in the cluster.

| | Crossplane RBAC manager | KubeVela Application controller |
|---|---|---|
| Watches `Deployment` | Yes (unfiltered, cluster-wide) | No |
| Cache footprint scales with | Total Deployments in cluster | Number of Applications defined |
| Effect of growing cluster | Memory grows linearly → eventual OOM | No effect |
| 6,000 Deployments outcome | OOMKilled, 56 restarts in 13 days | Unchanged |
| Mitigation needed | Raise limit, lower concurrency, add filters | None — bounded by design |

### The lesson

Any controller that uses `.Owns()` or unfiltered `.Watches()` on a high-cardinality, cluster-scoped type inherits that type's growth as a memory cost. The bug isn't in the cluster size. It's in the watch set. The RBAC manager works at small scale because the watch set's cost stays under the limit. It fails at large scale because nothing in the design ever bounded that cost.

The ResourceTracker pattern doesn't try to filter the watch set. It removes the high-cardinality types from the watch set entirely and replaces direct watching with record-and-poll. That's why memory is bounded by what KubeVela manages, not by what else happens to exist in the cluster. It's not a stylistic choice. It's the design property that makes the failure mode above not apply.

---

**References**

- KubeVela source: [github.com/kubevela/kubevela](https://github.com/kubevela/kubevela)
- Application controller: [`pkg/controller/core.oam.dev/v1beta1/application/application_controller.go`](https://github.com/kubevela/kubevela/blob/master/pkg/controller/core.oam.dev/v1beta1/application/application_controller.go)
- ResourceTracker types: [`apis/core.oam.dev/v1beta1/resourcetracker_types.go`](https://github.com/kubevela/kubevela/blob/master/apis/core.oam.dev/v1beta1/resourcetracker_types.go)
- Kubernetes sample-controller: [github.com/kubernetes/sample-controller](https://github.com/kubernetes/sample-controller)
- controller-runtime: [github.com/kubernetes-sigs/controller-runtime](https://github.com/kubernetes-sigs/controller-runtime)
