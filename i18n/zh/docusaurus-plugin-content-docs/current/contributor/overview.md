---
title: 介绍
---

开发者手册主要包含以下三个部分：

1. 第一部分是[平台扩展手册](#扩展手册)，介绍扩展 KubeVela 的方法，也非常欢迎你为社区贡献你的扩展。
2. 第二部分是[贡献指南](#贡献指南)，介绍如何参与和贡献社区，包含了代码和非代码贡献。

## 扩展手册

这一部分是帮助你扩展 KubeVela 功能的手册。在开始之前确保你已经理解了[核心概念](../getting-started/core-concept)。

### 扩展和分发平台插件

构建或安装平台插件（Addon）是扩展 KubeVela 平台的基本方式，这里有一个在持续完善的 [catalog](https://github.com/kubevela/catalog)，你可以发现、安装、分享 KubeVela 的平台扩展能力。

* [构建你的扩展插件](../platform-engineers/addon/intro)。
* [制作你的企业级插件仓库](../platform-engineers/addon/addon-registry)
* [制作插件扩展云资源](../platform-engineers/addon/terraform)。

### 使用 CUE 扩展高级功能

KubeVela 使用 CUE 作为核心引擎，你可以使用 CUE 和 CRD 控制器来粘合绝大部分基础设施功能，扩展更丰富更灵活的高级功能。

* 从[学习 CUE](../platform-engineers/cue/basic) 开始。
* 了解什么是 Kubernetes 中的 [CRD 控制器](https://kubernetes.io/zh/docs/concepts/extend-kubernetes/api-extension/custom-resources/)。


## 贡献指南

KubeVela 项目从一开始就由 Cloud Native 社区初始化和维护，由[来自 8 个以上不同组织的贡献者启动](https://github.com/kubevela/community/blob/main/OWNERS.md#bootstrap-contributors)。我们希望 KubeVela 从一开始就有开放的治理方式，所以在项目发布后立即将其捐赠给中立基金会。

为了帮助我们为所有人创造一个安全和积极的社区体验，我们要求所有参与者遵守 CNCF 社区的[行为准则](https://github.com/cncf/foundation/blob/main/code-of-conduct.md)。

这是帮助你为 KubeVela 做出贡献的一份手册。

### 成为贡献者

你可以通过多种方式为 KubeVela 做出贡献，包括代码和非代码贡献，我们感谢你为社区做出的努力。这里有些例子：

* 为代码库和文档做出贡献。
* 上报和分类问题。
* 在当地组织聚会和 user groups。
* 通过回答关于 KubeVela 的问题来帮助他人。

### 非代码贡献

用 Apache 的方式来说“社区胜于代码”。尽管 Kubevela 是 CNCF/Linux 项目，但我们对此具有很强的共鸣。更深入地延续这一点，对于社区的存在及其未来的增长而言，我们认为非编码贡献和代码贡献同样重要。

* 请参阅[非代码贡献手册](./non-code-contribute)，了解你可以提供什么帮助。

### 代码贡献

不确定从哪里开始为 KubeVela 编写代码？从浏览标记为 `good first issue` 或 `help wanted` 的问题开始。

* [Good first issue](https://github.com/kubevela/kubevela/labels/good%20first%20issue) 通常比较简单。
* [Help wanted](https://github.com/kubevela/kubevela/labels/help%20wanted) 是我们希望社区帮助我们解决的问题，而不关注问题是否复杂。
* 更多细节请参考[代码贡献手册](./code-contribute)。

查看[发行过程和节奏](./release-process)，以了解你的代码更改何时会发布。

### 成为社区成员

如果你有兴趣成为社区成员或了解更多关于管理方式的信息，请查看[社区成员](https://github.com/kubevela/community/blob/main/community-membership.md)的详细信息。

### 为社区其他项目做贡献

* [VelaUX 开发手册](https://github.com/kubevela/velaux/blob/main/CONTRIBUTING.md)
* [Terraform Controller 开发手册](https://github.com/kubevela/terraform-controller/blob/master/CONTRIBUTING.md)

开启并享受你的开源贡献之旅吧！
