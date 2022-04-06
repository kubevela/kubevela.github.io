---
title: KubeVela v1.3 多集群初体验，轻松管理应用分发和差异化配置
author: 段威（段少）
author_title: KubeVela 团队
author_url: https://github.com/oam-dev/kubevela
author_image_url: https://kubevela.io/img/logo.svg
tags: [ KubeVela ]
description: ""
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

在当今的多集群业务场景下，我们经常遇到的需求有：分发到多个指定集群、按业务规划实现分组分发、以及对多集群进行差异化配置等等。

KubeVela v1.3 在之前的多集群功能上进行了迭代，本文将为你揭示，如何使用 KubeVela 进行多集群应用的部署与管理，实现以上的业务需求。

### 开始之前

1. 准备一个 Kubernetes 集群作为 KubeVela 的控制平面。
1. 确保 [KubeVela v1.3](https://github.com/oam-dev/kubevela/releases/tag/v1.3.0) 和 KubeVela CLI v1.3.0 已经安装成功。
1. 你要管理的子集群列表 kubeconfig。我们将以 beijing-1，beijing-2 和 us-west-1 这 3 个集群为例。
1. 下载并结合 [multi-cluster-demo](https://github.com/oam-dev/samples/tree/master/12.Multi_Cluster_Demo) 来更好的理解，如何使用 KubeVela 多集群能力。

### 分发到多个指定集群
对多个指定集群进行分发是最基本的多集群管理操作。在 KubeVela 中，你将使用一个叫做 `topology` 的应用策略来实现它。集群以数组的形式，列在其属性的 `clusters` 字段里。

首先让我们确保切换 KUBECONFIG 到准备好的管控集群，使用 `vela cluster join` 将  beijing-1，beijing-2 和 us-west-1 这 3 个集群全部纳管进来：
```
➜   vela cluster join beijing-1.kubeconfig --name beijing-1
➜   vela cluster join beijing-2.kubeconfig --name beijing-2
➜   vela cluster join us-west-1.kubeconfig --name us-west-1
➜   vela cluster list
CLUSTER        	TYPE           	ENDPOINT                 	ACCEPTED	LABELS
beijing-1      	X509Certificate	https://47.95.22.71:6443 	true
beijing-2      	X509Certificate	https://47.93.117.83:6443	true
us-west-1      	X509Certificate	https://47.88.31.118:6443	true
```
接着打开 multi-cluster-demo，查看 `basic.yaml`：
```
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-app
  namespace: default
spec:
  components:
    - name: hello-world-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: scaler
          properties:
            replicas: 3
        - type: gateway
          properties:
            domain: testsvc-mc.example.com
            # classInSpec : true   如果你所下发的集群里有安装 v1.20 以下版本的 Kubernetes ，请加上这个字段
            http:
              "/": 8000
  policies:
    - type: topology
      name: beijing-clusters
      properties:
        clusters: ["beijing-1","beijing-2"]
```
可以看到，这个应用使用了 `webservice` 类型的组件，最后通过 `topology` 的应用策略分别向 beijing-1 和 beijing-2 两个集群分发 3 副本 Deployment。

**请注意，管控集群对子集群下发资源成功的前提是，子集群必须有已经新建的对应命名空间。由于每个集群默认都有 **`default`** 命名空间，所以可以正常下发。假设我们将** `basic.yaml` **的命名空间改成** `multi-cluster` **，则会收到报错：**
```
... 
 Status:    	runningWorkflow

Workflow:

  mode: DAG
  finished: false
  Suspend: false
  Terminated: false
  Steps
  - id:9fierfkhsc
    name:deploy-beijing-clusters
    type:deploy
    phase:failed
    message:step deploy: step deploy: run step(provider=oam,do=components-apply): Found 1 errors. [(failed to apply component beijing-1-multi-cluster-0: HandleComponentsRevision: failed to create componentrevision beijing-1/multi-cluster/hello-world-server-v1: namespaces "multi-cluster" not found)]

Services:
...
```

**在未来的 KubeVela 版本中，我们将支持使用鉴权系统，更便捷更安全的完成这项操作：通过管控集群一键在子集群创建命名空间。**

完成子集群命名空间创建后，切回管控集群创建应用并下发资源：
```
➜   vela up -f basic.yaml
Applying an application in vela K8s object format...
"patching object" name="example-app" resource="core.oam.dev/v1beta1, Kind=Application"
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward example-app
             SSH: vela exec example-app
         Logging: vela logs example-app
      App status: vela status example-app
  Service status: vela status example-app --svc hello-world-server
```
我们通过 `vela status <应用名>` 查看服务相关信息：
```
➜   vela status example-app
About:

  Name:      	example-app
  Namespace: 	default
  Created at:	2022-03-25 17:42:33 +0800 CST
  Status:    	running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:wftf9d4exj
    name:deploy-beijing-clusters
    type:deploy
    phase:succeeded
    message:

Services:

  - Name: hello-world-server
    Cluster: beijing-1  Namespace: default
    Type: webservice
    Healthy Ready:3/3
    Traits:
      ✅ scaler      ✅ gateway: Visiting URL: testsvc-mc.example.com, IP: 60.205.222.30
  - Name: hello-world-server
    Cluster: beijing-2  Namespace: default
    Type: webservice
    Healthy Ready:3/3
    Traits:
      ✅ scaler      ✅ gateway: Visiting URL: testsvc-mc.example.com, IP: 182.92.222.128
```
beijing-1 和 beijing-2 都下发了对应的资源，它们可供外部访问的 IP 地址也显示出来，你因而可以用你希望的方式供用户访问了。

### 使用集群 labels 按需分组分发
除了上述的基本操作，我们常常会遇到另外的情况：跨地域部署到某些集群、指定哪个云厂商的集群，以及选择是否带 GPU 的集群来保证高性能等等。为了实现类似这样的需求，可以使用多集群的 labels 功能。

在这里，假设 us-west-1 集群来自 AWS，我们要额外分发应用到 AWS 的集群，则可以使用 `vela cluster labels add` 来对集群进行标记。当然，如果还有 us-west-2 等多个 AWS 相关集群，同样进行标记后，将会统一下发：
```
➜  ~ vela cluster labels add us-west-1 provider=AWS
Successfully update labels for cluster us-west-1 (type: X509Certificate).
provider=AWS
➜  ~ vela cluster list
CLUSTER        	TYPE           	ENDPOINT                 	ACCEPTED	LABELS
beijing-1      	X509Certificate	https://47.95.22.71:6443 	true
beijing-2      	X509Certificate	https://47.93.117.83:6443	true
us-west-1      	X509Certificate	https://47.88.31.118:6443	true    	provider=AWS
```
接下来我们对 `basic.yaml` 进行更新，新增一个应用策略 `topology-aws`：
```
...
  policies:
    - type: topology
      name: beijing-clusters
      properties:
        clusters: ["beijing-1","beijing-2"]
    - type: topology
      name: topology-aws
      properties:
        clusterLabelSelector:
          provider: AWS
```
为了方便你学习，请直接部署基于 `basic.yaml` 更新后的 `intermediate.yaml`：
```
➜  ~ vela up -f intermediate.yaml
```
再次查看应用的状态：
```
➜   vela status example-app

...

  - Name: hello-world-server
    Cluster: us-west-1  Namespace: default
    Type: webservice
    Healthy Ready:3/3
    Traits:
      ✅ scaler      ✅ gateway: Visiting URL: testsvc-mc.example.com, IP: 192.168.40.10

```
### 通过应用策略进行配置差异化

除了在 `basic.yaml` 里定义的 `deploy-beijing` 这种应用策略，我们往往有更多的应用策略需求，比如高可用，希望单独给某些资源分发 5 个副本。这样的话，使用`override` 类型的应用策略即可：
```
...        
        clusterLabelSelector:
          provider: AWS
    -  type: override
       name: override-high-availability
       properties:
          components:
            - type: webservice
              traits:
              - type: scaler
                properties:
                  replicas: 5
```
同时假设，我们希望的是，给 AWS 的应用分发并设置为高可用。那我们可以使用 KubeVela 提供的专门用于定义过程控制的工作流来管理。我们使用如下的一个工作流，它希望将本次应用部署，首先通过 deploy-beijing 的应用策略，分发给北京的集群们，接着给 Label 为 AWS 的集群分发 5 个副本高可用的应用策略：
```
...                
                properties:
                  replicas: 5
  workflow:
    steps:
      - type: deploy
        name: deploy-beijing
        properties:
          policies: ["beijing-clusters"]
      - type: deploy
        name: deploy-aws
        properties:
          policies: ["override-high-availability","topology-aws"]
```
接着我们给 `intermediate.yaml` 加上以上的应用策略和工作流后，更新为 `advanced.yaml`：
```
...
  policies:
    - type: topology
      name: beijing-clusters
      properties:
        clusters: ["beijing-1","beijing-2"]
    - type: topology
      name: topology-aws
      properties:
        clusterLabelSelector:
          provider: AWS
    -  type: override
       name: override-high-availability
       properties:
          components:
            - type: webservice
              traits:
              - type: scaler
                properties:
                  replicas: 5
  workflow:
    steps:
      - type: deploy
        name: deploy-beijing
        properties:
          policies: ["beijing-clusters"]
      - type: deploy
        name: deploy-aws
        properties:
          policies: ["override-high-availability","topology-aws"]
```
然后对其进行部署，并再次查看应用的状态：
```
➜   vela up -f advanced.yaml
Applying an application in vela K8s object format...
"patching object" name="example-app" resource="core.oam.dev/v1beta1, Kind=Application"
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward example-app
             SSH: vela exec example-app
         Logging: vela logs example-app
      App status: vela status example-app
  Service status: vela status example-app --svc hello-world-serverapplication.core.oam.dev/podinfo-app configured
  
➜   vela status example-app

...

  - Name: hello-world-server
    Cluster: us-west-1  Namespace: default
    Type: webservice
    Healthy Ready:5/5
    Traits:
      ✅ scaler      ✅ gateway: Visiting URL: testsvc-mc.example.com, IP: 192.168.40.10

```

以上就是本次的全部分享，感谢你的阅读和试玩。

[请安装 KubeVela v1.3 的正式版](https://kubevela.net/zh/docs/install)，这里有更多差异化配置的进阶用法等你发现和使用，比如 `override` 应用策略如何完成资源类型通配还是针对某些特定组件进行覆盖等等，以满足更加复杂的场景需求。