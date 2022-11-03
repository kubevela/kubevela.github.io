---
title: Overview
---

There's an community addon registry (https://addons.kubevela.net) maintained by KubeVela team. It contains following addons:

* [VelaUX](./velaux): The KubeVela User Experience (UX ) addon. It will launch a dashboard and an APIServer for better user experience.
* [FluxCD](./fluxcd): Provides capability to deliver helm chart and drive GitOps.
* [Addon Cloud Resources](./terraform): Provide a bunch of addons to provision cloud resources for different cloud providers.
* [Machine Learning Addon](./ai): Machine learning addon is divided into model-training addon and model-serving addon.
* [Traefik](./traefik): Traefik is a modern HTTP reverse proxy and load balancer made to deploy microservices with ease.
* [Rollout](./rollout): Provide a capability rollout the applicaton.
* [Pyroscope](./pyroscope): Pyroscope is an open source platform, consisting of server and agent. It allows the user to collect, store, and query the profiling data in a CPU and disk efficient way.
* [AI](./ai) Introduction modeling-training and modeling-serving addon.
* [Vegeta](./vegeta) Vegeta is a versatile HTTP load testing tool built out of a need to drill HTTP services with a constant request rate. It can be used both as a command line utility and a library.
* [OCM Cluster-Gateway Manager](./ocm-gateway-manager-addon) An operator component into the hub cluster that help the administrator to easily operate the configuration of cluster-gateway instances via "ClusterGatewayConfiguration"custom resource. *WARNING* this addon will restart the cluster-gateway instances upon the first-time installation.
* [OCM Hub Control Plane](./ocm-hub-control-plane) Help you to initiate and install the [cluster manager](https://open-cluster-management.io/getting-started/core/cluster-manager/)(i.e. OCM's control plane) components into the hosting cluster where your KubeVela control plane is running.
* [Vela Prism](./vela-prism) Provide API Extensions to the core [KubeVela](https://github.com/kubevela/kubevela).
* [Cert Manager](./cert-manager) Add certificates and certificate issuers as resource types in Kubernetes clusters, and simplifies the process of obtaining, renewing and using those certificates.
* [KubeVela Website](./kubevela-io) Help you to read the KubeVela document in your cluster which can be air-gaped environment.
* [Flink Operator](./flink-kubernetes-operator) A Kubernetes operator for Apache Flink(https://github.com/apache/flink-kubernetes-operator).
* [Dex](./dex) Provide [dex](https://github.com/dexidp/dex) login for VelaUX.
* [Kruise Rollout](./kruise-rollout): [OpenKruise rollout](https://github.com/openkruise/rollouts) supports canary rollout for native deployment, stateful-set and OpenKruise [cloneset](https://openkruise.io/docs/user-manuals/cloneset/).
* [Nginx Ingress Controller](./nginx-ingress-controller): An Ingress controller for Kubernetes using NGINX as a reverse proxy and load balancer.
* [ChartMuseum](./chartmuseum): An open-source and easy to deploy Helm Chart Repository server.
* [Trivy Operator](./trivy-operator): Provides a vulnerability scanner that continuously scans containers deployed in a Kubernetes cluster.
* [Prometheus Server](../../platform-engineers/operations/observability): Collects metrics from configured targets at given intervals, evaluates rule expressions, displays the results, and can trigger alerts if some condition is observed to be true.
* [Node Exporter](../../platform-engineers/operations/observability): Prometheus exporter for hardware and OS metrics exposed by *NIX kernels, written in Go with pluggable metric collectors.
* [Mysql Exporter](./mysql-exporter): Prometheus exporter for MySQL server metrics.
* [Grafana](../../platform-engineers/operations/observability): Grafana is an open source, feature rich metrics dashboard and graph editor for Graphite, Elasticsearch, OpenTSDB, Prometheus and InfluxDB.
* [Loki](../../platform-engineers/operations/o11y/logging): A log aggregation system designed to store and query logs from all your applications and infrastructure.
* [Kube State Metrics](../../platform-engineers/operations/observability): A simple service that listens to the Kubernetes API server and generates metrics about the state of the objects.
* [netlify](./netlify): Netlify is a SaaS platform that can serve website especially for frontend service, it provides free allowances that was pretty cool to be used for demo and test.
* [Cloud Shell](../../tutorials/cloud-shell): Set up a web terminal and cloud shell intended for a kubernetes-native environment.
* [Terraform](./terraform) Terraform provider addon to provide the capability to deploy the cloud resource.

**If you want to make your own addon please refer to [doc](../../platform-engineers/addon/intro.md).**