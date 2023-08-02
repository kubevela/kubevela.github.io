---
title: 内置插件包
---

KubeVela 团队维护了一个开箱即用的社区插件库（ https://addons.kubevela.net ），其中的插件列表如下。

:::tip
Source code of this addon are all here: https://github.com/kubevela/catalog/tree/master/addons .
:::

## KubeVela Platform

* [VelaUX](./velaux) KubeVela 用户体验 (UX) 插件。 它将启动仪表板和 APIServer 以获得更好的用户体验。
* [Vela prism](./vela-prism) 为核心 [KubeVela](https://github.com/kubevela/kubevela)  提供 API 扩展。
* [KubeVela doc](./kubevela-io) KubeVela 文档站制作而成的插件，帮助你在集群中离线查看 KubeVela 文档。
* [Cloud Shell](../../tutorials/cloud-shell): Set up a web terminal and cloud shell intended for a kubernetes-native environment.


## Observability

* [Prometheus Server](../../platform-engineers/operations/observability): Collects metrics from configured targets at given intervals, evaluates rule expressions, displays the results, and can trigger alerts if some condition is observed to be true.
* [Node Exporter](../../platform-engineers/operations/observability): Prometheus exporter for hardware and OS metrics exposed by *NIX kernels, written in Go with pluggable metric collectors.
* [Mysql Exporter](./mysql-exporter): Prometheus exporter for MySQL server metrics.
* [Grafana](../../platform-engineers/operations/observability): Grafana is an open source, feature rich metrics dashboard and graph editor for Graphite, Elasticsearch, OpenTSDB, Prometheus and InfluxDB.
* [Loki](../../platform-engineers/operations/o11y/logging): A log aggregation system designed to store and query logs from all your applications and infrastructure.
* [Kube State Metrics](../../platform-engineers/operations/observability): A simple service that listens to the Kubernetes API server and generates metrics about the state of the objects.

## GitOps

* [FluxCD](./fluxcd) 提供交付 helm chart 和驱动 GitOps 的能力。

## Cloud Resources

* [Terraform](./terraform) 提供了衔接 Terraform 生态的能力，包含一个 Terraform 插件和一组对应的云厂商插件。

## Rollout

* [Kruise Rollout](./kruise-rollout): [OpenKruise rollout](https://github.com/openkruise/rollouts) supports canary rollout for native deployment, stateful-set and OpenKruise [cloneset](https://openkruise.io/docs/user-manuals/cloneset/).
* [Rollout](./rollout) 提供应用灰度发布和回滚的能力（为 Kruise Rollout 的上一代，建议使用 Kruise-Rollout）。

## Gateway

* [Traefik](./traefik) Traefik 是一个现代化的轻松部署的微服务 HTTP 反向代理服务器和负载均衡器。
* [Nginx Ingress Controller](./nginx-ingress-controller): An Ingress controller for Kubernetes using NGINX as a reverse proxy and load balancer.

## AI

* [Machine Learning Addon](./ai) 机器学习插件，提供了模型训练和建模的能力。

## Multi-Clusters

* [OCM Cluster-Gateway Manager](./ocm-gateway-manager-addon)  管控集群中的 Operator 组件，帮助管理员通过自定义资源 `ClusterGatewayConfiguration` 来轻松操作集群网关实例的配置。 *警告*：此插件将在首次安装时重新启动集群网关实例。
* [OCM Hub Control Plane](./ocm-hub-control-plane) 帮助你启动 [Cluster manager](https://open-cluster-management.io/getting-started/core/cluster-manager/)（即 OCM 的控制平面）组件并将其安装到控制平面集群中。

## Security

* [Cert manager](./cert-manager) 在 Kubernetes 集群中添加证书和证书颁发者作为资源类型，并简化获取、更新和使用这些证书的过程。

## Big Data

* [Flink Operator](./flink-kubernetes-operator) A Kubernetes operator for Apache Flink(https://github.com/apache/flink-kubernetes-operator).

## Storage

* [ChartMuseum](./chartmuseum): An open-source and easy to deploy Helm Chart Repository server.

## SaaS Workload

* [netlify](./netlify): Netlify is a SaaS platform that can serve website especially for frontend service, it provides free allowances that was pretty cool to be used for demo and test.

## Developer Tools

* [Pyroscope](./pyroscope) Pyroscope 是一个开源的平台，由服务端和代理组成。它提供给用户高效收集、存储以及查询 CPU 和磁盘状态的能力。
* [Vegeta](./vegeta) Vegeta 是一种多功能的 HTTP 负载测试工具，它是基于对具有恒定请求率的 HTTP 服务的需求而构建的。它既可以用作命令行实用程序，也可以用作库。

:::tip
If you want to make your own addon, please refer to [this guide](../../platform-engineers/addon/intro.md).
:::