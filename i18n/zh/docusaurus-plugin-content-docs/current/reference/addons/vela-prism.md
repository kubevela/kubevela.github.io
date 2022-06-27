---
title: Vela prism
---

## 安装插件

```shell
vela addon enable vela-prism
```

##  卸载插件

```shell
vela addon disable vela-prism
```

## 介绍

**Prism** 为 [KubeVela](https://github.com/kubevela/kubevela) 提供核心 API 扩展。 它以 Kubernetes [聚合 API 服务器](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/)方式运行。

![Prism 架构](https://raw.githubusercontent.com/kubevela/prism/master/hack/prism-arch.jpg)

## 模块

### apiserver

vela-prism 是一个 apiserver，它利用 Kubernetes Aggregated API 功能为用户提供原生接口。

#### ApplicationResourceTracker

KubeVela 中最初的 ResourceTracker 是一种集群范围的资源（由于某些历史原因），这使得集群管理员很难分配权限。 ApplicationResourceTracker 是一种命名空间范围的资源，它充当原始 ResourceTracker 的委托者。 它不需要额外的存储空间，但可以将 ApplicationResourceTracker 的请求投射到底层 ResourceTracker。 因此，集群管理员可以将 ApplicationResourceTracker 权限分配给用户。

在集群中安装 vela-prism 后，您可以运行 `kubectl get app` 来查看 ResourceTracker。

#### Cluster

在 vela-prism 中，还引入了 Cluster API，它作为 ClusterGateway 对象的委托者。 原始 ClusterGateway 对象包含凭证信息。 这使得 ClusterGateway 访问的暴露可能是危险的。 另一方面，prism 中提供的 Cluster 对象只向访问者公开集群的元数据。 因此，凭证信息将得到保护，用户也可以使用 API 访问集群列表。

在集群中安装 vela-prism 后，您可以运行 `kubectl get vela-clusters` 来查看所有已安装的集群。

> 请注意，vela-prism 引导参数包含 `--storage-namespace`，它标识了用于存储集群 secrets 和 OCM 托管集群的底层命名空间。 
