---
title: Addon Catalog
---

Addons extend KubeVela with components, traits, config templates and the controllers they need. The addons below are in the default registry ([kubevela/catalog](https://github.com/kubevela/catalog/tree/master/addons)) unless marked. Enable one with `vela addon enable <name>`; see [Make Your Own Addon](./developer/make-your-own-addon.md) to write your own.

Many addons install their software from a Helm chart, so they depend on `fluxcd` and enable it for you. Each addon's source and README are in the catalog, under `addons/<name>`.

## KubeVela platform

| Addon | What it gives you |
| --- | --- |
| [velaux](/velaux/getting-started/install) | VelaUX, the KubeVela web console, and its API server. |
| [vela-prism](./vela-prism.md) | An aggregated API server that serves KubeVela objects, such as application resource trackers and clusters, as Kubernetes APIs. VelaUX and the observability addons use it. |
| [vela-workflow](/workflow/guides/workflowrun) | The standalone workflow controller, for `WorkflowRun` pipelines that run without an Application, plus steps such as `apply-app`, `read-app` and `addon-operation`. |
| [vela-core-shard-manager](/docs/platform-engineers/system-operation/controller-sharding) | Extra vela-core controllers for sharding, copied from the main controller's configuration. |
| [kube-trigger](https://github.com/kubevela/catalog/tree/master/addons/kube-trigger) | The kube-trigger controller and the `trigger-service` component: watch Kubernetes objects and act when they change, for example to update an Application when a ConfigMap it reads changes. |
| [cloudshell](/velaux/guides/applications/cloud-shell) | A terminal in the browser, opened from VelaUX, with `vela` and `kubectl` set up. Needs KubeVela 1.11 or later. |
| [kubevela-io](./kubevela-io.md) | A copy of the KubeVela documentation site, served in your cluster for air-gapped environments. |

## Observability

| Addon | What it gives you |
| --- | --- |
| [prometheus-server](/docs/platform-engineers/operations/observability) | Prometheus, and the `prometheus-scrape` trait to have it scrape a component's metrics. |
| [node-exporter](/docs/platform-engineers/operations/observability) | Host metrics from every node, for Prometheus. |
| [kube-state-metrics](/docs/platform-engineers/operations/observability) | Metrics on the state of Kubernetes objects, for Prometheus. |
| [grafana](/docs/platform-engineers/operations/observability) | Grafana, with dashboards for KubeVela and its applications. |
| [loki](/docs/platform-engineers/operations/o11y/logging) | Loki for log collection, and the `stdout-logs` and `file-logs` traits to collect a component's logs. |
| [o11y-definitions](/docs/platform-engineers/operations/observability) | Definitions for Grafana dashboards, data sources and access, and config templates for Grafana, Loki and Prometheus. The grafana, loki and prometheus-server addons enable it. |
| [victoria-metric](https://github.com/kubevela/catalog/tree/master/addons/victoria-metric) | A VictoriaMetrics cluster and agent, in the `vm-system` namespace by default. |
| [mysql-exporter](./mysql-exporter.md) | A component and trait that export a MySQL server's metrics to Prometheus. |

## Delivery

| Addon | What it gives you |
| --- | --- |
| [fluxcd](./fluxcd.md) | The `helm` and `kustomize` components, the `helm-repository` config template, and patch traits for Kustomize. Most addons on this page depend on it. |
| [kruise-rollout](./kruise-rollout.md) | OpenKruise Rollouts, with the `kruise-rollout` trait for canary releases of Deployments, StatefulSets and OpenKruise CloneSets. |
| [keda](/docs/tutorials/auto-scaler) | KEDA, and the `keda-auto-scaler` trait for event-driven autoscaling. |
| [rollout](https://github.com/kubevela/catalog/tree/master/addons/rollout) | **Can't install.** The legacy rollout controller. Its chart is served from `charts.kubevela.net`, which no longer exists. Use kruise-rollout instead. |

## Cloud resources

| Addon | What it gives you |
| --- | --- |
| [terraform](/terraform/getting-started/install) | The Terraform controller, so components can provision cloud resources. Add a provider addon for each cloud. |
| [terraform-&lt;provider&gt;](/terraform/getting-started/install) | Components for one cloud's resources, and a config template for its credentials: `terraform-alibaba`, `terraform-aws`, `terraform-azure`, `terraform-baidu`, `terraform-gcp`, `terraform-tencent`, `terraform-ucloud`. |
| [terraform-ec](/terraform/guides/elastic-cloud-provider) | The same for Elastic Cloud deployments. |

## Gateway

| Addon | What it gives you |
| --- | --- |
| [ingress-nginx](./nginx-ingress-controller.md) | The NGINX Ingress controller, so the `gateway` trait has an ingress controller to use. |
| [traefik](./traefik.md) | **Can't install.** Traefik, with the `http-route`, `https-route` and `tcp-route` traits. Its chart is served from `charts.kubevela.net`, which no longer exists. |

## Security

| Addon | What it gives you |
| --- | --- |
| [cert-manager](./cert-manager.md) | cert-manager, to issue and renew TLS certificates. |
| [dex](./dex.md) | Dex, for single sign-on to VelaUX through GitHub, LDAP, OIDC and other identity providers. |
| [trivy-operator](./trivy-operator.md) | The Trivy Operator, which scans your workloads' images for vulnerabilities, and the `trivy-check` workflow step. |

## Workloads

| Addon | What it gives you |
| --- | --- |
| [model-training](./ai.md) | The `model-training` and `jupyter-notebook` components, for training models and working in notebooks. |
| [model-serving](./ai.md) | **Can't install.** The `model-serving` component. The addon requires Kubernetes earlier than 1.22, which no cluster KubeVela supports meets. |
| [flink-kubernetes-operator](./flink-kubernetes-operator.md) | The Apache Flink Kubernetes Operator, and the `flink-cluster` component. |
| [chartmuseum](./chartmuseum.md) | ChartMuseum, a Helm chart repository you run yourself. |
| [netlify](./netlify.md) | The `netlify` component, to deploy a frontend to Netlify. |
| [vegeta](./vegeta.md) | The `vegeta` component, for HTTP load tests. |

## Multi-cluster

| Addon | What it gives you |
| --- | --- |
| [ocm-hub-control-plane](./ocm-hub-control-plane.md) | The Open Cluster Management hub, installed in the KubeVela control plane cluster. |
| [ocm-gateway-manager-addon](./ocm-gateway-manager-addon.md) | An OCM addon that manages the cluster-gateway configuration. It restarts cluster-gateway the first time it is installed. |

## Experimental addons

More addons live in the experimental registry, [catalog/experimental/addons](https://github.com/kubevela/catalog/tree/master/experimental/addons). They are less tested and may not install. To use them, add the registry first:

```shell
vela addon registry add experimental --type helm --endpoint=https://kubevela.github.io/catalog/experimental
```
