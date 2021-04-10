---
title:  概述
---

本部分会详细介绍什么是`Application`，以及为什么需要这个对象。

## 动机

基于封装的抽象可能是应用最广泛的，提供更轻松的开发体验的，并允许用户将整个应用资源作为一个单元来交付的方法。比如说，如今许多工具将 Kubernetes *Deployment* 和 *Service* 封装到 *Web Service* 模块中，然后通过简单地提供参数，比如 *image=foo* 和 *ports=80*，来实例化此模块。这种模式可以在cdk8s(e.g. [web-service.ts](https://github.com/awslabs/cdk8s/blob/master/examples/typescript/web-service/web-service.ts)), CUE (e.g. [`kube.cue`](https://github.com/cuelang/cue/blob/b8b489251a3f9ea318830788794c1b4a753031c0/doc/tutorial/kubernetes/quick/services/kube.cue#L70))中找到，而且很多广泛地使用Helm charts (e.g. [Web Service](https://docs.bitnami.com/tutorials/create-your-first-helm-chart/))。

尽管在定义抽象中，这两种DSL工具（例如cdk8s，CUE和Helm templating）能提供效率和可扩展性，但他们都主要用作客户端工具，几乎不能用作平台级构建块。这就使平台构建者不得不创建受限的/不可扩展的抽象，或者重造 DSL/templating 已经做得很好的轮子。

KubeVela允许平台团队使用 DSL/templating 来创建以开发人员为中心的抽象，同时又可以使用久经沙场的[Kubernetes Control Loop](https://kubernetes.io/docs/concepts/architecture/controller/)对其进行维护。

## Application

首先，KubeVela引入了 `Application` CRD 作为其主要抽象。它可以描述完整的应用部署。为了对现代微服务进行建模，每个应用都由具有附加的*traits*运维能力（操作行为）的多个组件组成。举个例子:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-sample
spec:
  components:
    - name: foo
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: ingress
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
        - type: sidecar
          properties:
            name: "logging"
            image: "fluentd"
    - name: bar
      type: aliyun-oss # cloud service
      bucket: "my-bucket"
```

此应用中的 *component* 和 *trait* specification 的 schema 实际上是由另一组名为 *"definitions"* 的构建模块对象，比如`ComponentDefinition` 和 `TraitDefinition`，执行的。

`XxxDefinition`资源被设计为利用诸如CUE，Helm和Terraform模块之类的封装解决方案来模板化和参数化Kubernetes资源以及云服务。这使用户可以通过简单地设置参数，将模板化的功能组装到一个`Application`中。在上面的`application-sample`中，它对Kubernetes Deployment（组件`foo`）进行建模来运行容器和阿里云OSS bucket（组件`bar`）。

这种抽象机制是KubeVela给业务用户提供诸如app-centric，higher level abstractions，self-service operations等像PaaS的体验的关键。接下来我们会着重讨论其带来的好处。

### 不用依赖“黑魔法”来管理Kubernetes objects

例如，作为平台团队，我们希望利用Istio作为Service Mesh层来控制某些`Deployment`实例的流量。但这在今天可能会操作起来很痛苦，因为我们必须强制业务用户以一些神奇的手段伎俩来定义和管理一组Kubernetes资源。比如说，在一个常见的canary rollout场景，业务用户必须小心仔细的管理一个主要的*Deployment*, 一个主要*Service*, 一个 *root Service*, 一个 canary *Deployment*, 和一个 canary *Service*，而且可能必须要在canary promotion之后给 *Deployment* 重新命名（这在生产中是不可接受的，因为重命名会导致应用重新启动）。更糟糕的是，我们必须希望用户能够仔细地在这些对象上正确设置label和selectors，因为它们是确保每个应用实例都具有正确访问性的关键，并且是Istio controller可以依靠的唯一修订机制

如果组件实例不是*Deployment*而是*StatefulSet*或自定义工作负载类型，则上述问题甚至会更痛苦。例如，通常情况下在rollout期间复制*StatefulSet*实例是没有意义的，这意味着用户必须以与*Deployment*完全不同的方式维护名称，revision，label，selector，和应用实例。

#### 抽象背后的标准合约

KubeVela旨在减轻这种手动管理Kubernetes版本化资源的负担。简而言之，应用所需的所有Kubernetes资源现在都被封装在一个抽象中，并且KubeVela将通过经过实战测试的调谐循环（reconcile loop）自动化（而不是人工操作）来维护实例名称，revision，label和selector。与此同时，定义对象的存在使平台团队可以自己定制抽象背后所有上述元数据的详细信息，甚至可以控制如何进行revision的行为。

因此，所有这些元数据现在都成为了任意day-2 operation controller（例如Istio或者rollout）都可以依赖的标准合约。这是确保我们的平台可以提供用户友好的体验，但对操作行为保持“透明”的关键。

### No Configuration Drift 无配置漂移

现在，任何现有的、轻巧且灵活地定义了抽象的封装解决方案都可在客户端使用，例如DSL / IaC（基础架构即代码）工具和Helm。这种方法易于采用，并且在用户集群中的入侵较少。

但是客户端抽象总是会导致一个名为 *Infrastructure / Configuration Drift* 的问题，即生成的组件实例与预期的配置不符。这可能是由于覆盖范围不完整，流程不尽人意或紧急更改引起的。

因此，KubeVela中的所有抽象均设计为使用 [Kubernetes Control Loop](https://kubernetes.io/docs/concepts/architecture/controller/) 来进行维护，并利用Kubernetes控制平面来消除配置漂移的问题，并且仍然保持现有封装解决方案（例如DSL / IaC和模板化）的灵活性和开发速度。
