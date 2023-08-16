---
title: 概览
---

GitOps 是一种现代化的持续交付手段，它允许开发人员通过直接更改 Git 仓库中的代码和配置来自动部署应用，在提高部署生产力的同时也通过分支回滚等能力提高了可靠性。其具体的好处可以查看[这篇文章](https://www.weave.works/blog/what-is-gitops-really)，本文将不再赘述。

KubeVela 作为一个声明式的应用交付控制平面，天然就可以以 GitOps 的方式进行使用，并且这样做会在 GitOps 的基础上为用户提供更多的益处和端到端的体验，包括：
- 应用交付工作流（CD 流水线）
  - 即：KubeVela 支持在 GitOps 模式中描述过程式的应用交付，而不只是简单的声明终态；
- 处理部署过程中的各种[依赖关系](../end-user/workflow/component-dependency-parameter.md)和拓扑结构；
- 在现有各种 GitOps 工具的语义之上提供[统一的上层抽象](../getting-started/core-concept.md)，简化应用交付与管理过程；
- 统一进行[云服务的声明](../tutorials/consume-cloud-services.md)、部署和服务绑定；
- 提供开箱即用的交付策略（金丝雀、蓝绿发布等）；
- 提供开箱即用的混合云/多云部署策略（放置规则、集群过滤规则等）；
- 在多环境交付中提供 Kustomize 风格的 Patch 来描述部署差异，而无需学习任何 Kustomize 本身的细节；
- …… 以及更多。

在接下来的章节中，我们会介绍使用 KubeVela 做 GitOps 的流程，有可以选择下面的插件之一来做 GitOps：

- [使用 FluxCD 做 GitOps](../end-user/gitops/fluxcd.md)

除了使用上述插件，最终用户也可以自己集成任意的 GitOps 工具来监听 Git 仓库中的 KubeVela Application 配置。