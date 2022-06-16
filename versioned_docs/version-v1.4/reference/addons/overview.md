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
* [AI addon](./ai) Introduction modeling-training and modeling-serving addon.
* [Vegeta](./vegeta) Vegeta is a versatile HTTP load testing tool built out of a need to drill HTTP services with a constant request rate. It can be used both as a command line utility and a library.
* [OCM Cluster-Gateway Manager](./ocm-gateway-manager-addon) An operator component into the hub cluster that help the administrator to easily operate the configuration of cluster-gateway instances via "ClusterGatewayConfiguration"custom resource. *WARNING* this addon will restart the cluster-gateway instances upon the first-time installation.
* [OCM Hub Control Plane](./ocm-hub-control-plane) Help you to initiate and install the [cluster manager](https://open-cluster-management.io/getting-started/core/cluster-manager/)(i.e. OCM's control plane) components into the hosting cluster where your KubeVela control plane is running.
* [Vela prism](./vela-prism) Provide API Extensions to the core [KubeVela](https://github.com/kubevela/kubevela).
* [Cert manager](./cert-manager) Add certificates and certificate issuers as resource types in Kubernetes clusters, and simplifies the process of obtaining, renewing and using those certificates.
* [KubeVela doc](./kubevela-io) Help you to read the KubeVela document in your cluster which can be air-gaped environment.
* [Flink kubernetes operator](./flink-kubernetes-operator) A Kubernetes operator for Apache Flink(https://github.com/apache/flink-kubernetes-operator).
* [dex](./dex) Provide [dex](https://github.com/dexidp/dex) login for VelaUX.