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

Most Kubernetes operators answer one question every time something changes: *"which parent resource should I reconcile?"*  The standard answer — `controller-runtime`'s `.Owns()` helper — registers an Informer per child type, watches them all, and uses the OwnerReference embedded in each child to look up its parent. That works perfectly for an operator with two or three known child types. It falls apart when the operator is a *platform engine* whose users define new resource types every day.

KubeVela takes a different path. Its Application controller does not watch Pods, Deployments, or Services at all. Instead, it watches three KubeVela-defined CRDs and uses an intermediary record — the **ResourceTracker** — as a manifest of everything that should exist. This post walks through why that design exists, how it self-heals without event-driven watches, what knobs you can turn, and how it compares to `client-go` and `controller-runtime` at every level of abstraction.

<!--truncate-->

## 1. The Problem Space

In the Kubernetes controller ecosystem, operators need to know when child resources are created, modified, or deleted. The standard approach — registering **Informers** for each child resource type — works perfectly for operators that manage a predictable, fixed set of resource types. But what happens when your operator is a *platform* that can manage **any** resource type?

:::info The question
Looking at KubeVela's controller setup, you'll notice it does **not** watch Pods, Deployments, or Services. If it doesn't watch these resources, how does it detect when they're deleted and recreate them?
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
KubeVela uses a **ResourceTracker** intermediary pattern combined with **periodic reconciliation** instead of direct ownership watching. This trades millisecond event-driven reaction for constant-memory, type-agnostic resource management.
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

Each `.Owns()` call creates a **dedicated Informer** that:

1. Opens a persistent watch stream to the API server for that resource type
2. Caches **all** instances of that type cluster-wide in memory
3. Fires event handlers on create/update/delete, extracting OwnerReference to find the parent

### The Scaling Problem

This works beautifully for operators managing 2–5 known types. But KubeVela is designed to handle **dynamic, polymorphic workloads**. A single Application might produce:

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
If your Application can create 100 different resource types, you need 100 `.Owns()` declarations. Each creates a separate Informer caching **every instance** of that type cluster-wide. In a cluster with 10,000 Pods, the Pod Informer alone holds all 10,000 in memory — even if only 50 belong to your controller.

Worse: you can't predict all resource types users will create through CUE definitions, and adding new CRDs requires a controller restart.
:::

## 2. The ResourceTracker Pattern

### Architecture

KubeVela introduces an intermediary Custom Resource called **ResourceTracker** that acts as a *manifest* of all resources an Application has created. Instead of watching every child resource type, the controller watches only three KubeVela CRDs — and uses the ResourceTracker to know what it should expect to exist.

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
The Application controller watches three KubeVela-defined CRDs: **Application**, **ResourceTracker**, and **PolicyDefinition** (the last is needed so policy schema changes invalidate cached renders). It does **not** watch Pods, Deployments, Services, or any other managed child resource. Three Informers, regardless of how many resource types exist in the cluster.
:::

### ResourceTracker Types

KubeVela uses three distinct ResourceTracker types, each serving a different lifecycle purpose:

| Type | Purpose | Lifecycle |
|---|---|---|
| `root` | Resources that persist across upgrades | Recycled only when Application is deleted |
| `versioned` | Version-specific resources for rollback | Recycled when version is unused and not in latest RT |
| `component-revision` | Stores component revision history | Tracks all component revisions used |

This multi-tracker design enables **version-aware garbage collection**: KubeVela can clean up resources from old revisions while keeping root resources alive, and maintain component revision history for rollback — all without watching a single child resource.

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

Each `ManagedResource` stores enough information to both **identify** the resource (for existence checks) and **recreate** it (the full spec in `Data`). The `Deleted` flag enables two-phase garbage collection — resources are marked before actual deletion, providing a window for rollback.

:::info Design decision: storing full specs
By storing the complete rendered spec in `Data`, KubeVela doesn't need to re-render the Application's CUE templates during self-healing. It can directly `Apply()` the stored spec. This makes self-healing independent of the template rendering pipeline — a subtle but important separation of concerns.
:::

## 3. Self-Healing Mechanism

Without Informers on child resources, KubeVela cannot react to deletions via events. Instead, it relies on **periodic reconciliation** to achieve eventual consistency — a fundamentally different self-healing model from traditional controllers.

### Periodic reconciliation

After every successful reconcile, the controller requeues the Application for future re-evaluation:

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
The default re-sync period is **5 minutes**, not 30 seconds as some documentation suggests. This is a deliberate trade-off: in a cluster with thousands of Applications, reconciling each one every 30 seconds would create significant API server load. Five minutes provides a balance between detection latency and cluster health. For workloads requiring faster self-healing, Kubernetes' own Deployment controller already handles Pod recreation via ReplicaSet within seconds — KubeVela's self-healing is a higher-level concern that re-renders the entire Application's desired state.
:::

### Health check pipeline

During each reconciliation, KubeVela evaluates the health of all components:

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

The health check pipeline does more than just existence checks. For each tracked resource, it:

1. **Fetches** the resource from the API server using the reference in ResourceTracker
2. **Evaluates health** using type-specific health checkers (e.g., Deployment readiness, Pod status)
3. **Detects drift** by comparing the actual state against the stored desired state
4. **Re-applies** the desired state if drift is detected (server-side apply)

## 4. Tuning the ResourceTracker Reconcile Window

The 5-minute default in §3 is a balanced trade-off, not a law. KubeVela exposes the period as a tunable flag so you can shorten it for drift-sensitive workloads, lengthen it for large fleets, or leave it alone in the common case. This section walks through the knob itself, what each direction actually costs you, and the adjacent flags that are frequently confused with it.

![Figure 1 — Drift detection latency vs. --application-re-sync-period](/img/blog/resourcetracker-pattern/figure-1-reconcile-window.png)

*Figure 1 — Each marker is one possible value of `--application-re-sync-period`; the bracket shows the worst-case time before KubeVela notices a higher-level drift. Marker positions are spaced for visual clarity, not strict linear time.*

### The flag — `--application-re-sync-period`

The flag accepts a Go `time.Duration` string (`30s`, `1m`, `15m`, …) and defaults to `5m`. Here is how to set it up — there are two ways, depending on whether you run the controller binary directly or deploy it via the official Helm chart.

**Direct CLI**

```bash
vela-core --application-re-sync-period=1m
```

**Helm chart override (`charts/vela-core/values.yaml`)**

```yaml
controllerArgs:
  reSyncPeriod: 1m
```

The chart key is `controllerArgs.reSyncPeriod`; the template renders it into the controller's `--application-re-sync-period` argument. A common typo is to nest it under `controllerArgs.applicationReSyncPeriod` — that key is silently ignored.

### Trade-offs

Reasoning about the cost of changing this value comes down to one observation: on every cycle, the Application controller iterates every `ManagedResource` in every `ResourceTracker`, issues a `Get` per resource against the API server, and an `Apply` when drift is detected. The period is the divisor on a per-cluster work rate.

| Direction | What you gain | What you pay |
|---|---|---|
| **Shorter** (e.g. `1m`) | Faster recovery from higher-level drift — deleted Deployments, missing ConfigMaps, removed Services, mutated Ingresses. | API server reads scale roughly as `Σ tracked resources / period`. With 500 Apps × 8 resources × 60s period that is ~67 reads/sec just for health checks. Status updates and drift re-applies stack on top. |
| **Default** (`5m`) | Balanced for typical fleets up to ~1000 Applications. | Drift detection latency ≤ 5 minutes. Pod-level drift unaffected (handled in milliseconds by Kubernetes' built-in controllers). |
| **Longer** (e.g. `15m`) | Lower steady-state API server pressure on large fleets. Frees headroom to raise `--concurrent-reconciles` for spec-change throughput without overloading etcd. | Drift detection latency up to 15 minutes. A deleted Service, ConfigMap or Ingress stays missing for that window. Acceptable when the platform is trusted and you let lower-level controllers handle pod-level recovery. |

### Companion knobs

Four flags interact in this area. Keep them straight before turning any single dial:

| Flag | Default | What it controls |
|---|---|---|
| `--application-re-sync-period` | `5m` | Period between RT re-evaluation cycles. **This is the one you usually want.** Helm: `controllerArgs.reSyncPeriod`. |
| `--concurrent-reconciles` | `4` | Worker count for the Application controller. Raise this if shortening the period creates a queue backlog. Helm: `concurrentReconciles`. |
| `--informer-sync-period` | `10h` | Kubernetes Informer cache full-resync interval — *not related* to RT reconcile. Almost never worth touching. |
| `--kube-api-qps` | `50` | QPS limit on the controller's API client. If you raise `--concurrent-reconciles`, raise this proportionally or you will hit client-side throttling silently. |
| `--kube-api-burst` | `100` | Burst limit on the API client. The flag's own help text recommends keeping it at `qps × 2`; bump alongside `--kube-api-qps`. |

### Tuning recipes

Starting points, not benchmarks. Profile your cluster after any change — the right setting depends on resource count per Application, custom traits, controller-runtime version, and the noise floor of the rest of your control plane.

| Cluster profile | re-sync period | concurrent-reconciles | kube-api-qps / burst |
|---|---|---|---|
| Dev / small (&lt;100 Apps), drift-sensitive | `1m` | `4` (default) | `50` / `100` (defaults) |
| Production / typical (100–1000 Apps) | `5m` (default) | `4`–`8` | `50`–`100` / `100`–`200` |
| Large fleet (1000–10k Apps) | `10m`–`15m` | `16`–`32` | `200`–`400` / `400`–`800` |
| Edge / quiet workloads, very high stability | `30m`+ | `4` | `50` / `100` (defaults) |

:::warning Don't tune blindly
Before shortening the period, confirm that the drift you're chasing actually requires it. Pod restarts, `CrashLoopBackOff` recovery, and Deployment-managed scale-up are all handled by Kubernetes' built-in controllers in seconds — the RT period only matters when something deletes or mutates a top-level resource the Application owns.

If your incident postmortem says *"we lost a ConfigMap and didn't notice for 5 minutes"*, shortening helps. If it says *"a Pod CrashLooped"*, the period is irrelevant and you should be looking at probes and resource limits instead.
:::

## 5. Complete Flow: Deletion to Recreation

Let's trace the full lifecycle when a user manually deletes a Pod that was created by a KubeVela Application:

![Figure 3 — Pod deletion → 5-minute silence → periodic reconcile → re-apply](/img/blog/resourcetracker-pattern/figure-3-deletion-flow.png)

*Figure 3 — The Application controller stays silent during the deletion (no Pod Informer) and only acts when the periodic re-sync timer fires. The five steps below detail each phase.*

**Step 1: Pod deletion**

User runs `kubectl delete pod my-app-pod-1`. The API server removes the Pod from etcd. **No event is sent to the Application controller** because it has no Pod Informer.

However, if the Pod is managed by a Deployment, the Deployment's ReplicaSet controller *will* recreate it within seconds. KubeVela's self-healing operates at the higher Application level.

**Step 2: Periodic reconciliation fires (up to 5 min later)**

The re-sync timer triggers: `Reconcile(ctx, Request{Name: "my-app"})`. The work queue picks up the Application for reconciliation.

**Step 3: ResourceTracker lookup**

The reconciler fetches the Application CR, then retrieves its associated ResourceTracker(s). The tracker lists all expected resources with their full specs.

**Step 4: Health check & drift detection**

For each `ManagedResource` in the tracker, the controller does:

```go
r.Get(ctx, namespacedName, &obj)
if apierrors.IsNotFound(err) {
    // Resource should exist but doesn't! Re-apply it.
    r.Apply(ctx, desiredSpec)
}
```

If the resource exists but has drifted from desired state, server-side apply corrects it.

**Step 5: Recreation & requeue**

Missing or drifted resources are re-applied. The Application status is updated. The controller requeues for the next health check cycle:

```go
return ctrl.Result{RequeueAfter: 5 * time.Minute}, nil
```

:::info Layered self-healing
In practice, KubeVela's self-healing works *in concert* with Kubernetes' built-in controllers. If you delete a Pod managed by a Deployment, the ReplicaSet controller recreates it within seconds. KubeVela's 5-minute cycle handles higher-level drift: deleted Deployments, modified Services, missing ConfigMaps, or entire resource graphs that need reconstruction.
:::

## 6. Event Filtering: Preventing Infinite Loops

Every Kubernetes controller that updates its own `status` during reconciliation risks an infinite loop: the status update fires an event, which triggers another reconcile, which updates status again. KubeVela's Application controller is especially prone to this — a single reconcile can update workflow progress, health results, and applied resource lists, each generating an event.

KubeVela solves this with **event predicates** — filters that decide whether an update event is worth reacting to. The core idea is simple: **only reconcile when a human (or external system) changed the spec, or when it's time for a periodic health check.** Everything else is the controller talking to itself and can be safely ignored.

| What changed? | Decision | Why |
|---|---|---|
| User edited the `spec` (generation incremented) | ✓ Reconcile | User intent — always honor |
| Periodic re-sync (old == new) | ✓ Reconcile | Health check trigger |
| Workflow progress, phase transitions, applied resources | ✗ Skip | Controller's own writes — not user action |
| `managedFields` or `resourceVersion` only | ✗ Skip | API server bookkeeping |

:::info ResourceTracker: delete-only trigger
The ResourceTracker faces the same loop risk — the controller updates it during every reconcile to record newly dispatched resources. KubeVela's solution is aggressive: by default, ResourceTracker events **only** trigger a reconcile when the tracker is being *deleted*. All create and update events are silently dropped.

This works because the controller already reconciles Applications periodically — it doesn't need RT update events to do its job. The only RT event that matters is deletion, which signals garbage collection in progress and requires the owning Application to respond.
:::

## 7. `.Watches()` vs `.Owns()`

`controller-runtime` provides two ways to watch related resources. Understanding the difference is key to understanding KubeVela's design choice.

**`.Owns()`**

- Automatically maps child → parent via OwnerReference
- Requires child to have `ownerReferences` pointing to parent
- One Informer per child type
- Cannot work cross-namespace (OwnerRef is namespace-scoped)
- Cannot work cross-cluster

**`.Watches()`**

- Requires a custom mapping function (`EnqueueRequestsFromMapFunc`)
- Can use any logic to map source → target (labels, annotations, any field)
- Only watches the source type you specify
- Can map across namespaces
- Can map across clusters (with custom client)

![Figure 4 — Two paths from a child event to the Application reconcile queue](/img/blog/resourcetracker-pattern/figure-4-owns-vs-watches.png)

*Figure 4 — `.Owns()` reads OwnerReferences from each child type's Informer; `.Watches()` reads only ResourceTracker labels via the custom MapFunc `findObjectForResourceTracker`.*

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

Instead of OwnerReference (which is embedded in the child object's metadata), this function uses **labels** on the ResourceTracker (`app.oam.dev/name`, `app.oam.dev/namespace`) to find the owning Application. This decouples the mapping from Kubernetes' built-in ownership model, enabling cross-namespace and cross-cluster scenarios.

## 8. Pattern Comparison

| Aspect | Traditional `.Owns()` | KubeVela ResourceTracker |
|---|---|---|
| Informers needed | One per child type — O(n) | Three total — O(1) |
| Memory cache | All instances of each watched type | Only Applications, ResourceTrackers & PolicyDefinitions |
| Detection latency | Milliseconds (event-driven) | Up to 5 min (periodic) |
| New CRD support | Requires code change + controller restart | Automatic — no changes needed |
| Cross-namespace | ✗ Not supported (OwnerRef is namespace-scoped) | ✓ Supported via label-based mapping |
| Cross-cluster | ✗ Not supported | ✓ Supported (`ClusterObjectReference`) |
| API server watch streams | One per resource type | Three total |
| Garbage collection | Kubernetes built-in (cascading delete via OwnerRef) | Custom GC with versioned tracking & two-phase delete |
| Rollback support | Not built-in | Versioned ResourceTrackers enable revision history |
| Implementation complexity | Simple (1 line per type) | Significant (custom CRD, GC logic, health pipeline) |

## 9. Why KubeVela Chose This Design

The ResourceTracker pattern isn't just a performance optimization. It reflects several fundamental architectural decisions:

### 1. Type agnosticism

KubeVela's core value proposition is that users define workloads using CUE templates (ComponentDefinitions, TraitDefinitions), which can output *any* Kubernetes resource type. The controller cannot know at compile time what resource types it will need to manage. The `.Owns()` pattern requires compile-time registration of each type, making it fundamentally incompatible with KubeVela's extensibility model.

### 2. Multicluster resource management

KubeVela distributes workloads across multiple clusters via its cluster gateway. OwnerReferences only work within a single cluster (they reference objects by UID, which is cluster-scoped). ResourceTracker uses `ClusterObjectReference`, which includes a `cluster` field, enabling tracking of resources across cluster boundaries.

### 3. Version-aware lifecycle management

With versioned ResourceTrackers, KubeVela maintains a history of which resources belonged to which Application revision. This enables:

- **Rollback:** re-activate a previous version's ResourceTracker (via the `app.oam.dev/publishVersion` annotation) to restore the exact set of resources from that revision
- **Safe GC:** old versioned ResourceTrackers are kept as history; their resources are only garbage collected once a newer RT has taken over managing them

### 4. Separation of concerns

The ResourceTracker creates a clear boundary between the *rendering pipeline* (CUE evaluation → resource generation) and the *dispatch pipeline* (apply resources, track state, self-heal). The rendering pipeline writes to the tracker; the dispatch pipeline reads from it. Neither needs to understand the other's internals.

### 5. Bounded resource consumption

In a cluster with 100 CRD types and 50,000 total resources, the `.Owns()` approach would cache all 50,000 resources across 100 Informers. KubeVela's approach caches only Application, ResourceTracker, and PolicyDefinition objects — typically orders of magnitude fewer. Memory usage is proportional to the number of *Applications*, not the number of *managed resources* or *resource types*.

:::warning The trade-off is real
This isn't a free lunch. The periodic reconciliation model means:

- Detection latency of up to 5 minutes (configurable via `ApplicationReSyncPeriod`)
- API server load from periodic GET requests for every tracked resource
- More complex garbage collection logic than Kubernetes' built-in cascading delete
- The controller must handle stale ResourceTracker data gracefully

For KubeVela's use case as a platform engine managing diverse, dynamic workloads across clusters, these trade-offs are well worth it.
:::

## 10. OwnerReference Handling: client-go vs controller-runtime

To fully appreciate the ResourceTracker pattern, it helps to understand the standard approach it replaces. Kubernetes controllers need to answer one question when a child resource changes: **"which parent should I reconcile?"** The ecosystem offers three answers at increasing levels of abstraction.

### The ownership problem

When a Deployment is deleted, the controller that created it needs to know. But Kubernetes doesn't automatically notify "whoever created this resource." Instead, the controller must:

1. **Watch** the child resource type (set up an Informer)
2. **Receive** the deletion event
3. **Map** the child back to its parent (find who owns it)
4. **Enqueue** the parent for reconciliation

The mechanism for step 3 is the **OwnerReference** — a field embedded in the child's metadata that points back to its parent:

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

How you set this up, and how much of it you write yourself, depends on which abstraction layer you use.

### Level 1: Raw client-go (maximum control)

Kubernetes' own [sample-controller](https://github.com/kubernetes/sample-controller) uses raw client-go. You build every piece of the pipeline manually:

:::warning What you write yourself
For **each child resource type** you want to watch, you must:

- Create a **SharedInformerFactory** and extract the typed Informer
- Register **three event handlers** (Add, Update, Delete)
- In each handler: extract the **OwnerReference** from the child object
- Verify the owner is your **specific CRD Kind**
- Look up the parent using a **Lister**
- Enqueue the parent key into the **work queue**

**Cost:** ~100 lines of boilerplate per child type. For 3 child types, that's 9 handler functions and ~300 lines.
:::

You also manually build the OwnerReference when creating children. Every field — `apiVersion`, `kind`, `name`, `uid`, `controller: true` — is your responsibility to set correctly.

### Level 2: controller-runtime `.Owns()` (automated wiring)

The controller-runtime framework (used by Kubebuilder and Operator SDK) collapses the entire client-go pipeline into a single method call:

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
| Create Informer | NewSharedInformerFactory + typed getter | Auto-created from the GVK |
| Register handlers | AddEventHandler with 3 functions | Uses built-in `EnqueueRequestForOwner` |
| Extract OwnerRef | GetControllerOf + Kind check | Automatic: matches Kind + APIVersion + controller flag |
| Enqueue parent | workqueue.Add(key) | Returns `reconcile.Request` automatically |
| Set OwnerRef on create | Build OwnerReferences array manually | One-liner: `ctrl.SetControllerReference()` |

:::tip The result
Watching 3 child types goes from **~300 lines** (client-go) to **3 lines** (controller-runtime). The abstraction is nearly perfect for operators with a known, fixed set of child types.
:::

### Level 3: KubeVela ResourceTracker (type-agnostic)

Both client-go and controller-runtime share a fundamental assumption: **you know your child types at compile time.** Each type needs explicit registration — whether that's 100 lines (client-go) or 1 line (`.Owns()`) per type.

KubeVela breaks this assumption entirely:

```go
// KubeVela's entire watch setup — handles ANY managed resource type
ctrl.NewControllerManagedBy(mgr).
    For(&v1beta1.Application{}).
    Watches(&v1beta1.ResourceTracker{}, ...).
    Watches(&v1beta1.PolicyDefinition{}, ...).
    Complete(r)
// Three Informers total — Application, ResourceTracker, PolicyDefinition.
// None of them is a managed child. Handles Pods, Deployments, Services,
// Istio VirtualServices, Crossplane RDS instances, user-defined CRDs —
// anything, dynamically, with zero .Owns() calls.
```

Instead of registering a watch per type, the ResourceTracker *records* what was created. Instead of OwnerReference-based event-driven mapping, the controller *periodically checks* if tracked resources still exist. The ownership model moves from "embedded in the child" to "recorded in a manifest."

### The abstraction spectrum

![Figure 5 — Three abstraction levels for child-resource ownership, at a glance](/img/blog/resourcetracker-pattern/figure-5-abstraction-spectrum.png)

*Figure 5 — Levels 1 and 2 differ only in code size, not capability; Level 3 is the only one that breaks the same-namespace, fixed-types ceiling. Color-coded values: red = constraint, amber = neutral / caveat, green = unrestricted.*

:::info Choosing your level
Each level trades simplicity for flexibility:

- **client-go** — use when you need extremely custom event handling logic that controller-runtime's abstractions don't support (rare).
- **controller-runtime `.Owns()`** — the right choice for 95% of operators. If you know your child types and they're in the same namespace, start here.
- **ResourceTracker pattern** — use when building a *platform* that manages dynamic, user-defined resource types across namespace or cluster boundaries. The added complexity is justified only when `.Owns()` fundamentally cannot work.
:::

## 11. Choosing Your Pattern

**Use `.Owns()` when:**

- Managing 2–10 known resource types
- All resources are in the same namespace
- Single-cluster only
- Immediate event-driven self-healing is required
- You want Kubernetes' built-in cascading delete
- Simplicity is more important than scalability

**Consider ResourceTracker when:**

- Managing unknown or user-defined resource types
- Resources span multiple namespaces or clusters
- Resource type count is large or unbounded
- You need version-aware resource tracking
- Memory efficiency at scale is critical
- Eventual consistency (seconds to minutes) is acceptable

:::tip The bottom line
The ResourceTracker pattern is not a replacement for `.Owns()` — it's a solution for a fundamentally different problem. Traditional operators know their child types at compile time; platform engines like KubeVela don't. If you're building a simple operator, use `.Owns()`. If you're building a platform that manages dynamic, user-defined workloads across cluster boundaries, study how KubeVela's ResourceTracker achieves type-agnostic self-healing with bounded resource consumption.
:::

## 12. Case Study: Crossplane RBAC Manager OOMs at Scale

The architectural argument so far has been theoretical: *unbounded watches make controller memory grow with cluster size.* Here is a production failure that shows what that growth actually looks like, and why KubeVela's Application controller is structurally immune to it.

### What happened

A team running Crossplane on a fleet of Kubernetes clusters noticed something strange: the `crossplane-rbac-manager` pod was crash-looping on one cluster while staying perfectly healthy on every other cluster running the **identical Helm release** — same image, same providers, same arguments, same `2 GiB` memory limit. Over a 13-day window, the affected pod recorded:

- **56 `OOMKilled` events** (exit code 137) — roughly four kills per day
- Each crash arrived within **~20 seconds of pod start**, during the initial informer cache synchronization
- Periodic re-kills aligned with the controller's hourly `SyncPeriod` cache re-LIST — the moment controller-runtime re-fetches every watched object from the API server

In stretches where the pod did stay alive, its steady-state memory usage hovered around `293 MiB` — under one-seventh of the limit. This wasn't a slow leak being chased to exhaustion: the pod ran comfortably for hours, then died in a single sub-minute spike during a re-LIST.

What looked like a memory leak wasn't one. By every Crossplane-internal metric, the controller was healthy: it was managing roughly **36 ProviderRevisions** and **680 ClusterRoles**, both well within design parameters. The growth driver was external to Crossplane's own resource graph — something none of those numbers captured.

The only meaningful difference between the affected cluster and the healthy ones was the cluster's **total Deployment count**:

| Cluster | Total Deployments | RBAC manager status |
|---|---|---|
| Affected cluster | **6,073** | OOMKilled, 56 restarts in 13 days |
| All sister clusters | &lt; 600 | Healthy, zero restarts |

A roughly 10× ratio in cluster Deployment density. Nothing else differed.

### The cause

Inside the RBAC manager's binding controller (`internal/controller/rbac/provider/binding/reconciler.go`):

```go
ctrl.NewControllerManagedBy(mgr).
    For(&v1.ProviderRevision{}).
    Owns(&rbacv1.ClusterRoleBinding{}).
    Watches(&appsv1.Deployment{}, ...)   // caches ALL Deployments cluster-wide
```

There is no namespace filter, no field selector, no `cache.ByObject` constraint. **Every Deployment in the cluster — regardless of who created it — is materialized in the controller's informer cache.** The cache cost is `O(cluster Deployment count)`, not `O(Crossplane managed resources)`.

With ~600 Deployments the cache fits comfortably in 2 GiB. With 6,073 Deployments, the periodic re-LIST event occasionally pushes the working set past 2 GiB and the kernel OOM-killer terminates the process. The same Helm chart, the same providers, the same memory limit — only the number of unrelated Deployments in the cluster differs, and that's enough to crash the controller.

### Why KubeVela doesn't have this failure mode

KubeVela's Application controller does not watch `Deployment` at all. Its `SetupWithManager` registers exactly three Informers — `Application`, `ResourceTracker`, `PolicyDefinition` — and that set is fixed regardless of what users build with KubeVela. Pods, Deployments, Services, Ingresses, custom CRDs: none of them are in the controller's cache. The cluster could have 60 Deployments or 60,000; the controller's memory footprint is identical.

The structural property: **the controller's memory profile is decoupled from the cluster's resource inventory.** It scales with the number of *Applications you've defined*, not with the count of anything else in the cluster.

| | Crossplane RBAC manager | KubeVela Application controller |
|---|---|---|
| Watches `Deployment` | Yes (unfiltered, cluster-wide) | No |
| Cache footprint scales with | Total Deployments in cluster | Number of Applications defined |
| Effect of growing cluster | Memory grows linearly → eventual OOM | No effect |
| 6,000 Deployments outcome | OOMKilled, 56 restarts in 13 days | Unchanged |
| Mitigation needed | Raise limit, lower concurrency, add filters | None — bounded by design |

### The lesson

Any controller that uses `.Owns()` or unfiltered `.Watches()` on a high-cardinality, cluster-scoped Kubernetes type inherits that type's growth as a memory cost. The bug is not in the cluster size — it's in the watch set. Crossplane's RBAC manager works correctly at small scale because the watch set's cost stays under the limit; it fails at large scale because nothing in the controller's design ever bounded that cost.

The ResourceTracker pattern doesn't try to filter the watch set — it removes the high-cardinality types from the watch set entirely, replacing direct watching with a record-and-poll model. That's why memory consumption is bounded by *what KubeVela manages*, not by *what else exists in the cluster*. It's a real architectural difference with real production consequences, not a stylistic choice.

---

**References**

- KubeVela source: [github.com/kubevela/kubevela](https://github.com/kubevela/kubevela)
- Application controller: [`pkg/controller/core.oam.dev/v1beta1/application/application_controller.go`](https://github.com/kubevela/kubevela/blob/master/pkg/controller/core.oam.dev/v1beta1/application/application_controller.go)
- ResourceTracker types: [`apis/core.oam.dev/v1beta1/resourcetracker_types.go`](https://github.com/kubevela/kubevela/blob/master/apis/core.oam.dev/v1beta1/resourcetracker_types.go)
- Kubernetes sample-controller: [github.com/kubernetes/sample-controller](https://github.com/kubernetes/sample-controller)
- controller-runtime: [github.com/kubernetes-sigs/controller-runtime](https://github.com/kubernetes-sigs/controller-runtime)
