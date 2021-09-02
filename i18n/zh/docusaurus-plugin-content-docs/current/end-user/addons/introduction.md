---
title:  介绍
---

本节会介绍如何使用 KubeVela 的默认系统插件（Addon）

## 背景

KubeVela 默认是一个应用管理和交付的控制平面，同时它也支持一系列开箱即用的功能，这些都通过系统插件的方式提供。你只需要有对 KubeVela 控制平面集群的写权限，即可一键即可开启这些默认的系统插件，使用包括弹性扩缩容、可观测性、GitOps 在内的多种生态功能。
除此之外，作为平台管理员的你，可以根据业务需要添加自定义的系统插件。本质上，系统插件提供了一种统一的方式，可以灵活的安装、拆卸满足应用交付和应用管理不同场景的系统能力。
一个系统插件通常可以包含如下两个组成部分：
- 系统组件，如 Kubernetes 的自定义资源（CRD Controller），系统所需的数据库、缓存、负载均衡等中间件，其他容易需要安装运行的系统组件。
- OAM 标准化定义（X-Definition），如组件定义（ComponentDefinition）等，可以将系统组件的能力通过 OAM 的标准方式提供给最终的用户使用。

## 开始之前

系统插件可以通过 KubeVela 的命令行工具一键安装，请确保你已经安装了 [vela CLI](../../getting-started/quick-install#quick-install/#3-安装-kubevela-cli)。

## 查看默认的系统插件

1. 使用 vela CLI 查看可用的插件

```shell
vela addon list
```

```shell
NAME               	DESCRIPTION                                                                  	STATUS     	IN-NAMESPACE
fluxcd             	Flux is a set of continuous and progressive delivery solutions for Kubernetes	uninstalled	vela-system 
keda               	KEDA is a Kubernetes-based Event Driven Autoscaler.                          	uninstalled	vela-system 
kruise             	Kruise is a Kubernetes extended suite for application automations            	uninstalled	vela-system 
ns-flux-system     	Create namespace for flux-system                                             	uninstalled	vela-system 
observability      	An out of the box solution for KubeVela observability                        	uninstalled	vela-system 
observability-asset	Preparations that observability need                                         	uninstalled	vela-system 
ocm-cluster-manager	ocm-cluster-manager can deploy an OCM hub cluster environment.               	uninstalled	vela-system 
prometheus         	Prometheus is an open-source systems monitoring and alerting toolkit         	uninstalled	vela-system 
terraform          	Terraform Controller is a Kubernetes Controller for Terraform.               	uninstalled	vela-system 
```

2. 系统插件简介

| 插件                | 参考地址                                                     | 简介                                                         | 已内置Definition |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ---------------- |
| fluxcd              | https://fluxcd.io/                                           | 提供 GitOps，持续部署的相关能力                              | kustomize、helm  |
| ns-flux-system      | -                                                            | 目前为 fluxcd 插件提供 namespace 使用，后续优化方向为使之对所有用户不可见 | -                |
| kruise              | https://openkruise.io/                                       | 提供比 Kubernetes 原生更强大的工作负载套件                   | cloneset |
| prometheus          | https://prometheus.io/                                       | 提供监控能力                                                 | -                |
| keda                | https://keda.sh/                                             | 提供工作负载的自动扩缩容能力                                 | -                |
| terraform           | https://github.com/oam-dev/terraform-controller <br />https://www.terraform.io/ | IaC（基础设施即代码）                                        | -                |
| ocm                 | https://github.com/open-cluster-management                   | 多集群相关依赖                                               | -                |
| observability       | -                                                            | 为 KubeVela core 提供系统级别的监控，也可以为应用提供业务级别的监控。 | -                |
| observability-asset | -                                                            | 目前仅为 observability 插件提供相关所需资源，后续优化方向为使之对所有用户不可见 | -                |



## 使用示例

1. 需求

假设此时你想以 helm chart 形式作为应用部署计划的组件，你需要满足这个需求。经过一番查阅，你发现 KubeVela 提供的名为 fluxcd 的插件已经满足了你的需求。

这个插件已经将调协集群中的 helm chart 的能力整理好，准备了相关的组件定义，可以一键启用。

> [FluxCD](https://fluxcd.io/) 是一套提供 Gitops 功能的解决方案。它提供了一种方便的，向集群中安装Helm chart/Kustomize 形式对象的方案。它可以从 Git 仓库、OSS 等来源读取配置。
> fluxcd 插件集成了该项目的功能。

下面将以 fluxcd 为例，演示一个插件的安装和使用过程。

1. 以 fluxcd 这个插件为例，启用 fluxcd 以后, CLI 将会持续检查 fluxcd 插件的状态，直至其成功安装。

```shell
vela addon enable fluxcd
```

```shell
I0813 16:35:02.430540   13705 apply.go:93] "creating object" name="fluxcd" resource="core.oam.dev/v1beta1, Kind=Initializer"
Initializer fluxcd is in phase:...
Initializer fluxcd is in phase:checkingDependsOn...
Initializer fluxcd is in phase:initializing...
Successfully enable addon:fluxcd
```

3. 使用 fluxcd 插件内置的组件定义：

至此，你作为平台管理员的所有工作都已经就绪。接下来你只需要告诉与你合作的应用开发者：可以使用 helm 类型的组件了。

fluxcd 插件中已经附带了一个帮助交付 helm chart 类型的[组件定义](https://github.com/oam-dev/kubevela/blob/master/vela-templates/addons/fluxcd/definitions/helm-release.yaml) helm。

你可以通过如下命令查看该组件定义已在集群中就绪：

```shell
vela components
NAME            NAMESPACE       WORKLOAD                        DESCRIPTION                                                 
helm            vela-system     autodetects.core.oam.dev        helm release is a group of K8s resources from either git    
                                                                repository or helm repo                                     
...
```


## 禁用插件

1. 清理应用：

```shell
kubectl delete application
```
```shell
NAME            NAMESPACE       REVISION        UPDATED                                 STATUS          CHART                 APP VERSION
redis           default         1               2021-08-17 04:12:49.3966701 +0000 UTC   deployed        redis-cluster-6.2.7   6.2.5
```

2. 禁用插件

你可以使用 `vela addon disable fluxcd` 来禁用该插件。 请注意在禁用插件之前清理相关应用。注意如果直接禁用插件，带有 helm 类型的交付组件将无法被正确地删除。

另外，要完全清理 fluxcd 插件，最后你还需要执行 `vela addon disable ns-flux-system`，这是 fluxcd 的辅助插件，需要手动禁用。
