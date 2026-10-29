---
title: Per-Application Reconciliation Interval
description: Override the global application re-sync period for a single Application with the app.oam.dev/reconcile-interval annotation.
---

## Overview

By default, every Application shares the cluster-wide re-sync period controlled by `--application-re-sync-period` (default `5m`). That interval drives periodic State Keep: after an Application is running or suspended without errors, the controller requeues it so configuration drift can be corrected.

Different Applications often need different cadences. A production checkout service may want drift detection every minute. A quiet staging experiment can wait 15 minutes and put less load on the API server. The `app.oam.dev/reconcile-interval` annotation lets you set that interval per Application without changing the global flag.

Availability: `app.oam.dev/reconcile-interval` is supported in KubeVela v1.11+.

## When to use it

- Faster drift detection for critical production Applications
- Slower reconciliation for low-priority or rarely changing Applications, to reduce API server load
- Keeping a short interval on selected Applications even when the cluster-wide period is raised (for example under `ApplyOnce`)

## Annotation format

| Item | Value |
| --- | --- |
| Annotation key | `app.oam.dev/reconcile-interval` |
| Format | Any valid [Go duration](https://pkg.go.dev/time#ParseDuration) string |
| Examples | `30s`, `1m`, `5m`, `15m`, `1h` |
| Minimum floor | `10s`. Values below this are ignored; the controller falls back to the global default and logs a warning |

Invalid values (empty string, malformed text, negative durations) are also ignored with the same warning and fallback behavior.

## Precedence

The annotation always takes priority over the global `--application-re-sync-period`, including when the `ApplyOnce` feature gate raises that global period (for example to 10 hours). An opted-in Application can therefore keep fast drift detection on an `ApplyOnce` cluster.

When the annotation is absent, the Application uses the global default as before.

## Scope

The annotation only changes the post-reconcile requeue interval (the periodic State Keep cadence). Other reconcile triggers still fire immediately:

- Application spec changes
- Events on owned resources
- Status updates

## Examples

### Faster reconciliation for a production app

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

### Slower reconciliation for a low-priority staging app

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

### Set or clear with kubectl

```bash
# Set a 1-minute interval
kubectl annotate application prod-checkout \
  app.oam.dev/reconcile-interval=1m -n <namespace> --overwrite

# Remove the annotation and fall back to the global period
kubectl annotate application prod-checkout \
  app.oam.dev/reconcile-interval- -n <namespace>
```

## Related controls

| Control | Effect on reconciliation |
| --- | --- |
| `app.oam.dev/reconcile-interval` | Changes how often periodic State Keep requeues this Application |
| [`controller.core.oam.dev/pause`](./suspending-application-reconciliation.md) | Stops reconciliation for the Application entirely |
| [`apply-once` policy](../policies/apply-once.md) | Reconciliation continues, but selected fields are not reverted |
| `--application-re-sync-period` | Cluster-wide default interval; see [bootstrap parameters](../../platform-engineers/system-operation/bootstrap-parameters.md) |
