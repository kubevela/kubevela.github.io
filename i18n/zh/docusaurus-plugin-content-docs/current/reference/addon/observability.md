---
title:  系统插件：observability
---

## 开始之前

确保你已经了解过什么是[系统插件](../../end-user/addons/introduction)（Addon）

## 插件概览

observability 是一套监控解决方案。为 KubeVela core 提供系统级别的监控，也可以为应用提供业务级别的监控。

## 插件内容及使用方法

详见可观测性

## 依赖

该插件依赖 observability-asset 插件，后者作用为提供 observability 提供所需的模块定义和名字空间。该依赖关系会在后续优化，使之对用户不可见。

## 禁用方法

先后禁用 observability、observability-asset 插件即可。

```shell
vela addon disable observability
```

```shell
vela addon disable observability-asset
```
