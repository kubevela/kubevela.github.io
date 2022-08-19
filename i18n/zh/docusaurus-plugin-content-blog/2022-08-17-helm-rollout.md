---
title: The Canary Rollout of the Helm Chart Application Is Coming!
author: 王易可（楚岳）
author_title: KubeVela Team
author_url: https://github.com/kubevela/kubevela
author_image_url: https://KubeVela.io/img/logo.svg
tags: [ KubeVela, "use-case", "helm chart", "Canary Rollout"]
description: ""
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

## 背景

Helm  是云原生领域被广泛采用的客户端应用打包和部署工具，其简洁的设计和易用的体验得到了用户的认可并形成了自己的生态，到如今已有近万个应用使用 Helm Chart 的方式打包。Helm 的设计理念足够简洁，甚至可以归纳为以下两条：
1. 对复杂的 Kubernetes API 做打包和模板化，抽象并简化为少量参数。
2. 给出应用生命周期解决方案：制作、上传（托管）、版本化、分发（发现）、部署。

这两条设计原则保证了 Helm 足够灵活，同时也足够简单，能够涵盖全部的 Kubernetes API，很好的解决了云原生应用一次性交付的场景。然而对于具备一定规模的企业而言，使用 Helm 做软件的持续交付就出现了不小的挑战。

## Helm 持续交付的挑战

Helm 设计之初就为了保证其简单易用，放弃了复杂的组件编排。所以在应用部署时，Helm 是一股脑将所有的资源交付到 Kubernetes 集群中，期望通过 Kubernetes 面向终态的自愈能力，自动化的解决应用的依赖和编排问题。这样的设计在首次部署时可能没有问题，然而对于具备一定规模的企业生产环境而言，就显得过于理想化了。

一方面，在应用升级时一股脑将资源全部更新很容易因为部分服务短暂的不可用造成整体的服务中断；另一方面，如果软件存在 BUG，也无法及时回滚，很容易将影响范围扩大，难以控制。在某些更严重的场景下，如存在生产环境部分配置被运维人工修改过，由于 Helm 一次性部署会将原有的修改全部覆盖，而 Helm 之前的版本与生产环境可能并不一致，导致回滚也无法恢复，形成更大面积的故障。

由此可见，当具备一定规模以后，软件在生产环境的灰度和回滚的能力极其重要，而 Helm 自身并不能保证足够的稳定性。

## 如何针对 Helm 做金丝雀发布？

通常情况下，一个严谨的软件升级过程会遵从类似如下流程：大致分成三个阶段，第一阶段升级少量（如 20% ）的实例，并切换少量流量到新版本，完成这个阶段后先暂停升级。经过人工确认之后继续第二个阶段，升级更大比例（如 90% ）的实例和流量，再次暂停等待人工确认。最后阶段将全量升级到新版本并验证完毕，从而完成整个发布过程。如果升级期间发现包括业务指标在内的任何异常，例如 CPU或 memory 异常使用率升高或请求 500 日志过多等情况，可以快速回滚。

![image](/img/rollout-step.jpg)

上面就是一个典型的金丝雀发布的场景，那么针对 Helm Chart 应用，我们该如何完成上面这个流程呢？业界的典型做法通常有如下两种：
1. 修改 Helm Chart，将工作负载变成两份，并分别暴露出不同的 Helm 参数，在发布时不断修改两份工作负载的镜像、实例数和流量比例，从而实现灰度发布。
2. 修改 Helm Chart，将原先的基础工作负载修改为具备同样功能但是具备灰度发布能力的自定义工作负载，并暴露出 Helm 参数，在发布是操纵这些灰度发布的 CRD。
   

这两个方案都很复杂，有不小的改造成本，尤其是当你的 Helm Chart 是第三方组件无法修改或自身不具备维护 Helm Chart 能力时，这些方法都是不可行的。即使真的去改造了，相比于原先简单的工作负载模式，也存在不小的稳定性风险。究其原因，还是在于 Helm 本身的定位只是一个包管理工具，设计时并不考虑灰度发布、也不针对工作负载做管理。

事实上，当我们跟社区的大量用户深入交流以后，我们发现大多数用户的应用并不复杂，类别都是诸如 Deployment、StatefulSet 这些经典的类型。所以，我们通过 KubeVela( http://kubevela.net/ ) 强大的插件机制，联合 OpenKruise （https://openkruise.io/）社区做了一款针对这些限定类型的金丝雀发布插件。这款插件帮助你不做任何迁移改造，轻松完成 Helm Chart 的灰度发布。不仅如此，如果你的 Helm Chart 比较复杂，你完全可以针对你的场景定制一个插件，获得同样的体验。
   
下面我们通过一个实际的例子（以 Deployment工作负载为例），手把手带你感受一下完整的流程。

## 使用 KubeVela 做金丝雀发布
### 环境准备

- 安装 KubeVela

```shell
$ curl -fsSl https://static.kubevela.net/script/install-velad.sh | bash
velad install
```

See [this document](https://kubevela.net/docs/install#1-install-velad) for more installation details.

- 启用相关的 addon

```shell
$ vela addon enable fluxcd
$ vela addon enable ingress-nginx
$ vela addon enable kruise-rollout
$ vela addon enable velaux
```

在这一步中，启动了以下几个插件：
1. fluxcd 插件帮助我们具备 helm 交付的能力；
2. ingress-nginx 插件用于提供金丝雀发布的流量管理能力；
3. kruise-rollout 提供金丝雀发布能力；
4. velaux 插件则提供界面操作和可视化。

- 将 nginx ingress-controller  的端口映射到本地

```
$ vela port-forward addon-ingress-nginx -n vela-system
```

## 首次部署

通过执行下面的命令，第一次发布 helm 应用。在这一步中，我们通过 vela 的  CLI 工具部署，如果你熟悉 Kubernetes，也可以通过 kubectl apply 部署，效果完全相同。


```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: canary-demo
  annotations:
    app.oam.dev/publishVersion: v1
spec:
  components:
  - name: canary-demo
    type: helm
    properties:
      repoType: "helm"
      url: "https://wangyikewxgm.github.io/my-charts/"
      chart: "canary-demo"
      version: "1.0.0"
    traits:
    - type: kruise-rollout
      properties:
        canary:
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          # The second batch of Canary releases 90% Pods, and 90% traffic imported to the new version.
          - weight: 90
          trafficRoutings:
          - type: nginx
EOF
```

在上面的例子中，我们声明了一个名为  canary-demo 的应用，其中包含一个 helm 类型的组件（KubeVela 也支持其他类型的组件部署），在组件的参数中包含 chart 的地址以及版本等信息。

另外，我们还为这个组件声明了 kruise-rollout 的运维特征，这个就是 kruise-rollout 这个插件安装后具备的能力。其中可以指定 helm 的升级策略，第一个阶段先升级 20% 的实例和流量，经过人工确认之后再升级90%，最后全量升到最新的版本。

需要注意的是，为了演示效果直观（体现版本变化），我们专门准备了一个 [chart](https://github.com/wangyikewxgm/my-charts/tree/main/canary-demo) 。该 helm chart 的主体包含一个 Deployment 和 Ingress 对象，这是 helm chart  制作时最通用的场景。如果你的 helm chart 同样具备上述的资源，也一样可以通过这个例子进行金丝雀的发布。

部署成功之后，我们通过下面的命令访问你集群内的网关地址，将会看到下面的效果：

```shell
$ curl -H "Host: canary-demo.com" http://localhost:8080/version
Demo: V1
```

另外，通过 VelaUX  的资源拓扑页面，我们可以看到五个 V1 版本的实例已经全部就绪。

![image](/img/helm-rollout-v1.jpg)

## 升级应用

应用下面的这个 yaml ，来升级你的应用。

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: canary-demo
  annotations:
    app.oam.dev/publishVersion: v2
spec:
  components:
  - name: canary-demo
    type: helm
    properties:
      repoType: "helm"
      url: "https://wangyikewxgm.github.io/my-charts/"
      chart: "canary-demo"
      # Upgade to version 2.0.0
      version: "2.0.0"
    traits:
    - type: kruise-rollout
      properties:
        canary:
          # The first batch of Canary releases 20% Pods, and 20% traffic imported to the new version, require manual confirmation before subsequent releases are completed
          steps:
          - weight: 20
          # The second batch of Canary releases 90% Pods, and 90% traffic imported to the new version.
          - weight: 90
          trafficRoutings:
          - type: nginx
EOF
```

我们注意到新的  application 和首次部署的相比仅有两处改动：
1. 把 app.oam.dev/publishVersion 的 annotation 从 v1 升级到了 v2。这代表这次修改是一个新的版本。
2. 把 helm chart 的版本升级到了 2.0.0 ，该版本的 chart 中的 deployment 镜像的 tag 升级到了 V2。
   
一段时间之后，我们会发现升级过程停在了我们上面定义的第一个批次，也就是只升级 20% 的实例和流量。这个时候多次执行上面访问网关的命令，你会发现  Demo: v1和  Demo: v2交替出现，并且有差不多 20% 的概率得到  Demo: v2的结果。

```shell
$ curl -H "Host: canary-demo.com" http://localhost:8080/version
Demo: V2
```

再次查看应用的资源的拓扑状态，会看到由 kruise-rollout trait 创建出来的  rolloutCR 为我们创建了一个新版本的实例，而之前工作负载创建出来的5个旧版本的实例并没有发生变化。

![image](/img/helm-rollout-v2.jpg)

接下来，我们通过 vela 的 CLI 执行下面的命令，通过人工审核恢复继续升级：

```shell
$ vela workflow resume canary-demo
```

一段时间之后，通过资源拓扑图，我们看到五个新版本的实例被创建出来了。这个时候我们再次访问网关，会发现出现 Demo：v2 的概率大幅增加，接近于90%。

## 快速回滚

通常在一个真实场景中的发布中，经常会有经过人工审核之后，发现新版本应用的状态异常，需要终止当前的升级，快速将应用回退到升级开始前的版本。

我们就可以执行下面的命令，先暂停当前的发布工作流：

```shell
$ vela workflow suspend canary-demo
Rollout default/canary-demo in cluster  suspended.
Successfully suspend workflow: canary-demo
```

紧接着回滚到发布之前的版本，也就是 V1 ：

```shell
$ vela workflow rollback canary-demo
Application spec rollback successfully.
Application status rollback successfully.
Rollout default/canary-demo in cluster  rollback.
Successfully rollback rolloutApplication outdated revision cleaned up.
```

这个时候，我们再次访问网关，会发现所有的请求结果又回到了 V1 的状态。

```shell
$ curl -H "Host: canary-demo.com" http://localhost:8080/version
Demo: V1
```

这时候，通过资源拓扑图，我们可以看到，金丝雀版本的实例也全部被删除了，并且从始至终，v1 的五个实例，作为稳定版本的实例，一直没有发生任何变化。

![image](/img/helm-rollout-v1.jpg)

如果你将上面的回滚操作改为恢复继续升级，将会继续执行后续的升级过程，完成全量发布。

上述 demo 的完整操作过程请参考 [文档](https://kubevela.net/docs/tutorials/helm) 。

如果你希望直接使用原生的 k8s 资源实现上面过程可以参考 [文档](https://kubevela.net/docs/tutorials/k8s-object-rollout) 。另外，除了 Deployment ，kruise-rollout 插件还支持了 StatefulSet  和 OpenKruise 的 CloneSet ，如果你的 chart 中的工作负载类型是以上三种都可以通过上面的例子实现金丝雀发布。

相信你也看注意到，上面的例子我们给出的是基于 nginx-Ingress-controller 的七层流量切分方案，另外我们也支持了 Kubernetes Gateway 的 [API](https://gateway-api.sigs.k8s.io/) 从而能够支持更多的网关类型和四层的流量切分方案。

## 发布过程的稳定性是如何保证的？

首次部署完成后，kruise rollout 插件（以下简称 rollout）会监听 Helm Chart部署的资源，在我们的例子中就是 deployment， service 和 ingress ，还支持 StatefulSet 以及 OpenKruise Cloneset。rollout 会接管这个 deployment 后续的升级动作。

在进行升级时，新版本的 Helm 部署首先生效，会将 deployment 的镜像更新为 v2，然而这个时候 deployment 的升级过程会被 rollout 从 controller-manager 手中接管，使得 deployment 下面的 Pod 不会被升级。于此同时，rollout 会复制一个金丝雀版本的 deployment，镜像的 tag 为 v2，并创建一个 service 筛选到它下面的实例，和一个指向这个 service 的 ingress ，最后通过设置 ingress 相对应的 annotation，让这个 ingress 承接金丝雀版本的流量，具体可以参考 [文档](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#canary) ，从而实现流量切分。

在通过所有的人工确认步骤之后，完成全量发布时，rollout 会把稳定版本的 deployment 升级控制权交还给 controller-manager ，届时稳定版本的实例会陆续升级到新版本，当稳定版本的实例全部就绪之后，才会陆续销毁金丝雀版本的 deployment，service 和 ingress，从而保证了整个过程中请求流量不会因为打到没有就绪的实例上，导致请求异常，做到无损的金丝雀发布。

之后我们还将在以下方面持续迭代，支持更多的场景并带来更加稳定可靠的升级体验：
1. 升级过程对接 KubeVela 的 workflow 体系，从而引入更加丰富的中间步骤扩展体系，支持升级过程中通过 workflow 执行通知发送等功能。甚至在各个步骤的暂停阶段，对接外部的可观测性体系，通过检查日志或者监控等指标，自动决策是否继续发布或回滚，从而实现无人值守的发布策略。
2. 集成 istio 等 更多的 addon，支持 serviceMesh 的流量切分方案。
3. 除了支持基于百分比流量切分方式，支持基于 header 或 cookie 的流量切分规则，以及支持诸如蓝绿发布等特性。

## 总结

前文已经提到，KubeVela 支持 Helm 做金丝雀发布的流程完全是通过 插件（Addon）体系实现的，fluxcd addon 助我们通过部署和管理 helm chart 的生命周期。kruise-rollout addon 帮助我们实现 workload 的实例升级以及在升级过程中流量的切换。通过组合两个 addon 的方式，实现了对于 helm 应用的全生命周期的管理和金丝雀升级，不需要对你的 Helm Chart 做任何改动。你也可以针对你的场景 [编写插件](https://kubevela.io/docs/platform-engineers/addon/intro) ，完成更特殊的场景或流程。

基于 KubeVela 强大的可扩展能力，你不仅可以灵活地组合这些 addon，你还可以保持上层应用不做任何变动的情况下，根据不同的平台或环境动态替换底层的能力实现。例如，如果你更希望采用 argocd 不是 fluxcd 实现对于 helm 应用的部署，你就可以通过启用 argocd  的 addon 实现相同的功能，上层的 helm 应用不需要做任何改变或迁移。

现在 KubeVela 社区已经提供了数十个 addon ，可以能够帮助平台扩展 可观测性，gitOps，finOps ，rollout 等各方面的能力。

![image](/img/addon-list.jpg)

Addon 的仓库地址是：https://github.com/kubevela/catalog ，如果你对 addon 感兴趣的话，也非常欢迎为这个仓库提交你的自定义插件，为社区贡献新的生态能力！

