---
title: 内置插件包
---

以下内置插件都在由 KubeVela 团队维护的社区插件库（ https://addons.kubevela.net ）中：
* [VelaUX](./velaux) KubeVela 用户体验 (UX) 插件。 它将启动仪表板和 APIServer 以获得更好的用户体验。
* [FluxCD](./fluxcd) 提供交付 helm chart 和驱动 GitOps 的能力。
* [Addon Cloud Resources](./terraform) 提供一堆插件用于处理不同云厂商的资源。
* [Machine Learning Addon](./ai) 机器学习插件分为模型训练和建模插件。
* [Traefik](./traefik) Traefik 是一个现代化的轻松部署的微服务 HTTP 反向代理服务器和负载均衡器。
* [Rollout](./rollout) 提供应用回滚的能力。
* [Pyroscope](./pyroscope) Pyroscope 是一个开源的平台，由服务端和代理组成。它提供给用户高效收集、存储以及查询 CPU 和磁盘状态的能力。
* [AI addon](./ai) 介绍建模训练和建模服务插件。
* [Vegeta](./vegeta) Vegeta 是一种多功能的 HTTP 负载测试工具，它是基于对具有恒定请求率的 HTTP 服务的需求而构建的。它既可以用作命令行实用程序，也可以用作库。
* [OCM Cluster-Gateway Manager](./ocm-gateway-manager-addon)  管控集群中的 Operator 组件，帮助管理员通过自定义资源 `ClusterGatewayConfiguration` 来轻松操作集群网关实例的配置。 *警告*：此插件将在首次安装时重新启动集群网关实例。
* [OCM Hub Control Plane](./ocm-hub-control-plane) 帮助您启动 [Cluster manager](https://open-cluster-management.io/getting-started/core/cluster-manager/)（即 OCM 的控制平面）组件并将其安装到运行 KubeVela 控制平面的托管集群中。
* [Vela prism](./vela-prism) 为核心 [KubeVela](https://github.com/kubevela/kubevela)  提供 API 扩展。
* [Cert manager](./cert-manager) 在 Kubernetes 集群中添加证书和证书颁发者作为资源类型，并简化获取、更新和使用这些证书的过程。
* [KubeVela doc](./kubevela-io) 帮助你在集群中无缝查看 KubeVela 文档。
