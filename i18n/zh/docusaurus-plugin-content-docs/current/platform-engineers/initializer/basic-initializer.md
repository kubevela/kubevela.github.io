---
title: 自定义环境初始化
---

本章节介绍环境的概念以及如何使用环境初始化（Initializer）初始化一个环境。

## 什么是环境？

一个应用开发团队通常需要初始化一些共享环境供用户部署他们的应用部署计划（Application）。环境是一个逻辑概念，他表示一组应用部署计划依赖的公共资源。
例如，一个团队想要初始化2个环境： 一个开发环境用于开发和测试，一个生产环境用于实际应用部署并提供对外服务。
管理员可以针对环境所代表的实际含义配置相关的初始化方式，创建不同的资源。

环境初始化背后也是用 OAM 模型的方式来执行的，所以环境初始化控制器的功能非常灵活，几乎可以满足任何初始化的需求，同时也是可插拔的。通常而言，可以初始化的资源类型包括但不限于下列类型：

1. 一个或多个 Kubernetes 集群，不同的环境可能需要不同规模和不同版本的 Kubernetes 集群。同时环境初始化还可以将多个 Kubernetes 集群注册到一个中央集群进行统一的多集群管控。

2. 任意类型的 Kubernetes 自定义资源（CRD）和系统插件，一个环境会拥有很多种不同的自定义资源来提供系统能力，比如不同的工作负载、不同的运维管理功能等等。初始化环境可以包含环境所依赖的一系列功能的初始化安装，比如各类中间件工作负载、流量管理、日志监控等各类运维系统。

3. 各类共享资源和服务，一个微服务在不同环境中测试验证时，除了自身所开发的组件以外，往往还会包含一系列其他团队维护的组件和一些公共资源。环境初始化功能可以将其他组件和公共资源统一部署，在无需使用时销毁。这些共享资源可以是一个微服务组件、云数据库、缓存、负载均衡、API网关等等。

4. 各类管理策略和流程，一个环境可能会配备不同的全局策略和流程，举例来说，环境策略可能会包括混沌测试、安全扫描、错误配置检测、SLO指标等等；而流程则可以是初始化一个数据库表、注册一个自动发现配置等。

## 环境初始化（Initializer）

KubeVela 提供了环境初始化（Initializer）允许你自定义组合不同的资源来初始化环境。环境初始化利用了应用部署计划的能力来创建一个环境所需的资源，
你甚至可以利用应用部署计划中的 “应用的执行策略（Policy）" 和 “部署工作流（Workflow）” 来流程化、配置化地创建环境。需要注意的是，多个环境初始化
之间可能会存在依赖关系，一个环境初始化会依赖其他环境初始化提供的能力。

一个环境初始化的整体结构如下：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Initializer
metadata:
  name: <Initializer 名称>
spec:
  # 我们利用 Application 来部署一个环境需要的资源
  appTemplate:
    spec:
      components:
      - name: <环境组件名称>
        type: <环境组件类型>
        properties:
          <环境组件参数>
      policies:
      - name: <应用策略名称>
        type: <应用策略类型>
        properties:
          <应用策略参数>
      workflow:
        - name: <工作流节点名称>
          type: <工作流节点类型>
  # dependsOn 表示依赖的 Initializer
  dependsOn:
  - ref:
      apiVersion: core.oam.dev/v1beta1
      kind: Initializer
      name: <依赖的 Initializer 的名称>
      namespace: <依赖的 Initializer 所在的命名空间>
```

环境初始化定义的核心在 `.spec` 下面的两部分，一部分是应用部署计划的模板，另一部分是环境初始化的依赖。

- 应用部署计划模板（对应`.spec.appTemplate`字段），环境初始化利用应用部署计划来创建环境需要的资源， 你可以按照编写一个应用部署计划的模式填写该字段。
  
- 环境初始化依赖（对应`.spec.dependsOn`字段），一个环境初始化 A 可能会依赖其他环境初始化的能力，只有当依赖的环境初始化正常运行在环境中，才会创建环境初始化 A 包含的资源。

### 环境初始化依赖

不同环境初始化存在依赖关系，可以将不同环境初始化的公共资源分离出一个单独的环境初始化作为依赖，这样可以形成可以被复用的初始化模块。
例如，测试环境和开发环境都依赖了一些相同的控制器，可以将这些控制器提取出来作为单独的环境初始化，在开发环境和测试环境中都指定依赖该环境初始化。

## 如何使用

### 利用 Helm 组件初始化环境

在使用 Helm 组件之前，你需要开启 `fluxcd` 这个[系统插件](../addon)。开启 `fluxcd` 系统插件后，会自动帮你安装 helm 组件。

```shell
vela addon enable fluxcd
```

我们以环境初始化 kruise 为例：

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Initializer
metadata:
  name: kruise
  namespace: vela-system
spec:
  appTemplate:
    spec:
      components:
      - name: kruise
        type: helm
        properties:
          branch: master
          chart: ./charts/kruise/v0.9.0
          version: "*"
          repoType: git
          repoUrl: https://github.com/openkruise/kruise
  dependsOn:
  - ref:
      apiVersion: core.oam.dev/v1beta1
      kind: Initializer
      name: fluxcd
      namespace: vela-system
EOF
```

环境初始化 kruise 能帮你在集群中部署一个 [kruise](https://github.com/openkruise/kruise) 的控制器，给集群提供 kruise 的各种能力。
`dependsOn` 字段表示环境初始化 kruise 依赖环境初始化 fluxcd 提供的能力。 其中，环境初始化 fluxcd 是 KubeVela 内置的环境初始化, 
当集群中没有 `fluxcd` 这个环境初始化时，KubeVela 会自动帮你安装。

```shell
$ kubectl get initializers.core.oam.dev -n vela-system
NAMESPACE     NAME             PHASE     AGE
vela-system   fluxcd           success   33s
vela-system   kruise           success   33s
```

环境初始化的 PHASE 字段为 success 表示成功初始化了环境，我们可以看到 kruise 的控制器也成功运行在集群。未来环境初始化会支持用户自定义判断
初始化环境是否成功的能力。

```shell
$ kubectl get pod -n kruise-system
NAME                                         READY   STATUS    RESTARTS   AGE
kruise-controller-manager-7f77ddc667-htp2f   1/1     Running   0          28m
kruise-controller-manager-7f77ddc667-kzws8   1/1     Running   0          28m
kruise-daemon-5jrq6                          1/1     Running   0          28m
```

环境初始化 fluxcd 会为环境安装 [fluxcd](https://github.com/fluxcd/flux2) 中的控制器和自定义资源，同时也会安装多个依赖 fluxcd 能力的组件定义（ComponentDefinition）。

```shell
$ kubectl get componentdefinitions.core.oam.dev -n vela-system
NAMESPACE     NAME         WORKLOAD-KIND   DESCRIPTION
vela-system   helm                         helm release is a group of K8s resources from either git repository or helm repo
vela-system   kustomize                    kustomize can fetching, building, updating and applying Kustomize manifests from git repo.
```

当你想要创建一个以 Helm Chart 方式打包的控制器时，可以直接在 `.spec.appTemplate` 中使用 `helm` 组件定义，
环境初始化 kruise 就是利用了组件定义 `helm` 来创建 [kruise](https://github.com/openkruise/kruise) 的控制器和自定义资源。

### 在 Initializer 中直接填写 Kubernetes 原生资源

KubeVela 为你提供了一个内置的组件定义 `raw`，你可以直接在组件的 `properties` 字段中填写创建到环境中的原生 Kubernetes 资源。
这种在 Initializer 中直接填写 Kubernetes 原生资源的方式，可以避免编写多余的组件定义（ComponentDefinition）。

以内置的环境初始化 fluxcd 为例，你可以把任意的 Kubernetes 原生资源填写在 `properties` 字段中。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Initializer
metadata:
  annotations:
    addons.oam.dev/description: Flux is a set of continuous and progressive delivery
      solutions for Kubernetes
  name: fluxcd
  namespace: vela-system
spec:
  appTemplate:
    spec:
      components:
      - name: alerts.notification.toolkit.fluxcd.io
        type: raw
        properties:
          apiVersion: apiextensions.k8s.io/v1
          kind: CustomResourceDefinition
          metadata:
            annotations:
              controller-gen.kubebuilder.io/version: v0.5.0
            labels:
              app.kubernetes.io/instance: flux-system
            name: alerts.notification.toolkit.fluxcd.io
          spec:
            group: notification.toolkit.fluxcd.io
            names:
              kind: Alert
              listKind: AlertList
              plural: alerts
              singular: alert
            scope: Namespaced
          ....
```

### 使用部署工作流来流程化初始化环境

你可以利用应用部署计划中的部署工作流（Workflow）来流程化初始化环境。我们以实践案例 **[多集群部署](../../case-studies/workflow-with-ocm)** 
中的环境初始化 [managed-cluster](../../case-studies/workflow-with-ocm#初始化多集群调度功能) 为例：

环境初始化 managed-cluster 会为环境创建一个 ACK 集群，并利用 OCM 将新创建的集群注册到管控集群上。
在 `AppTemplate` 的 `workflow` 字段中描述了环境初始化的流程:

1. 利用 terraform 控制器的能力创建一个 ACK 集群，等待 ACK 创建成功。
   
2. 将新创建的 ACK 集群注册到管控集群。
