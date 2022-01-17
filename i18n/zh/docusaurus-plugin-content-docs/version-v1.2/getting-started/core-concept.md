---
title: 核心概念
---

KubeVela 围绕着云原生应用交付和管理场景展开，背后的应用交付模型是 [Open Application Model](../platform-engineers/oam/oam-model)，简称 OAM ，其核心是将应用部署所需的所有组件和各项运维动作，描述为一个统一的、与基础设施无关的“部署计划”，进而实现在混合环境中标准化和高效率的应用交付。KubeVela 包括以下核心概念：

## 应用（Application）

应用是定义了一个微服务业务单元所包括的制品（二进制、Docker 镜像、Helm Chart...）或云服务的交付和管理需求，它由[组件](#组件（component）)、[运维特征](#运维特征（Trait）)、[工作流](#工作流（workflow）)、[应用策略](#应用策略（Policy）)四部分组成，应用的生命周期操作包括：

- <b>部署(Deploy)</b> 指执行指定的工作流， 将应用在某一个环境中完成实例化。
- <b>回收(Recycle)</b> 删除应用部署到某一个环境的实例，回收其占用的资源。

### 组件（Component）

定义一个制品或云服务的交付和管理形式，一个应用中可以包括多个组件，最佳的实践方案是一个应用中包括一个主组件（核心业务）和附属组件（强依赖或独享的中间件，运维组件等）。组件的类型由 [Component Definition](../platform-engineers/oam/x-definition#组件定义（componentdefinition）) 定义。

### 运维特征（Trait）

运维特征是可以随时绑定给待部署组件的、模块化、可拔插的运维能力，比如：副本数调整（手动、自动）、数据持久化、 设置网关策略、自动设置 DNS 解析等。用户可以从社区获取成熟的能力，也可以自行定义。运维特征的类型由 [Trait Definition](../platform-engineers/oam/x-definition#运维特征定义（traitdefinition）) 定义。

### 工作流（Workflow）

工作流由多个步骤组成，允许用户自定义应用在某个环境的交付过程。典型的工作流步骤包括人工审核、数据传递、多集群发布、通知等。工作流步骤类型由 [Workflow Step Definition](../platform-engineers/oam/x-definition#工作流节点定义（workflowstepdefinition）) 定义。

### 应用策略（Policy）

应用策略（Policy）负责定义指定应用交付过程中的策略，比如质量保证策略、安全组策略、防火墙规则、SLO 目标、放置策略等。应用策略的类型由 [Policy Definition](../platform-engineers/oam/x-definition#应用策略定义（policydefinition）) 定义。

### 版本记录 （Revision）

应用每进行一次部署，生成一个版本记录，版本中快照了应用的完整配置。用户可以在任意时候将应用在某个环境的部署实例回滚到任意部署完成的历史版本。

<!-- ## 项目（Project）

项目作为在 KubeVela 平台组织人员和资源的业务承载，项目中可以设定成员、权限、应用和分配环境。在项目维度集成外部代码库、制品库，呈现完整 CI/CD Pipeline；集成外部需求管理平台，呈现项目需求管理；集成微服务治理，提供多环境业务联调和统一治理能力。项目提供了业务级的资源隔离能力。 -->

## 环境（Environment）

环境指通常意义的开发、测试、生产的环境业务描述，它可以包括多个交付目标。环境协调上层应用和底层基础设施的匹配关系，不同的环境对应管控集群的不同 Kubernetes Namespace。处在同一个环境中的应用才能具备内部互访和资源共享能力。

- <b>应用环境绑定</b> 应用可绑定多个环境进行发布，对于每一个环境可设置环境级部署差异。

> 环境概念仅在 VelaUX 中存在，仅使用 Vela Core 的用户无需关注此概念。

## 交付目标（Target）

交付目标用于描述应用的相关资源实际部署的物理空间，对应 Kubernetes 集群或者云的区域（Region）和专有网络（VPC）。对于普通应用，组件渲染生成的资源会在交付目标指定的 Kubernetes 集群中创建（可以精确到指定集群的 Namespace）；对于云服务，资源创建时会根据交付目标中指定的云厂商的参数创建到对应的区域和专有网络中，然后将生成的云资源信息分发到交付目标指定的 Kubernetes 集群中。单个环境可关联多个交付目标，代表该环境需要多集群交付。单个交付目标只能对应一个环境。

## 集群（Cluster）

Kubernetes 集群描述，它包括了集群通信密钥等信息，Kubernetes 集群目前是 KubeVela 应用交付的主要途径。

## 插件（Addon）

平台扩展插件描述，KubeVela 遵从微内核、高度可扩展的设计模式。KubeVela 在应用交付和管理的完整场景中基于 OAM 模型的概念，将应用组件类型、运维特征、工作流步骤、应用策略等功能均设计成可插拔可扩展的模式。这些可扩展的机制定义与第三方解决方案结合形成插件（ Addon）。每一个插件一般会包括模块定义 [X-Definition](../platform-engineers/oam/x-definition) ，代表它扩展的能力集合，以及第三方解决方案的安装包，如 Kubernetes CRD 及其控制器等。

## 下一步

- 查看 [实践教程](../tutorials/webservice)，了解更多使用场景和最佳实践。
- 查看 [操作手册](../how-to/dashboard/application/create-application)，一步步了解更多的功能。
