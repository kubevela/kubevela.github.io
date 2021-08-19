---
title:  系统插件：fluxcd
---

## 开始之前

确保你已经了解过什么是[系统插件](../../platform-engineers/addon)（Addon）

## 插件概览

[Flux](https://fluxcd.io/) 是一套针对 Kubernetes 的持续交付（CD）解决方案，fluxcd 插件将帮助你在集群中安装 Flux，并为 KubeVela 提供 Flux 的持续交付能力，帮助你在应用交付计划中添加 helm chart 或 kustomize 类型的组件。

## 插件内容

1. Flux v2 的本体内容：包括 Deployment / Service / ClusterRole / ClusterRoleBinding / NetworkPolicy。这些内容是 Flux 的控制器、CRD 以及与之配合的 Kubernetes 对象。

2. 随插件安装的将有如下两个组件定义，其各自的使用方法详见其各自的文档，更多 Flux 能力即将成为 KubeVela 的模块定义。

    1. [helm](../../end-user/components/helm)：帮助交付 helm chart 类型的组件
    2. [kustomize](../../end-user/components/kustomize)：帮助交付 kustomize 类型的组件

## 依赖

该插件依赖 ns-flux-system 插件，后者作用为提供 flux-system 名字空间。该依赖关系会在后续优化，使之对用户不可见。

## 禁用方法

先后禁用 fluxcd、ns-flux-system 插件即可。

```shell
vela addon disable fluxcd
```

```shell
vela addon disable ns-flux-system
```
