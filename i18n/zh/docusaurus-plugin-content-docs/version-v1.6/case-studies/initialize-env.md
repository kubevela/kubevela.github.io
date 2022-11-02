---
title: 一键创建/销毁环境
draft: true
---

本章将介绍如何使用 KubeVela 在交付应用时对环境进行快速初始化和销毁。

## 环境指什么？

一个应用开发团队通常需要做一些初始化工作来满足应用部署时方方面面的需要，即“初始化环境”。
这里的环境是一个逻辑概念，既可以表示应用部署时依赖的公共资源，也可以表示应用运行必要的准备工作。

KubeVela 可以使用 Application 对象做环境的初始化，可以初始化的资源类型包括但不限于下列类型：

1. 一个或多个 Kubernetes 集群，不同的环境可能需要不同规模和不同版本的 Kubernetes 集群。同时环境初始化还可以将多个 Kubernetes 集群注册到一个中央集群进行统一的多集群管控。

2. 任意类型的 Kubernetes 自定义资源（CRD）和系统插件，一个环境会拥有很多种不同的自定义资源来提供系统能力，比如不同的工作负载、不同的运维管理功能等等。初始化环境可以包含环境所依赖的一系列功能的初始化安装，比如各类中间件工作负载、流量管理、日志监控等各类运维系统。

3. 各类共享资源和服务，一个微服务在不同环境中测试验证时，除了自身所开发的组件以外，往往还会包含一系列其他团队维护的组件和一些公共资源。环境初始化功能可以将其他组件和公共资源统一部署，在无需使用时销毁。这些共享资源可以是一个微服务组件、云数据库、缓存、负载均衡、API网关等等。

4. 各类管理策略和流程，一个环境可能会配备不同的全局策略和流程，举例来说，环境策略可能会包括混沌测试、安全扫描、错误配置检测、SLO指标等等；而流程则可以是初始化一个数据库表、注册一个自动发现配置等。

不仅如此，KubeVela 的环境初始化能力还可以跟工作流、策略、依赖等功能相结合，做不同环境的差异化部署，依赖管理等。

若不同环境初始化存在依赖关系，可以初始化的公共资源分离出一个单独的 Application 作为依赖，这样可以形成可以被复用的初始化模块。
例如，测试环境和开发环境都依赖了一些相同的控制器，可以将这些控制器提取出来作为单独的环境初始化，在开发环境和测试环境中都指定依赖该环境初始化。

## 如何使用

### 直接使用应用部署计划完成环境初始化

> 请确保你的 KubeVela 版本在 v1.1.6 及以上。

如果我们希望在环境中使用一个自定义 CRD 控制器(如 [OpenKruise](https://github.com/openkruise/kruise))，那么，我们可以使用 Helm 组件初始化 kruise。

我们可以直接使用 KubeVela 的应用部署计划来初始化 kruise 的环境，该应用会帮你在集群中部署一个 OpenKruise 的控制器，给集群提供 kruise 的各种能力。

由于我们使用 Helm 组件完成 kruise 的部署，我们首先要在集群中使用 [`FluxCD` 插件](https://kubevela.net/docs/reference/addons/fluxcd)开启 helm 功能。
当环境初始化具备多个模块时，可以对初始化的内容进行拆分，同时使用工作流的 `depends-on-app` 步骤，描述不同初始化模块的依赖关系。
比如我们可以在这个例子里，使用 `depends-on-app` 表示环境初始化 kruise 依赖环境初始化 `addon-fluxcd` 提供的能力。同时，使用 `apply-once` 策略来确保资源只会部署一次来完成初始化。

> `depends-on-app` 会根据 `properties` 中的 `name` 及 `namespace`，去查询集群中是否存在对应的应用。
如果应用存在，则当该应用的状态可用时，才会进行下一个步骤；
若该应用不存在，则会去查询同名的 configMap，从中读取出应用的配置并部署到集群中。
> 更详细的说明，请查看 [depends-on-app](../end-user/workflow/built-in-workflow-defs#depends-on-app)。

部署如下文件：

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: kruise
  namespace: vela-system
spec:
  components:
    - name: kruise
      type: helm
      properties:
        repoType: helm
        url: https://openkruise.github.io/charts/
        chart: kruise
        version: 1.2.0
        git:
          branch: master
        values:
          featureGates: PreDownloadImageForInPlaceUpdate=true
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
  workflow:
    steps:
    - name: check-flux
      type: depends-on-app
      properties:
        name: addon-fluxcd
        namespace: vela-system
    - name: apply-kruise
      type: apply-component
      properties:
        component: kruise
EOF
```

查看集群中应用的状态：

```shell
vela status kruise -n vela-system
```

<details>
<summary>期望输出</summary>

```console
About:

  Name:      	kruise
  Namespace: 	vela-system
  Created at:	2022-10-31 18:10:27 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: l6apfsi5c2
    name: check-flux
    type: depends-on-app
    phase: succeeded
  - id: p2nqell47w
    name: apply-kruise
    type: apply-component
    phase: succeeded

Services:

  - Name: kruise
    Cluster: local  Namespace: vela-system
    Type: helm
    Healthy Fetch repository successfully, Create helm release successfully
    No trait applied
```
</details>

kruise 已经成功运行！之后，你可以在环境中使用 kruise 的能力。如果需要配置新的环境初始化，也只需要类似的定义一个部署计划。 

### 在应用部署中加入初始化的工作流

在环境中，一些通用的 ConfigMap / PVC 等资源是十分常用的。
如果你希望在部署应用前内置一些通用资源，可以在应用部署中加入初始化的工作流来完成。

KubeVela 提供了一个内置的工作流步骤 `apply-object`，可以直接在组件的 `properties` 字段中填写创建到环境中的原生 Kubernetes 资源。
这种在 Application 中直接填写 Kubernetes 原生资源的方式，可以避免编写多余的组件定义（ComponentDefinition）。

部署如下应用，初始化一个带有 ConfigMap / PVC 的环境。同时，部署两个组件，第一个组件会不断向 PVC 中写入数据，第二个组件会读取 PVC 中的数据：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: server-with-pvc-and-cm
  namespace: default
spec:
  components:
  - name: log-gen-worker
    type: worker
    properties:
      image: busybox
      cmd:
        - /bin/sh
        - -c
        - >
          i=0;
          while true;
          do
            echo "$i: $(date)" >> /test-pvc/date.log;
            i=$((i+1));
            sleep 1;
          done
      volumes:
        - name: "my-pvc"
          type: "pvc"
          mountPath: "/test-pvc"
          claimName: "my-claim"
        - name: "my-configmap"
          type: "configMap"
          mountPath: "/test-cm"
          cmName: "my-cm"
          items:
            - key: test-key
              path: test-key
  - name: log-read-worker
    type: worker
    properties:
      name: count-log
      image: busybox
      cmd: 
        - /bin/sh
        - -c
        - 'tail -n+1 -f /test-pvc/date.log'
      volumes:
        - name: "my-pvc"
          type: "pvc"
          mountPath: "/test-pvc"
          claimName: "my-claim"
        - name: "my-configmap"
          type: "configMap"
          mountPath: "/test-cm"
          cmName: "my-cm"
          items:
            - key: test-key
              path: test-key

  policies:
    - name: my-policy
      properties:
        clusters:
        - local
      type: topology
    - name: apply-once
      type: apply-once
      properties:
        enable: true

  workflow:
    steps:
      - name: apply-pvc
        type: apply-object
        properties:
          value:
            apiVersion: v1
            kind: PersistentVolumeClaim
            metadata:
              name: my-claim
              namespace: default
            spec:
              accessModes:
              - ReadWriteOnce
              resources:
                requests:
                  storage: 8Gi
              storageClassName: standard
      - name: apply-cm
        type: apply-object
        properties:
          value:
            apiVersion: v1
            kind: ConfigMap
            metadata:
              name: my-cm
              namespace: default
            data:
              test-key: test-value
      - name: deploy-comp
        properties:
          policies:
          - my-policy
        type: deploy
```

查看集群中的 PVC 以及 ConfigMap：

```shell
vela status server-with-pvc-and-cm --detail --tree
```

<details>
<summary>期望输出</summary>

```console
CLUSTER       NAMESPACE     RESOURCE                       STATUS    APPLY_TIME          DETAIL
local     ─── default   ─┬─ ConfigMap/my-cm                updated   2022-10-31 18:00:52 Data: 1  Age: 57s
                         ├─ PersistentVolumeClaim/my-claim updated   2022-10-31 10:00:52 Status: Bound  Volume: pvc-b6f88ada-af98-468d-8cdd-31ca110c5e1a  Capacity: 8Gi  Access Modes: RWO  StorageClass: standard  Age: 57s
                         ├─ Deployment/log-gen-worker      updated   2022-10-31 10:00:52 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 57s
                         └─ Deployment/log-read-worker     updated   2022-10-31 10:00:52 Ready: 1/1  Up-to-date: 1  Available: 1  Age: 57s
```
</details>

查看集群中应用的状态：

```shell
vela status server-with-pvc-and-cm
```

<details>
<summary>期望输出</summary>

```console
$ vela status server-with-pvc-and-cm
About:

  Name:      	server-with-pvc-and-cm
  Namespace: 	default
  Created at:	2022-10-31 18:00:51 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: xboizfjo28
    name: apply-pvc
    type: apply-object
    phase: succeeded
  - id: 4ngx25mrx8
    name: apply-cm
    type: apply-object
    phase: succeeded
  - id: 1gzzt3mfw1
    name: deploy-comp
    type: deploy
    phase: succeeded

Services:

  - Name: log-gen-worker
    Cluster: local  Namespace: default
    Type: worker
    Healthy Ready:1/1
    No trait applied

  - Name: log-read-worker
    Cluster: local  Namespace: default
    Type: worker
    Healthy Ready:1/1
    No trait applied
```
</details>

检查第二个组件的日志输出：

```shell
vela logs server-with-pvc-and-cm --component log-read-worker
```

<details>
<summary>期望输出</summary>

```console
+ log-read-worker-7f4bc9d9b5-kb5l6 › log-read-worker
log-read-worker 2022-10-31T10:01:15.606903716Z 0: Mon Oct 31 10:01:13 UTC 2022
log-read-worker 2022-10-31T10:01:15.606939383Z 1: Mon Oct 31 10:01:14 UTC 2022
log-read-worker 2022-10-31T10:01:15.606941883Z 2: Mon Oct 31 10:01:15 UTC 2022
log-read-worker 2022-10-31T10:01:16.607006425Z 3: Mon Oct 31 10:01:16 UTC 2022
log-read-worker 2022-10-31T10:01:17.607184925Z 4: Mon Oct 31 10:01:17 UTC 2022
log-read-worker 2022-10-31T10:01:18.607304426Z 5: Mon Oct 31 10:01:18 UTC 2022
...
```
</details>

可以看到，应用中的两个组件均已正常运行。同时，这两个组件共享同一个 PVC，并使用相同的 ConfigMap 进行配置。

## 如何销毁环境

因为我们已经通过应用（Application）这个统一的模型做了环境初始化，所以销毁环境变得非常简单，只需要删除这个应用即可。

```
vela delete server-with-pvc-and-cm
```

KubeVela 控制器会自动将资源删除。
