---
title: Helm Chart 多集群交付
author: 孙健波（天元）
author_title: KubeVela Team
author_url: https://github.com/wonderflow
author_image_url: https://avatars.githubusercontent.com/u/2173670
tags: [ KubeVela, "use-case", "helm chart", "multi-cluster" ]
description: ""
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

[Helm Charts](https://artifacthub.io/packages/search?kind=0) 如今已是一种非常流行的软件打包方式，在其应用市场中你可以找到接近一万款适用于云原生环境的软件。然后在如今的混合云多集群环境中，业务越来越依赖部署到不同的集群、不同的环境、同时指定不同的配置。再这样的环境下，单纯依赖 Helm 工具可能无法做到灵活的部署和交付。

在本文中，我们将介绍如何通过 [KubeVela](https://kubevela.io/) 解决多集群环境下 Helm Chart 的部署问题。如果你手里没有多集群也不要紧，我们将介绍一种仅依赖于 Docker 或者 Linux 系统的轻量级部署方式，可以让你轻松的体验多集群功能。当然，KubeVela 也完全具备[单集群的 Helm Chart 交付](https://kubevela.net/zh/docs/tutorials/helm)能力。

<!--truncate-->

## 前提条件

* 安装 Docker v20.10.5+ (runc >= v1.0.0-rc93) 或者你的操作系统是 Linux。
* [VelaD](https://github.com/kubevela/velad)，一个轻量级的部署 KubeVela 和 Kubernetes 的工具.


## 准备集群

> 本节是做 KubeVela 以及多集群环境的准备，我们将基于 Docker 或者 Linux 环境从头开始。如果你已经具备了 KubeVela 的环境并且完成了 [集群管理](https://kubevela.net/zh/docs/platform-engineers/system-operation/managing-clusters) ，则可以跳过本节。

1. 安装 KubeVela 控制平面

```shell
velad install
```

2. 将新创建的集群导入到环境变量

```
export KUBECONFIG=$(velad kubeconfig --name default --host)
```

到这里，恭喜你！我们已经完成了 KubeVela 控制平面的安装。你可以通过下面这个方式加入你的 Kubernetes 集群：

```
vela cluster join <path-to-kubeconfig-of-cluster> --name foo
```

如果你没有现成的 Kubernetes 集群，VelaD 也可以很方便的为你创建一个：

3. 用 velad 创建一个名为 `foo` 的集群，并加入到控制平面

```shell
velad install --name foo --cluster-only
vela cluster join $(velad kubeconfig --name foo --internal) --name foo
```

作为一个充分可扩展的控制平面，KubeVela 的大多数能力都是作为插件提供的。接下来的几步我们介绍安装 Helm 多集群部署的必要插件。

4. 启用 velaux 插件，获得 UI 控制台

```shell
vela addon enable velaux
```

5. 启用 fluxcd 插件获得 helm chart 交付能力

```shell
vela addon enable fluxcd
```

如果你在加入新集群之前已启用过 `fluxcd` 插件，则应该通过以下方式来为新加入的集群启用（部署）插件：

```
vela addon enable fluxcd --clusters foo
```

至此，我们完成了所有的准备工作，可以查看加入的集群了：

```console
$ vela cluster ls
CLUSTER	ALIAS	TYPE           	ENDPOINT               	ACCEPTED	LABELS
local  	     	Internal       	-                      	true
foo    	     	X509Certificate	https://172.20.0.6:6443	true
```

`local` 是 KubeVela 控制平面的集群，`foo` 则是我们刚刚添加的集群。

## 多集群部署

我们可以使用 `topology` 策略来指定 Helm Chart 交付的环境，指令如下：

```yaml
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: helm-hello
spec:
  components:
    - name: hello
      type: helm
      properties:
        repoType: "helm"
        url: "https://jhidalgo3.github.io/helm-charts/"
        chart: "hello-kubernetes-chart"
        version: "3.0.0"
  policies:
    - name: foo-cluster-only
      type: topology
      properties:
        clusters: ["foo"]
EOF
```

`clusters` 字段的 topology 策略是一个切片（slice），此处可以指定多个集群的名称。
你还可以使用标签选择器或指定命名空间，详情见 [参考文档](https://kubevela.net/zh/docs/end-user/policies/references#topology) 。

部署后，你可以通过以下方式检查已部署的应用程序：

```shell
vela status helm-hello
```

部署成功的预期输出应该如下：

```console
About:

  Name:      	helm-hello
  Namespace: 	default
  Created at:	2022-06-09 19:14:57 +0800 CST
  Status:    	running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:vtahj5zrz4
    name:deploy-foo-cluster-only
    type:deploy
    phase:succeeded
    message:

Services:

  - Name: hello
    Cluster: foo  Namespace: default
    Type: helm
    Healthy Fetch repository successfully, Create helm release successfully
    No trait applied
```

你可以通过以下方式检查已部署的资源：

```
$ vela status helm-hello --tree
CLUSTER       NAMESPACE     RESOURCE             STATUS
foo       ─── default   ─┬─ HelmRelease/hello    updated
                         └─ HelmRepository/hello updated
```

你也可以通过 VelaUX 检查已部署的资源。

## 使用 UI 控制台查看部署状态

通过使用 `velaux` UI 控制台，则可以很方便的查看多集群信息，并获得统一的体验。你可以参考[这篇文档](https://kubevela.io/docs/install#2-install-velaux)了解 VelaUX 的访问和使用细节。

通过 UI 界面，我们可以：

* 检查来自不同集群的实例状态和事件：

![resource-detail](/img/helm/helm-pod.jpg)

* 检查来自不同集群的实例日志：

![resource-detail](/img/helm/helm-logs.jpg)

* 检查资源拓扑关系和状态：

![resource-detail](/img/helm/helm-topology.jpg)

## 使用 Override 配置进行部署

在某些情况下，我们会为不同集群的 Helm Chart 设置不同的 Value ，这样我们可以使用 [Override 策略](https://kubevela.io/docs/end-user/policies/references#override) 。

下面是一个复杂的示例，我们将把一个 Helm Chart 部署到两个集群中，并为每个集群指定不同的 Value 。让我们部署它：

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: helm-hello
spec:
  components:
    - name: hello
      type: helm
      properties:
        repoType: "helm"
        url: "https://jhidalgo3.github.io/helm-charts/"
        chart: "hello-kubernetes-chart"
        version: "3.0.0"
  policies:
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
    - name: topology-foo
      type: topology
      properties:
        clusters: ["foo"]
    - name: override-local
      type: override
      properties:
        components:
          - name: hello
            properties:
              values:
                configs:
                  MESSAGE: Welcome to Control Plane Cluster!
    - name: override-foo
      type: override
      properties:
        components:
          - name: hello
            properties:
              values:
                configs:
                  MESSAGE: Welcome to Your New Foo Cluster!
  workflow:
    steps:
      - name: deploy2local
        type: deploy
        properties:
          policies: ["topology-local", "override-local"]
      - name: manual-approval
        type: suspend
      - name: deploy2foo
        type: deploy
        properties:
          policies: ["topology-foo", "override-foo"]
EOF
```

> **注意：如果你觉得策略和工作流程有点复杂，你可以将它们作为一个外部对象并仅引用该对象，用法和 [容器交付](https://kubevela.io/docs/case-studies/multi-cluster#use-policies-and-workflow-outside-the-application) 是一样的。**

部署过程分为三个步骤：（1）部署到本地集群；（2）等待人工审批；（3）部署到 foo 集群。你会发现它在第一步之后就被暂停了，就像下面这样：

```
$ vela status helm-hello
About:

  Name:      	helm-hello
  Namespace: 	default
  Created at:	2022-06-09 19:38:13 +0800 CST
  Status:    	workflowSuspending

Workflow:

  mode: StepByStep
  finished: false
  Suspend: true
  Terminated: false
  Steps
  - id:ww4cydlvee
    name:deploy2local
    type:deploy
    phase:succeeded
    message:
  - id:xj6hu97e1e
    name:manual-approval
    type:suspend
    phase:succeeded
    message:

Services:

  - Name: hello
    Cluster: local  Namespace: default
    Type: helm
    Healthy Fetch repository successfully, Create helm release successfully
    No trait applied
```

你可以查看并使用 Value 为 “Welcome to Control Plane Cluster!” 的部署在控制平面的 Helm Chart 。

```
vela port-forward helm-hello
```

浏览器会自动提示如下页面：

![resource-detail](/img/helm/helm-c1.jpg)

发现部署成功，让我们继续。

```shell
vela workflow resume helm-hello
```

然后它会部署到 foo 集群，你可以查看这些资源的详细信息。

```console
$ vela status helm-hello --tree --detail
CLUSTER       NAMESPACE     RESOURCE             STATUS    APPLY_TIME          DETAIL
foo       ─── default   ─┬─ HelmRelease/hello    updated   2022-06-09 19:38:13 Ready: True  Status: Release reconciliation succeeded  Age: 64s
                         └─ HelmRepository/hello updated   2022-06-09 19:38:13 URL: https://jhidalgo3.github.io/helm-charts/  Age: 64s  Ready: True
                                                                               Status: stored artifact for revision 'ab876069f02d779cb4b63587af1266464818ba3790c0ccd50337e3cdead44803'
local     ─── default   ─┬─ HelmRelease/hello    updated   2022-06-09 19:38:13 Ready: True  Status: Release reconciliation succeeded  Age: 7m34s
                         └─ HelmRepository/hello updated   2022-06-09 19:38:13 URL: https://jhidalgo3.github.io/helm-charts/  Age: 7m34s  Ready: True
                                                                               Status: stored artifact for revision 'ab876069f02d779cb4b63587af1266464818ba3790c0ccd50337e3cdead44803'
```

再次使用端口转发：

```shell
vela port-forward helm-hello
```

然后它会弹出一些选项：

```
? You have 2 deployed resources in your app. Please choose one:  [Use arrows to move, type to filter]
> Cluster: foo | Namespace: default | Kind: HelmRelease | Name: hello
  Cluster: local | Namespace: default | Kind: HelmRelease | Name: hello
```

选择带有 `foo` 集群的选项，然后你会看到结果已经被新消息覆盖。

```console
$ curl http://127.0.0.1:8080/
...snip...
      <div id="message">
  Welcome to Your New Foo Cluster!
</div>
...snip...
```

## 为不同环境指定不同的 Value 文件

你可以为不同环境选择 Helm Chart 中现有的不同 Value 文件。比如：

请确保你的本地集群有两个命名空间 “test” 和 “prod”，它们代表我们示例中的两个环境。

我们以 Chart `hello-kubernetes-chart` 为例。这个 Chart 有两个 Value 文件。你可以拉取此 Chart 并查看其中包含的所有文件：

```yaml
$ tree ./hello-kubernetes-chart
./hello-kubernetes-chart
├── Chart.yaml
├── templates
│ ├── NOTES.txt
│ ├── _helpers.tpl
│ ├── config-map.yaml
│ ├── deployment.yaml
│ ├── hpa.yaml
│ ├── ingress.yaml
│ ├── service.yaml
│ ├── serviceaccount.yaml
│ └── tests
│ └── test-connection.yaml
├── values-production.yaml
└── values.yaml
```

我们可以看到此 Chart 中有 `values.yaml` `values-production.yaml` 这两个 Value 文件。

```yaml
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: hello-kubernetes
spec:
  components:
    - name: hello-kubernetes
      type: helm
      properties:
        repoType: "helm"
        url: "https://wangyikewxgm.github.io/my-charts/"
        chart: "hello-kubernetes-chart"
        version: "0.1.0"

  policies:
    - name: topology-test
      type: topology
      properties:
        clusters: ["local"]
        namespace: "test"
    - name: topology-prod
      type: topology
      properties:
        clusters: ["local"]
        namespace: "prod"
    - name: override-prod
      type: override
      properties:
        components:
          - name: hello-kubernetes
            properties:
              valuesFiles:
                - "values-production.yaml"
  workflow:
    steps:
      - name: deploy2test
        type: deploy
        properties:
          policies: ["topology-test"]
      - name: deploy2prod
        type: deploy
        properties:
          policies: ["topology-prod", "override-prod"]  
EOF
```

访问 Application 的 endpoint ：

```yaml
vela port-forward hello-kubernetes
```

如果你选择 ```Cluster: local | Namespace: test | Kind: HelmRelease | Name: hello-kubernetes``` 你会看到：

![image](/img/helm/helm-files-test.jpg)

选择 ```Cluster: local | Namespace: prod | Kind: HelmRelease | Name: hello-kubernetes``` 则会看到

![image](/img/helm/helm-files-prod.jpg)

## 清理

如果你使用 velad 进行此演示，则可以通过以下方式便捷地进行清理：

* 清理 foo 集群
```
velad uninstall -n foo
```

* 清理默认集群
```
velad uninstall
```

## 不仅如此

KubeVela 提供的能力远不止如此，通过安装其他插件，你还可以获得包括[金丝雀发布](https://kubevela.io/docs/tutorials/helm-rollout) 在内的更多能力，为你的 Helm Chart 交付保驾护航。

快使用 KubeVela 交付 Helm Chart ，让现代化的应用交付和管理更简单、轻松、可靠！
