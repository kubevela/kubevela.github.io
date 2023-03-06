---
title: "KubeVela 晋升 CNCF 孵化项目：为现代化软件交付带来更多可能性"
author: CNCF
author_title: CNCF
author_url: https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/
author_image_url: https://avatars.githubusercontent.com/u/13455738
tags: [ KubeVela, CNCF, Incubation ]
description: "本文将介绍 KubeVela 晋升 CNCF 孵化项目的细节"
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

> 转载于 [CNCF](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/)。

CNCF TOC（Technical Oversight Committee，技术监督委员会）已经投票接受 KubeVela 作为 CNCF 的孵化项目。

[KubeVela](https://kubevela.io/) 是一个应用交付引擎，也是基于 Kubernetes 的扩展插件，它可以让你的应用交付在当今流行的混合、多云环境中变得更加简单、高效、可靠。KubeVela 可以通过基于工作流的应用交付模型来编排、部署和操作工作负载和云资源。KubeVela 的应用交付抽象由 [OAM（Open Application Model，开放应用模型）](https://oam.dev/) 提供支持。

![image.png](/img/what-is-kubevela.png)

KubeVela 项目的前身是 [oam-kubernetes-runtime](https://github.com/crossplane/oam-kubernetes-runtime) 项目，它由来自八家不同组织的[开发者](https://github.com/kubevela/community/blob/main/OWNERS.md#bootstrap-contributors)一同在社区发起，包括阿里云、微软、Upbound 等。它于 2020 年 11 月发布正式对外开源，2021 年 4 月发布了 v1.0，2021 年 6 月加入 CNCF 成为沙箱项目。该项目目前的贡献者来自世界各地，有超过 260 多名[贡献者](https://kubevela.devstats.cncf.io/d/22/prs-authors-table?orgId=1)，包括招商银行、滴滴、京东、极狐 GitLab、SHEIN 等。

“KubeVela 开创了一条跨多云/多集群环境交付应用程序的道路，具有统一且可扩展的抽象。”CNCF TOC Sponsor 张磊表示： “这项创新开启了下一代软件交付体验，填补了现有社区生态应用交付的‘最后一公里’，该实践专注于更简单的‘部署’而不是复杂‘编排’。我们很高兴在 CNCF 社区中能涌现出更多以应用为中心的工具/平台，并期待看到 KubeVela 的采用在快速发展的应用交付生态系统中发展到一个新的水平。”

KubeVela 目前已被多家公司所采纳，被用于大部分的公共云以及内部部署的生产中。大多数用户采用 KubeVela 作为他们的内部“PaaS ”，作为 CI/CD 流水线的一部分，或者作为一个可扩展的 DevOps 内核来构建他们自己的 IDP。公开[采用者](https://github.com/kubevela/community/blob/main/ADOPTERS.md)包括阿里巴巴，使用 KubeVela 作为核心，进行跨混合环境交付和管理应用；字节跳动，使用 KubeVela 和 Crossplane 提供进阶的游戏 PaaS 能力；招商银行，利用 KubeVela 搭建混合云应用平台，统一从搭建、发布、运行的全流程；以及其他更多行业的公司。

“我们发现现在运维、安全、可观测等能力，随着对应开源工具和云服务的出现，逐渐走向标准化。”阿里云 aPaaS & Serverless 团队负责人、资深技术专家司徒放说，“这些能力可以被集成到应用开发工具链上，也可以融入到应用交付流程里。这样开发人员可以自助使用、轻松配置、自动触发。并且他能从流程里得到更快的反馈，从而大幅提升迭代效率。KubeVela 非常适合做这类应用交付流程的整合和定制，是平台工程的最佳实践。”

“KubeVela 使招商银行能够快速建立大规模统一的 OAM 云原生应用管理平台，降低金融科技云的复杂性，加快现代应用的标准化开发和交付，”招商银行高级架构师、 KubeVela 维护者徐佳航表示。“KubeVela 提供了应用模型和可编程 CRD、基于工作流程编排的应用交付、可观测性和配置功能，能够更好地赋能云原生应用和 CNCF 生态系统。”

![image.png](/img/kubevela-comps.png)

**主要组件:**

* [Vela Core](https://github.com/kubevela/kubevela) 是 KubeVela 的主要组成部分，也称为 KubeVela 控制平面。它为创建、编排和交付 OAM 应用程序提供了控制器（operator）和 webhook。
* The [Vela Workflow](https://github.com/kubevela/workflow) 引擎基于 CUE 编写的步骤完成编排和执行。这是一个公共库，可以作为独立的引擎工作，也可以在 KubeVela 应用程序中运行。
* **KubeVela CLI** 提供了各种命令来帮助你操作应用程序，例如管理定义、查看资源、重新启动工作流和滚动版本。
* [VelaUX](https://github.com/kubevela/velaux) 是 KubeVela 的 Web UI。它将业务逻辑合并到基础 API 中，并为不懂 K8s 的用户提供开箱即用的用户体验。
* KubeVela 的 [Terraform Controller](https://github.com/kubevela/terraform-controller) 允许用户使用 Terraform 通过 Kubernetes 自定义资源来管理云资源。
* [Cluster Gateway](https://github.com/oam-dev/cluster-gateway) 提供统一的多集群访问接口。
* KubeVela 还拥有一个不断增长的 [Catalog](https://github.com/kubevela/catalog)，其中包含 50 多个用于集成的社区插件，包括 ArgoCD、FluxCD、Backstage、OpenKruise、Dapr、Crossplane、Terraform、OpenYurt 等。

**显著的里程碑：**

* 超过 4.8k GitHub 星星
* 超过 3.5k 拉取请求
* 超过 1.6k 提问
* 超过 290 名贡献者
* 超过 150 个版本

自从加入 CNCF 沙箱以来，到 v1.7 为止，KubeVela 发布了 7 个小版本，增加了 5 个新组件，包括独立工作流、VelaUX、ClusterGateway、VelaD 和 Vela Prism。贡献者数量从 90+增长到 290+，GitHub 星星从 1900+增长到 4700+，贡献组织从 20+增长到 70+。

“KubeVela 凭借其现代化的开源软件交付控制平台，改善了开发人员在复杂多云环境中的体验。”CNCF 首席技术官 Chris Aniszczyk 表示："我们期待能支持社区朝着毕业项目的方向不断成长和成熟。"

展望未来， KubeVela 社区计划通过交付工作流改善云资源创建和消费的用户体验，增强混合/多集群场景中整个 CI/CD 交付流程的安全，支持用户使用 KubeVela Dynamic API 轻松与第三方 API 集成，等等。请访问 [Roadmap](https://kubevela.io/docs/roadmap/) 了解更多信息。

<iframe width="720" height="480" src="https://www.youtube.com/embed/p6rB3qQ2zn4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

“对于用户和贡献者的信任和支持，我们深感谦卑和感激，”阿里云高级技术专家、KubeVela 维护者孙健波说。“KubeVela 高度可扩展的设计非常适合社区多样化的用户场景，为我们的应用交付生态系统带来了强大的引擎。感谢 CNCF 的支持和认可，我相信达到孵化阶段是该项目的一个重要里程碑。KubeVela 维护人员期待与 CNCF 合作，共同实现我们的目标，让在当今的混合环境中部署和运行应用程序变得更容易、更快速、更可靠。”

“多亏了 Kubevela，我们在 Kubernetes 中部署和管理应用程序的方式现在变得更加便捷。”Napptive 首席技术官、KubeVela 维护者 Daniel Higuero 表示：“使用 Application（应用程序）和 Workflow（工作流）作为 顶层概念极大地简化了 Kubernetes 上的常见流程。这种方法的优势，在于它能够简化基本用例，同时通过多租户和多集群支持实现复杂用例。同时，通过与社区插件的可扩展系统相结合，允许它与其他工具集成并添加自定义定义，以根据你的使用案例定制体验。”

“CNCF 社区孵化了大量的云原生操作和原子管理能力，”阿里云技术专家、KubeVela 维护者曾庆国表示。“我们希望通过一个统一的、以应用为中心的概念来整合各种能力，并帮助越来越多的平台开发者，在企业中轻松实现标准化的应用。KubeVela 正在成长为企业践行平台工程的有力帮手。”

“KubeVela 旨在为各行各业提供丰富的云原生基础设施的便利和进步，”阿里云高级工程师、KubeVela 维护者殷达表示。“为了满足现代应用交付需求，KubeVela 一直在探索可扩展和灵活的架构，并添加开创性的想法，包括多集群交付、可编程工作流和自动化可观测能力。KubeVela 还持续关注控制平面的安全性和稳定性，这为社区采用者树立了生产信心。我们预计 KubeVela 的开放性可以使其成为云原生时代的前沿探索者。”

作为 CNCF 托管的项目，KubeVela 是一个中立基金会的一部分，该基金会与其技术利益和更大的 Linux 基金会保持一致，提供治理、营销支持和社区拓展。该项目与其他 35 个项目，包括 Backstage、Cilium、Istio、Knative、OpenTelemetry 等，同样进入[孵化阶段](https://www.cncf.io/projects/)。关于每个级别的成熟度要求，请访问 [CNCF 毕业标准](https://github.com/cncf/toc/blob/main/process/graduation_criteria.md)。
