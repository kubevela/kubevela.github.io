---
title: KubeVela Controller Metrics
---

The KubeVela controller (vela-core) serves Prometheus metrics on port `8080` at `/metrics`. Use them to watch how Applications are doing and how hard the controller is working.

## Scrape them

How you collect them depends on which Prometheus you run.

### With the `prometheus-server` addon

Nothing to set. The controller's pods carry the `prometheus.io/scrape`, `prometheus.io/port` and `prometheus.io/path` annotations, and the addon scrapes any pod that has them.

```shell
vela addon enable prometheus-server
```

### With the Prometheus Operator

Turn on the metrics Service and a ServiceMonitor when you install or upgrade KubeVela:

```shell
helm upgrade --install kubevela kubevela/vela-core -n vela-system \
  --set core.metrics.enabled=true \
  --set core.metrics.serviceMonitor.enabled=true
```

The chart creates both only when the cluster already has the `monitoring.coreos.com/v1` API, so install the operator first. If your Prometheus selects ServiceMonitors by label, add it with `core.metrics.serviceMonitor.additionalLabels`.

## Check it works

Port-forward to the controller and fetch the metrics:

```shell
kubectl -n vela-system port-forward deploy/kubevela-vela-core 8080
curl -s localhost:8080/metrics | grep '^kubevela_app'
```

## What to watch

The three `kubevela_application_*` metrics are off by default. Turn them on with the `EnableApplicationStatusMetrics` feature gate:

```shell
helm upgrade --install kubevela kubevela/vela-core -n vela-system --reuse-values \
  --set featureGates.enableApplicationStatusMetrics=true
```

| Metric | What it tells you |
| --- | --- |
| `kubevela_application_health_status` | 1 when an Application is healthy, 0 when not. |
| `kubevela_application_phase` | The Application's phase as a number (0 starting, 1 running, 2 rendering, 4 running its workflow, and so on). |
| `kubevela_application_workflow_phase` | The workflow's phase as a number (0 initializing, 1 succeeded, 2 executing, 3 suspending, 4 terminated, and so on). |
| `kubevela_app_reconcile_time_seconds` | How long each Application reconcile takes. |

The controller also serves the standard controller-runtime metrics, such as `controller_runtime_reconcile_total` and `workqueue_depth`.

The **KubeVela System** dashboard that comes with the `grafana` addon is built on these metrics: see [KubeVela System](./out-of-the-box.md#kubevela-system).
