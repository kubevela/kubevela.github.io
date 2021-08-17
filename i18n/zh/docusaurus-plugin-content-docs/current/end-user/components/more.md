---
title:  更多用法
---

KubeVela 中的组件旨在由用户带来。

## 1. 从能力中心获取

KubeVela 允许你探索由平台团队维护的功能。
kubectl vela 插件中有两个命令：`comp` 和 `trait`。

<!-- 如果你尚未安装 kubectl vela 插件：请参阅 [这里](../../developers/references/kubectl-plugin#install-kubectl-vela-plugin)。 -->

### 1. 列表

例如，让我们尝试列出注册表中的所有可用组件：

```shell
$ kubectl vela comp --discover
Showing components from registry: https://registry.kubevela.net
NAME              	REGITSRY	DEFINITION                 	
cloneset          	default	    clonesets.apps.kruise.io
kruise-statefulset	default	    statefulsets.apps.kruise.io
openfaas          	default	    functions.openfaas.com
````
请注意，`--discover` 标志表示显示不在集群中的所有组件。

### 2.安装
然后你可以安装一个组件，如：

```shell
$ kubectl vela comp get cloneset
Installing component capability cloneset
Successfully install trait: cloneset                                                                                                 
```

### 3.验证

```shell
$ kubectl get componentdefinition  -n vela-system
NAME         WORKLOAD-KIND   DESCRIPTION
cloneset     CloneSet        Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers. It was implemented by OpenKruise Cloneset.
...(other componentDefinition)

```

默认情况下，这两个命令将从 KubeVela 维护的 [repo](https://registry.kubevela.net) 中检索功能。