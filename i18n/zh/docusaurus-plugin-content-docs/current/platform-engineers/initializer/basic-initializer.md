---
title: 自定义环境初始化
---

本章节介绍环境的概念以及如何使用环境初始化（Initializer）初始化一个环境。

## 什么是环境？

一个应用开发团队通常需要初始化一些共享环境供用户部署他们的应用部署计划（Application）。环境是一个逻辑概念，他表示一组应用部署计划（Application）依赖的公共资源。
例如，一个团队想要初始化2个环境： 一个开发环境用于测试用户的应用部署计划（Application），一个生产环境部署用于用户的应用部署计划（Application）并提供对外服务。
管理员可以针对不同的环境配置不同的资源。

当你创建一个环境时，你可能想要初始化下面几类资源到你的环境：

1. Kubernetes 集群，不同的环境可能需要不同规模和不同版本的 Kubernetes 集群。例如，开发环境需要一个规模较小的 v1.20 版本的 Kubernetes 集群，
而生产环境需要一个规模较大的 v1.18 版本的 Kubernetes 集群。

2. 控制器和CRDs，一个环境会拥有很多种不同的控制器和CRD来提供系统能力。一个环境往往会包含提供流量管理、日志监控、自动扩缩容能力的控制器。

3. 共享资源，一个环境会为不同的应用部署计划（Application）提供系统级别的服务。这些共享资源可以是一个数据库、缓存、负载均衡、API网关等等。

4. 管理策略，生产环境需要为部署在该环境的应用部署计划（Application）设置一个全局的策略。例如：混沌测试、安全扫描、错误配置检测、SLO指标。

## 环境初始化（Initializer）

环境初始化（Initializer）允许你自定义组合不同的资源来初始化环境。环境初始化（Initializer）利用了应用部署计划（Application）的能力来创建一个环境所需的资源，
你甚至可以利用应用部署计划（Application）中的 “应用的执行策略（Policy）" 和 “部署工作流（Workflow）” 来流程化、配置化地创建环境。需要注意的是，多个环境初始化（Initializer）
之间可能会存在依赖关系，一个环境初始化（Initializer）会依赖其他 Initializer 提供的能力。

一个 Initializer 的整体结构如下：

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

Initializer 定义的核心在 `.spec` 下面的两部分，一部分是应用部署计划（Application）的模板，另一部分是环境初始化（Initializer）所依赖的 Initializer。

- 应用部署计划（Application）模板（对应`.spec.appTemplate`字段），环境初始化（Initializer）利用应用部署计划（Application）来创建环境需要的资源，
你可以按照编写一个应用部署计划（Initializer）的模式填写该字段。
  
- 环境初始化依赖（对应`.spec.dependsOn`字段），一个 Initializer A 可能会依赖其他 Initializer 的能力，只有当依赖的 Initializer 
正常运行在环境中，才会创建 Initializer A 包含的资源。
  
## 如何使用

### 利用 Helm 组件初始化环境

我们以环境初始化（Initializer）kruise 为例：

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

环境初始化（Initializer）kruise 能帮你在集群中部署一个 [kruise](https://github.com/openkruise/kruise) 的控制器，给集群提供 kruise 的各种能力。
`dependsOn` 字段表示环境初始化（Initializer）kruise 依赖 Initializer fluxcd 提供的能力。 其中，环境初始化（Initializer）fluxcd 是 
KubeVela 内置的 Initializer, 当安装环境初始化（Initializer）kruise 时，KubeVela 会自动帮你安装 Initializer fluxcd。

```shell
$ kubectl get initializers.core.oam.dev -n vela-system
NAMESPACE     NAME             PHASE     AGE
vela-system   fluxcd           success   33s
vela-system   kruise           success   33s
```

环境初始化（Initializer）fluxcd 会为环境安装 [fluxcd](https://github.com/fluxcd/flux2) 中的控制器和CRDs，
同时也会安装多个依赖 fluxcd 能力的组件定义（ComponentDefinition）。

```shell
$ kubectl get componentdefinitions.core.oam.dev -n vela-system
NAMESPACE     NAME         WORKLOAD-KIND   DESCRIPTION
vela-system   helm                         helm release is a group of K8s resources from either git repository or helm repo
vela-system   kustomize                    kustomize can fetching, building, updating and applying Kustomize manifests from git repo.
```
当你想要创建一个以 Helm Chart 方式打包的控制器时，可以直接在 `.spec.appTemplate` 中使用 `helm` 组件定义，
环境初始化（Initializer）kruise 就是利用了组件定义 `helm` 来创建 [kruise](https://github.com/openkruise/kruise) 的控制器和CRDs。

```shell
$ kubectl  get pod -n kruise-system
NAME                                         READY   STATUS    RESTARTS   AGE
kruise-controller-manager-7f77ddc667-htp2f   1/1     Running   0          28m
kruise-controller-manager-7f77ddc667-kzws8   1/1     Running   0          28m
kruise-daemon-5jrq6                          1/1     Running   0          28m
```

### 在 Initializer 中直接填写 Kubernetes 原生资源

KubeVela 为你提供了一个内置的组件定义 `raw`，你可以直接在组件的 `properties` 字段中填写创建到环境中的原生 Kubernetes 资源。
这种在 Initializer 中直接填写 Kubernetes 原生资源的方式，可以避免编写多余的组件定义（ComponentDefinition）。

以内置的 Initializer fluxcd 为例，你可以把任意的 Kubernetes 原生资源填写在 `properties` 字段中。

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

### 使用 workflow 来流程化初始化环境

你可以利用应用部署计划（Application）中的部署工作流（workflow）来流程化初始化环境。我们以实践案例 **多环境部署** 中的 Initializer managed-cluster 为例：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Initializer
metadata:
  name: managed-cluster
  namespace: vela-system
spec:
  appTemplate:
    spec:
      components:
        - name: ack-worker
          type: alibaba-ack
          properties:
            writeConnectionSecretToRef:
              name: ack-conn
              namespace: vela-system
      workflow:
        steps:
          - name: terraform-ack
            type: create-ack
            properties:
              component: ack-worker
            outputs:
              - name: connInfo
                exportKey: connInfo

          - name: register-ack
            type: register-cluster
            inputs:
              - from: connInfo
                parameterKey: connInfo
  dependsOn:
    - ref:
        apiVersion: core.oam.dev/v1beta1
        kind: Initializer
        name: terraform-alibaba
        namespace: vela-system
```

环境初始化（Initializer）managed-cluster 会为环境创建一个 ACK 集群，并利用 OCM 将新创建的集群注册到管控集群上。
在 `AppTemplate` 的 `workflow` 字段中描述了环境初始化的流程:

1. 利用 terraform-controller 的能力创建一个 ACK 集群，等待 ACK 创建成功。
   
2. 将新创建的 ACK 集群注册到管控集群。
