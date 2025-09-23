---
title: Pause Application Reconciliation
description: How to temporarily stop KubeVela from reconciling an Application using the controller.core.oam.dev/pause label.
# sidebar_position: 20
---

## Dependency

KubeVela can **temporarily ignore** an `Application` when you add the label:

```yaml
metadata:
  labels:
    controller.core.oam.dev/pause: "true"
```

This is useful when you need to:

Perform manual operations on underlying resources (e.g., debug/triage in staging) without KubeVela reverting your changes.

Downscale or quiet non-critical services during weekends/off-hours.

Prevent State Keep (periodic re-apply) from overwriting temporary/manual changes while you investigate incidents.

Availability: controller.core.oam.dev/pause is supported in KubeVela v1.9+. Older releases (≤ v1.8) do not support this label.


### How to Use

Pause reconciliation

```yaml
kubectl label application <app-name> \
  controller.core.oam.dev/pause=true -n <namespace> --overwrite
```

Resume reconciliation

```yaml
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

### Expected Outcome

While the label is set to "true", the Application is ignored by the controller:

- No reconcile loop for that Application

- No State Keep (drift correction)

- No garbage collection of Application-owned resources

When you remove the label (or set it to something other than "true"), the controller resumes reconciliation and brings actual state back in line with the Application spec.


**Reminder:** Because reconcile is paused, any manual edits you make can drift from the desired spec. They will be reconciled back once you resume.


## Differences vs. other controls

| Control                                   | Scope                     | Reconcile / State-Keep                       | Typical use case                                                                                     |
| ----------------------------------------- | ------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **`controller.core.oam.dev/pause` label** | Whole Application         | **Stopped**                                  | Temporary, explicit “hands-off” period for the entire app (e.g., staging triage, maintenance)        |
| **Workflow `suspend`**                    | Workflow engine only      | **Continues**                                | Pause an in-progress workflow step (e.g., manual approval) while still maintaining desired state     |
| **Workflow `terminate`**                  | Workflow engine only      | Stops workflow; be careful with drift        | Abort an executing workflow and later `restart` to re-run from the beginning                         |
| **Policy: `apply-once`**                  | Selected fields/resources | Runs, but **skips** chosen fields            | Let other controllers (HPA/KEDA/Istio) mutate fields like `spec.replicas` without Vela fighting back |
| **Policy: `read-only`**                   | Selected resources        | Runs, does **not** update selected resources | Freeze updates to specific resources while keeping the Application active                            |



## Best practices
- Use labels intentionally: Add the pause label only when you need a hands-off window; remove it as soon as you’re done.

- Audit & visibility: Label changes are regular Kubernetes metadata updates—monitor via Events/audit logs.

- Staging first: Prefer pausing in staging or non-prod contexts. In production, consider safer alternatives (e.g., apply-once on replicas + KEDA/CronHPA) unless you fully understand the operational impact.

- Multi-cluster: Pausing happens at the control plane (where the Application lives). No further changes will be pushed to registered target clusters while paused.