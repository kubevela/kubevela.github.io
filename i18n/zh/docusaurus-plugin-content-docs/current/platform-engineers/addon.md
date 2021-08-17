---
title:  系统插件
---

本节会介绍：如何使用 KubeVela 的 addon（插件）能力

## 背景

KubeVela 可以利用 CUE 的强大能力集成 Kubernetes 生态中的其他组件，例如：Fluxcd、Keda、Prometheus 等。插件系统提供了一种统一的方式安装这些组件，且提供了一些开箱即用的 X-Definition。

## 开始之前

确保你已经安装了 [vela CLI](../install.mdx)

## 如何使用

1. 需求

作为一个平台管理员，假设此时你的用户想以 helm chart 形式作为应用部署计划的组件，你需要满足这个需求。经过一番查阅，你发现 KubeVela 提供的名为 Fluxcd 的插件已经满足了你的需求。

这个插件已经将调协集群中的 helm chart 的能力整理好，准备了相关的组件定义，可以一键启用。

> [Fluxcd](https://fluxcd.io/) 是一套提供 Gitops 功能的解决方案。它提供了一种方便的，向集群中安装Helm chart/Kustomize 形式对象的方案。它可以从 Git 仓库、OSS 等来源读取配置。
> Fluxcd 插件集成了该项目的功能。

下面将以 Fluxcd 为例，演示一个插件的安装和使用过程。

2. 使用 vela CLI 查看可用的插件

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

3. 启用 Fluxcd， CLI 将会持续检查 Fluxcd 插件的状态，直至其成功安装。

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

3. 使用 Fluxcd 插件内置的组件定义：

至此，你作为平台管理员的所有工作都已经就绪。接下来你只需要告诉与你合作的应用开发者：可以使用 helm 类型的组件了。

Fluxcd 中已经附带了一个帮助交付 helm chart 类型的[组件定义](https://github.com/oam-dev/kubevela/blob/master/vela-templates/addons/fluxcd/definitions/helm-release.yaml) helm。

你可以通过如下命令查看该组件定义已在集群中就绪：

```shell
kubectl get componentdefinitions.core.oam.dev -n vela-system helm
NAME   WORKLOAD-KIND   DESCRIPTION
helm                   helm release is a group of K8s resources from either git repository or helm repo
```

或者使用vela CLI

```shell
vela components
NAME            NAMESPACE       WORKLOAD                        DESCRIPTION                                                 
helm            vela-system     autodetects.core.oam.dev        helm release is a group of K8s resources from either git    
                                                                repository or helm repo                                     
...
```

helm 类型的组件定义中参数的部分已经说明了其用法：你可以选择来自 Git 仓库 / helm 仓库 / OSS bucket 的某个 chart 作为交付内容。你可以选择 chart 的版本、目标名字空间、需要覆写的 values 字段等。

```cue
parameter: {
    // +usage=The type of source of chart. Enum of git/helm/bucket
    repoType: "git" | "helm" | "bucket"
    // +usage=The Git or Helm repository URL, accept HTTP/S or SSH address as git url
    repoUrl: string
    // +usage=The interval at which to check for repository/bucket and relese updates
    pullInterval: *"5m" | string
    // +usage=The bucket's name, required if repoType is bucket
    bucketName?: string
    // +usage="generic" for Minio, Amazon S3, Google Cloud Storage, Alibaba Cloud OSS, "aws" for retrieve credentials from the EC2 service when credentials not specified, default "generic"
    provider: *"generic" | "aws"
    // +usage=Bucket endpoint address, required if repoType is bucket
    endpoint?: string
    // +usage=The bucket region, optional
    region?: string
    // +usage=The timeout for download operations
    timeout?: string
    // +usage=1.The relative path to helm chart for git/bucket source. 2. chart name for helm resource 3. relative path for chart package(e.g. ./charts/podinfo-1.2.3.tgz)
    chart: string
    // +usage=Chart version
    version: *"*" | string
    // +usage=The Git reference to checkout and monitor for changes, defaults to master branch
    branch: *"master" | string
    // +usage=The name of the secret containing authentication credentials for Helm repository or bucket
    secretRef?: string
    // +usage=The namespace for helm chart
    targetNamespace?: string
    // +usage=Chart value
    value?: #nestedmap
}
```

下面我们在一个应用部署计划中使用 helm 类型的组件。在其中我们交付了一个 Redis 的 helm chart。我们指定了这个 chart 来自一个 Helm 仓库，仓库的 URL、要安装的 chart 的名字和版本。

```shell
cat << EOF > app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-delivering-chart
spec:
  components:
    - name: redis
      type: helm
      properties:
        chart: redis-cluster
        version: 6.2.7
        repoUrl: https://charts.bitnami.com/bitnami
        repoType: helm
EOF
```

```shell
kubectl apply -f app.yaml
application.core.oam.dev/app-delivering-chart created
```

过一段时间检查应用状态：

```shell
kubectl get application app-delivering-chart
NAME                   COMPONENT   TYPE   PHASE     HEALTHY   STATUS   AGE
app-delivering-chart   redis       helm   running   true               2m12s
```

由于我们这次交付的是一个 helm chart，也可以使用 helm 命令行来查询 chart 的状态：

```shell
helm list
NAME 	NAMESPACE	REVISION	UPDATED                              	STATUS  	CHART              	APP VERSION
redis	default  	1       	2021-08-17 09:40:49.1775023 +0000 UTC	deployed	redis-cluster-6.2.7	6.2.5
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

## 插件背后

实际上每个插件在 vela-system 名字空间中创建了一个 Initializer。可以用下面的方式查看：

```shell
kubectl get initializer -n vela-system
NAME                  PHASE     AGE
fluxcd                success   23m
ns-flux-system        success   23m
```
