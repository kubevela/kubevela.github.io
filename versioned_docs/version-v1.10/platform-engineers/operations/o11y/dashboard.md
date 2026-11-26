---
title: Customize Dashboard
---

In KubeVela, leveraging the power of Kubernetes Aggregated API layer, it is easy for users to manipulate dashboards on Grafana and make customizations to application visualizations.

Except for the pre-defined dashboards provided by the `grafana` addon as mentioned in the [Out-of-the-box](./out-of-the-box.md) chapter, KubeVela users can deploy customized dashboards to their system as well.

:::tip
If you do not know how to build Grafana dashboards and export them as json data, you can refer to the following Grafana docs for details.
1. [Build your first dashboard](https://grafana.com/docs/grafana/latest/getting-started/build-first-dashboard/)
2. [Exporting a dashboard](https://grafana.com/docs/grafana/latest/dashboards/export-import/#exporting-a-dashboard)
:::

## Using Dashboard as Component 

One way to manage your customized dashboard is to use the component in KubeVela application like below.

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

An alternative way for adding customized dashboard to your application is to use the `grafana-dashboard` trait.

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

Sometimes, you might already have some Grafana dashboards stored in OSS or served by other HTTP server. To import these dashboards in your system, you can leverage the `import-grafana-dashboard` workflow step as below.

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

In the `import-grafana-dashboard` step, the application will download the dashboard json from the URL and create dashboards on Grafana with correct format.

## Using CUE to Generate Dashboards Dynamically

:::danger
The following chapter requires you to have experiences in writing CUE language, especially complex KubeVela WorkflowStepDefinitions. Besides, it is also necessary to know the basic structure of Grafana dashboards. Without these knowledge, it would be relatively hard for users to understand the following section.

This demo is a proof of concept for Dashboard as Code with the use of KubeVela. There is still much work to be done for making it into practice, including dealing the late occurrence of some lazy metrics. It is not for production system for now. Do not expect it to work perfectly. It is welcome to submit your ideas and use cases on [GitHub](https://github.com/kubevela/kubevela/issues).
:::

<details>

With CUE, you can customize the process of creating dashboards. This will empower you to construct dashboards dynamically and combined with other actions. For example, you can make a WorkflowStepDefinition called `create-dashboard`, which finds the service created by the application itself and get the metrics from the exposed endpoint. Then, the step will build Grafana dashboard panels from those metrics automatically.

```cue
import (
	"vela/op"
	"vela/ql"
	"strconv"
	"math"
	"regexp"
)

"create-dashboard": {
	type: "workflow-step"
	annotations: {}
	labels: {}
	description: "Create dashboard for application."
}
template: {
    resources: ql.#CollectServiceEndpoints & {
		app: {
			name:      context.name
			namespace: context.namespace
			filter: {}
		}
	} @step(1)

    status: {
		endpoints: *[] | [...{...}]
		if resources.err == _|_ && resources.list != _|_ {
			endpoints: [ for ep in resources.list if ep.endpoint.port == parameter.port {
                name: "\(ep.ref.name):\(ep.ref.namespace):\(ep.cluster)"
				portStr: strconv.FormatInt(ep.endpoint.port, 10)
				if ep.cluster == "local" && ep.ref.kind == "Service" {
					url: "http://\(ep.ref.name).\(ep.ref.namespace):\(portStr)"
				}
				if ep.cluster != "local" || ep.ref.kind != "Service" {
					url: "http://\(ep.endpoint.host):\(portStr)"
				}
			}]
		}
	} @step(2)

    getMetrics: op.#Steps & {
        for ep in status.endpoints {
            "\(ep.name)": op.#HTTPGet & {
                url: ep.url + "/metrics"
            }
        }
    } @step(3)

    checkErrors: op.#Steps & {
        for ep in status.endpoints if getMetrics["\(ep.name)"] != _|_ {
            if getMetrics["\(ep.name)"].response.statusCode != 200 {
                "\(ep.name)": op.#Steps & {
                    src: getMetrics["\(ep.name)"]
                    err: op.#Fail & {
                        message: "failed to get metrics for \(ep.name) from \(ep.url), code \(src.response.statusCode)"
                    }
                }
            }
        }
    } @step(4)

    createDashboards: op.#Steps & {
        for ep in status.endpoints if getMetrics["\(ep.name)"] != _|_ {
            if getMetrics["\(ep.name)"].response.body != "" {
                "\(ep.name)": dashboard & {
                    title: context.name
                    uid: "\(context.name)-\(context.namespace)"
                    description: "Auto-generated Dashboard"
                    metrics: *[] | [...{...}]
                    metrics: regexp.FindAllNamedSubmatch(#"""
                        # HELP \w+ (?P<desc>[^\n]+)\n# TYPE (?P<name>\w+) (?P<type>\w+)
                        """#, getMetrics["\(ep.name)"].response.body, -1)
                }
            }
        }
    } @step(5)

    applyDashboards: op.#Steps & {
        for ep in status.endpoints if createDashboards["\(ep.name)"] != _|_ {
            "\(ep.name)": op.#Apply & {
                db: {for k, v in createDashboards["\(ep.name)"] if k != "metrics" {
                    "\(k)": v
                }}
                value: {
                    apiVersion: "o11y.prism.oam.dev/v1alpha1"
                    kind:       "GrafanaDashboard"
                    metadata: name: "\(db.uid)@\(parameter.grafana)"
                    spec: db
                }
            }
        }
    } @step(6)

    dashboard: {
        title: *"Example Dashboard" | string
        uid: *"" | string
        description: *"" | string
        metrics: [...{...}]
        time: {
            from: *"now-1h" | string
            to: *"now" | string
        }
        refresh: *"30s" | string
        templating: list: [{
            type: "datasource"
            name: "datasource"
            label: "Data Source"
            query: "prometheus"
            hide: 2
        }, {
            type: "interval"
            name: "rate_interval"
            label: "Rate"
            query: "3m,5m,10m,30m"
            hide: 2
        }]

        panels: [for i, m in metrics {
            title: m.name
            type: "graph"
            datasource: {
                uid: "${datasource}"
                type: "prometheus"
            }
            gridPos: {
                w: 6
                h: 8
                x: math.Floor((i - y * 4) * 6)
                y: math.Floor(i / 4)
            }
            description: m.desc
            if m.type == "gauge" {
                targets: [{
                    expr: "sum(\(m.name))"
                }]
                legend: show: false
            }
            if m.type == "counter" {
                targets: [{
                    expr: "sum(rate(\(m.name)[$rate_interval]))"
                }]
                legend: show: false
            }
            if m.type == "histogram" || m.type == "summary" {
                targets: [{
                    expr: "sum(rate(\(m.name)_sum[$rate_interval])) / sum(rate(\(m.name)_count[$rate_interval]))"
                    legendFormat: "avg"
                }, {
                    expr: "histogram_quantile(0.75, sum(rate(\(m.name)_bucket[$rate_interval])) by (le))"
                    legendFormat: "p75"
                }, {
                    expr: "histogram_quantile(0.99, sum(rate(\(m.name)_bucket[$rate_interval])) by (le))"
                    legendFormat: "p99"
                }]
            }
        }]
    }

	parameter: {
		port: *8080 | int
		grafana: *"default" | string
	}
}
```

Then you can create an application as follows.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
spec:
  # the core workload
  components:
    - name: my-app
      type: webservice
      properties:
        image: somefive/prometheus-client-example:new
      traits:
        - type: prometheus-scrape
  # deploy and create dashboard automatically
  workflow:
    steps:
      - type: deploy
        name: deploy
        properties:
          policies: []
      - type: create-dashboard
        name: create-dashboard
```

This application will deploy your webservice first, and generate dashboard automatically according to the metrics collected from the webservice.

</details>