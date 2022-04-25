---
title: 交付 Helm Chart
description: 本文介绍通过 KubeVela 交付 Helm Chart
---

本文介绍了如何通过 KubeVela 交付 Helm Chart 包交付到多个目标环境和集群。

通过 Helm Chart 包交付应用主要的应用场景是交付开源中间件应用，比如 [bitnami](https://github.com/bitnami/charts) 中包括了常用的生产可用中间件；交付开源工具应用，比如 Gitlab、Jenkins 等等，这些应用在 [Helm 官方仓库](https://hub.helm.sh/) 中可以获取到。KubeVela 可以帮助你将这些应用便捷地部署到管理的任何集群，并管理他们。

通过本文，你将学习使用 KubeVela 插件体系安装扩展插件。Helm Chart 包的交付能力目前由 FluxCD 插件支撑，FluxCD 插件除了带来 Helm 类型的应用交付能力以外还带来了 Kustomize 的交付能力。

## 开始之前

- 选择一个你希望交付的 Chart 包，本文我们以 [bitnami/redis](https://github.com/bitnami/charts/tree/master/bitnami/redis) 为例。
- 确保你交付的集群具有可用的默认 StorageClass，我们交付中间件大多需要数据持久化，需要默认的 StorageClass 来分配 PV。

## 启用 fluxcd 插件

插件的启用你在 KubeVela 的安装过程应该已经体验过，即安装 VelaUX 的过程。本文案例我们将通过 UI 页面完成插件的安装。

首先进入 `Addon` 页面中，该页面正常情况下会自动列出可以安装的社区插件，这些插件来源于 [官方仓库](https://github.com/oam-dev/catalog/tree/master/addons)，我们点击 `fluxcd` 即可查询该插件的详情和启用状态。

从详情中我们可以获取到以下信息：

- Definitions：该插件提供的扩展能力，它可能包括组件类型扩展、运维特征类型扩展等。对于 fluxcd 插件，它提供了 `helm` 和 `kustomize` 两种组件类型，其中 `helm` 是我们今天需要关注和使用的类型。

- Readme：插件说明，对该插件的能力和相关信息进行解读说明。

我们点击 `Enable` 按钮即可， fluxcd 插件启用后会安装到所有接入到 KubeVela 的集群，因此其需要一定的时间。

![fluxcd addon](../resources/addon-fluxcd.jpg)

当观察到插件显示为 `enabled` 状态，即代表插件启用已经完成。可以开始交付 Helm 应用了。

你也可以通过 CLI 来启用插件：

```shell
vale addon enable fluxcd
```

## 通过 Chart 创建 Redis 应用

相信你通过之前的文章，已经掌握了应用的创建能力。我们需要使用 Chart 创建 Redis 应用，只需要选择应用部署类型为 `helm`，然后选择你准备好的具有默认 StorageClass 可以提供 PV 的集群 Target，然后进入部署参数配置页面。

![helm app config](../resources/helm-app-config.jpg)

参考上图，需要做如下配置：

- Repo Type: 仓库类型，目前支持 Git 和 Helm，本例我们选择 Helm 类型。
- Repo URL: 仓库地址，基于不同的仓库类型填写仓库地址，这里我们填写：https://charts.bitnami.com/bitnami。另外，如果你在 [配置集成](../how-to/dashboard/config/helm-repo) 里配置了 helm 仓库，这里可以直接在下拉框中进行选择。
- Chart: 填写仓库地址之后，这里会自动列举出所有可用的 Helm chart，这里我们选择: redis
- Version: 选择 chart 之后，这里的下拉框会展示出所有当前 chart 所有可用的版本，这里我们选择 16.8.5  
- Values: 确定 chart 和版本之后，这里的下来框会展出当前 chart 的自定义配置参数，这里由于我们使用的是 ACK 集群，PV 有最小容量要求，这里填写 15Gi。同理，其他配置参数也可以通过该方式进行配置，你需要根据你的集群情况进行配置。

如上参数填写完成后，点击 `Create` 完成应用创建进入应用管理页面。后续的部署流程与你在 [交付第一个应用](../quick-start) 的学习内容就一致了。

## 修改部署参数

在 UI 中点击配置页面的组件名称即可进入组件的配置页面，对于 Helm Chart 部署的组件，我们能够通过设置 Values 配置项来变更部署参数，也可以支持变更 Chart 的来源。其中 Values 配置项会基于 `values.yaml` 文件中的默认值来生成配置提醒，你可以选择需要配置的行并为其设置需要的值。

修改部署参数后，必须执行环境的工作流才能将修改后的参数在指定的环境生效，由于版本管理的机制存在，历史配置参数会在版本中得以保存。

## 通过 CLI 部署

你也可以通过 CLI 来部署 Helm Chart 类型的应用, 基础配置如下：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: helm-redis
spec:
  components:
    - name: redis
      type: helm
      properties:
        repoType: "helm"
        url: "https://charts.bitnami.com/bitnami"
        chart: "redis"
        version: "16.8.5"
        values: 
          master.persistence.size: 16Gi
          replica.persistence.size: 16Gi
```

你可以通过下述命令完成部署：

```shell
vela up -f https://kubevela.io/example/applications/app-with-chart-redis.yaml
```

接下来，通过 `vela status helm-redis` 命令查询部署应用的状态，直到进入下述状态即部署成功。

```
About:
  Name:      	helm-redis
  Namespace: 	default
  Created at:	2022-04-21 17:19:12 +0800 CST
  Status:    	running
Workflow:
  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:n1gxswwina
    name:redis
    type:apply-component
    phase:succeeded
    message:
Services:
  - Name: redis
    Cluster: local  Namespace: default
    Type: helm
    Healthy Fetch repository successfully, Create helm release successfully
    No trait applied
```

到此，你已经掌握了 Helm 应用的交付能力，快去交付更多的 Helm 应用吧。

## 下一步

- [学习直接部署 Kubernetes 原生资源](./k8s-object)
