---
title: Customize Dashboard
---

The `grafana` addon ships the dashboards described in [Out-of-the-box](./out-of-the-box.md). You can add your own beside them, and manage them in an Application like any other resource: KubeVela writes each dashboard to Grafana through a `GrafanaDashboard` object, served by the `vela-prism` aggregated API.

:::tip
New to Grafana dashboards? These Grafana docs show how to build one and export it as JSON:
1. [Build your first dashboard](https://grafana.com/docs/grafana/latest/getting-started/build-first-dashboard/)
2. [Exporting a dashboard](https://grafana.com/docs/grafana/latest/dashboards/export-import/#exporting-a-dashboard)
:::

## Using Dashboard as Component

The `grafana-dashboard` component deploys a dashboard on its own. It comes from the `o11y-definitions` addon, which the `grafana` addon enables as a dependency, so it's there once Grafana is.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-dashboard
spec:
  components:
    - name: my-dashboard
      type: grafana-dashboard
      properties:
        uid: my-example-dashboard
        data: |
          {
            "panels": [{
                "gridPos": {
                    "h": 9,
                    "w": 12
                },
                "targets": [{
                    "datasource": {
                        "type": "prometheus",
                        "uid": "prometheus-vela"
                    },
                    "expr": "max(up) by (cluster)"
                }],
                "title": "Clusters",
                "type": "timeseries"
            }],
            "title": "My Dashboard"
          }
```

## Using Dashboard as Trait

To keep a dashboard with the application it watches, use the `grafana-dashboard` trait instead, also from `o11y-definitions`. The example below pairs it with the `prometheus-scrape` trait, which comes from the `prometheus-server` addon: it creates a Service named `<component>-prometheus-scrape` that Prometheus scrapes, so every query filters on `service="my-app-prometheus-scrape"`.

```shell
vela addon enable prometheus-server
vela addon enable grafana
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
spec:
  components:
    - name: my-app
      type: webservice
      properties:
        image: somefive/prometheus-client-example:new
      traits:
        - type: prometheus-scrape
        - type: grafana-dashboard
          properties:
            data: |
              {
                "uid": "my-app",
                "title": "My App",
                "time": { "from": "now-1h", "to": "now" },
                "refresh": "30s",
                "panels": [{
                    "title": "Targets up",
                    "type": "stat",
                    "gridPos": { "h": 8, "w": 6, "x": 0, "y": 0 },
                    "datasource": { "type": "prometheus", "uid": "prometheus-vela" },
                    "targets": [{
                        "expr": "sum(up{service=\"my-app-prometheus-scrape\"})"
                    }]
                }, {
                    "title": "RPC rate",
                    "type": "timeseries",
                    "gridPos": { "h": 8, "w": 9, "x": 6, "y": 0 },
                    "datasource": { "type": "prometheus", "uid": "prometheus-vela" },
                    "fieldConfig": { "defaults": { "unit": "reqps" } },
                    "targets": [{
                        "expr": "sum(rate(rpc_durations_histogram_seconds_count{service=\"my-app-prometheus-scrape\"}[$__rate_interval]))",
                        "legendFormat": "rpc/s"
                    }]
                }, {
                    "title": "RPC latency",
                    "type": "timeseries",
                    "gridPos": { "h": 8, "w": 9, "x": 15, "y": 0 },
                    "datasource": { "type": "prometheus", "uid": "prometheus-vela" },
                    "fieldConfig": { "defaults": { "unit": "s" } },
                    "targets": [{
                        "expr": "histogram_quantile(0.5, sum by (le) (rate(rpc_durations_histogram_seconds_bucket{service=\"my-app-prometheus-scrape\"}[$__rate_interval])))",
                        "legendFormat": "p50"
                    }, {
                        "expr": "histogram_quantile(0.99, sum by (le) (rate(rpc_durations_histogram_seconds_bucket{service=\"my-app-prometheus-scrape\"}[$__rate_interval])))",
                        "legendFormat": "p99"
                    }]
                }, {
                    "title": "CPU",
                    "type": "timeseries",
                    "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
                    "datasource": { "type": "prometheus", "uid": "prometheus-vela" },
                    "targets": [{
                        "expr": "sum by (instance) (rate(process_cpu_seconds_total{service=\"my-app-prometheus-scrape\"}[$__rate_interval]))",
                        "legendFormat": "{{instance}}"
                    }]
                }, {
                    "title": "Memory",
                    "type": "timeseries",
                    "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
                    "datasource": { "type": "prometheus", "uid": "prometheus-vela" },
                    "fieldConfig": { "defaults": { "unit": "bytes" } },
                    "targets": [{
                        "expr": "sum by (instance) (process_resident_memory_bytes{service=\"my-app-prometheus-scrape\"})",
                        "legendFormat": "{{instance}}"
                    }]
                }]
              }
```

## Import Dashboard from URL

If a dashboard's JSON is already served over HTTP, import it with the `import-grafana-dashboard` workflow step, also from `o11y-definitions`.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-dashboard
spec:
  components: []
  workflow:
    steps:
      - type: import-grafana-dashboard
        name: import-grafana-dashboard
        properties:
          uid: my-dashboard
          title: My Dashboard
          url: https://kubevelacharts.oss-accelerate.aliyuncs.com/dashboards/up-cluster-dashboard.json
```

The step downloads the dashboard JSON from the URL and creates the dashboard in Grafana under the given `uid` and `title`.
