---
title: Application Reconciliation Controls
description: Pause Application reconciliation, or override the per-Application State Keep interval with app.oam.dev/reconcile-interval.
---

KubeVela periodically reconciles Applications to keep resources in sync (State Keep). You can pause that loop for an Application, or change how often it runs, without changing cluster-wide controller flags.

| Control | Effect |
| --- | --- |
| `controller.core.oam.dev/pause` label | Stops reconciliation for the Application entirely |
| `app.oam.dev/reconcile-interval` annotation | Changes the post-reconcile requeue interval for that Application |

## Pause reconciliation

KubeVela skips reconciliation for an `Application` while the label is set to `"true"`. Reconciliation resumes when the label is removed or set to another value.

```yaml
metadata:
  labels:
    controller.core.oam.dev/pause: "true"
```

This is useful when you need to:

- Perform manual operations on underlying resources (e.g., debug/triage in staging) without KubeVela reverting your changes.
- Downscale or quiet non-critical services during weekends/off-hours.
- Prevent State Keep (periodic re-apply) from overwriting temporary/manual changes while you investigate incidents.

Availability: `controller.core.oam.dev/pause` is supported in KubeVela v1.9+. Older releases (≤ v1.8) do not support this label.

### How to use

Pause reconciliation

```bash
kubectl label application <app-name> \
  controller.core.oam.dev/pause=true -n <namespace> --overwrite
```

Resume reconciliation

```bash
# Remove the label
kubectl label application <app-name> controller.core.oam.dev/pause- -n <namespace>
```

Full YAML example

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
  namespace: staging
  labels:
    controller.core.oam.dev/pause: "true"
spec:
  components:
    - name: web
      type: webservice
      properties:
        image: ghcr.io/example/web:1.2.3
        port: 8080
```

### Expected outcome

While the label is set to `"true"`, the Application is ignored by the controller:

- No reconcile loop for that Application
- No State Keep (drift correction)
- No garbage collection of Application-owned resources

When you remove the label (or set it to something other than `"true"`), the controller resumes reconciliation and brings actual state back in line with the Application spec.

**Reminder:** Because reconcile is paused, any manual edits you make can drift from the desired spec. They will be reconciled back once you resume.

### Differences vs. other controls

| Control | Scope | Reconcile / State-Keep | Typical use case |
| --- | --- | --- | --- |
| **`controller.core.oam.dev/pause` label** | Whole Application | **Stopped** | Temporary, explicit hands-off period for the entire app (e.g., staging triage, maintenance) |
| **`app.oam.dev/reconcile-interval` annotation** | Whole Application | Runs on a **custom** State Keep cadence | Faster or slower periodic drift checks per app without changing the global `--application-re-sync-period` |
| **Workflow `suspend`** | Workflow engine only | **Continues** | Pause an in-progress workflow step (e.g., manual approval) while still maintaining desired state |
| **Workflow `terminate`** | Workflow engine only | Stops workflow; be careful with drift | Abort an executing workflow and later `restart` to re-run from the beginning |
| **Policy: `apply-once`** | Selected fields/resources | Runs, but **skips** chosen fields | Let other controllers (HPA/KEDA/Istio) mutate fields like `spec.replicas` without Vela fighting back |
| **Policy: `read-only`** | Selected resources | Runs, does **not** update selected resources | Freeze updates to specific resources while keeping the Application active |

### Best practices

- Use labels intentionally: Add the pause label only when you need a hands-off window; remove it as soon as you're done.
- Audit & visibility: Label changes are regular Kubernetes metadata updates. Monitor via Events/audit logs.
- Staging first: Prefer pausing in staging or non-prod contexts. In production, consider safer alternatives (e.g., apply-once on replicas + KEDA/CronHPA) unless you fully understand the operational impact.
- Multi-cluster: Pausing happens at the control plane (where the Application lives). No further changes will be pushed to registered target clusters while paused.

## Per-application reconcile interval

By default, every Application shares the cluster-wide re-sync period controlled by `--application-re-sync-period` (default `5m`). That interval drives periodic State Keep after an Application is running or suspended without errors.

Different Applications often need different cadences. A production checkout service may want drift detection every minute. A quiet staging experiment can wait 15 minutes and put less load on the API server. The `app.oam.dev/reconcile-interval` annotation sets that interval per Application without changing the global flag.

Availability: `app.oam.dev/reconcile-interval` is supported in KubeVela v1.11+.

### When to use it

- Faster drift detection for critical production Applications
- Slower reconciliation for low-priority or rarely changing Applications, to reduce API server load
- Keeping a shorter requeue interval on selected Applications when the cluster-wide `--application-re-sync-period` is raised

### Annotation format

| Item | Value |
| --- | --- |
| Annotation key | `app.oam.dev/reconcile-interval` |
| Format | Any valid [Go duration](https://pkg.go.dev/time#ParseDuration) string |
| Examples | `30s`, `1m`, `5m`, `15m`, `1h` |
| Minimum floor | `10s`. Values below this are ignored; the controller falls back to the global default and logs a warning |

Invalid values (empty string, malformed text, negative durations) are also ignored with the same warning and fallback behavior.

### Precedence

The annotation always takes priority over the global `--application-re-sync-period`. When the annotation is absent, the Application uses the global default as before.

Enabling the `ApplyOnce` feature gate sets that global period to `--informer-sync-period` (default `10h`) and disables State Keep for the cluster. The annotation can still shorten the requeue interval for an opted-in Application, but it does not turn State Keep back on. See [bootstrap parameters](../../platform-engineers/system-operation/bootstrap-parameters.md) for the gate and related flags. This is separate from the per-Application [`apply-once` policy](../policies/apply-once.md), which skips selected fields while State Keep continues.

### Scope

The annotation only changes the post-reconcile requeue interval. Periodic State Keep uses that interval only when State Keep is enabled. Other reconcile triggers still fire immediately:

- Application spec changes
- Events on owned resources
- Status updates

### Examples

Faster reconciliation for a production app:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: prod-checkout
  annotations:
    app.oam.dev/reconcile-interval: "1m"
spec:
  components:
    - name: checkout
      type: webservice
      properties:
        image: example/checkout:v1
```

Slower reconciliation for a low-priority staging app:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: staging-experiment
  annotations:
    app.oam.dev/reconcile-interval: "15m"
spec:
  components:
    - name: experiment
      type: webservice
      properties:
        image: example/experiment:dev
```

Set or clear with kubectl:

```bash
# Set a 1-minute interval
kubectl annotate application prod-checkout \
  app.oam.dev/reconcile-interval=1m -n <namespace> --overwrite

# Remove the annotation and fall back to the global period
kubectl annotate application prod-checkout \
  app.oam.dev/reconcile-interval- -n <namespace>
```
