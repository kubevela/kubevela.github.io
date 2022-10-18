---
title: "KubeVela 插件指南：轻松扩展你的平台专属能力"
authors:
- name: 姜洪烨
  title: KubeVela Team
  url: https://github.com/charlie0129
  image_url: https://github.com/charlie0129.png
tags: [ "KubeVela", "addon", "extensibility" ]
description: 手把手教你如何制作 KubeVela 自定义插件。
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

KubeVela 插件（addon）可以方便地扩展 KubeVela 的能力。正如我们所知，KubeVela 是一个微内核高度可扩展的平台，用户可以通过 [模块定义（Definition）](https://kubevela.net/zh/docs/platform-engineers/oam/x-definition)扩展 KubeVela 的系统能力，而 KubeVela 插件正是方便将这些**自定义扩展**及其**依赖**打包并分发的核心功能。不仅如此，KubeVela 社区的插件中心也在逐渐壮大，如今已经有超过 50 款插件，涵盖可观测性、微服务、FinOps、云资源、安全等大量场景功能。

这篇博客将会全方位介绍 KubeVela 插件的核心机制，教你如何编写一个自定义插件。在最后，我们将展示最终用户使用插件的体验，以及插件将如何融入到 KubeVela 平台，为用户提供一致的体验。

<!--truncate-->

## 为什么要使用 KubeVela 插件

用户使用插件的一个典型方法是通过 KubeVela 团队维护的 [插件中心（addon catalog）](https://github.com/kubevela/catalog) ，它包含了 KubeVela 团队与社区开发者精心编写的系统扩展功能，并以插件的形式发布于插件中心，这样你可以一键下载并安装这些插件。例如安装 FluxCD 可以快速给你的 KubeVela Application 提供部署 Helm Chart 的能力。

相较于使用 KubeVela 的插件功能，如果你自己的内部平台想要集成一个云原生的功能，你大概会这么做：

1. 通过 Helm Chart 或者下载 yaml 文件手动安装 FluxCD 或类似的 CRD Operator。
2. 编写系统集成的代码，让用户界面可以通过统一的方式使用 FluxCD 等 CRD 的功能，在 KubeVela 系统中就是通过编写模块定义（OAM Definition）完成。

实际上，在 KubeVela 1.1 版本之前，我们也是通过类似的方式完成的。这会带来如下问题：

1. **操作繁琐**：用户需要手动查阅文档如何安装 FluxCD 并处理可能发生的错误
2. **资源分散**：用户需要下载不同的文件，既需要安装 Helm 安装 FluxCD 还需要下载模块定义等系统扩展的集成配置
3. **难以分发复用**：用户需要手动下载模块定义就注定了这些资源难以以一个统一的方式分发给用户，也无法形成社区生态让不同的用户可以享受社区便利
4. **缺少多集群支持**：KubeVela 将多集群交付作为一等公民，而这样的手动安装系统扩展的方式显然难以维护多集群的环境
5. **无版本管理**：用户需要手动管理模块定义和 Controller 之间的版本

而 KubeVela 插件就是为了逐一解决这些问题而诞生的。

## KubeVela 插件是如何工作的

KubeVela 的插件主要包含两部分：

- 一部分是安装能力的提供者，通常是一个 CRD Operator/Controller。这个**安装过程实质上就是运行一个 OAM 应用**，addon 交付中所使用的功能与普通应用能力完全等价。
- 另一部分就是扩展能力跟 KubeVela 体系的粘合层，也就是模块定义和其他的一些集成配置。OAM 模块定义为用户提供了插件扩展出的组件、运维特征以及工作流步骤等功能，也帮助 CRD Operator 提供用户友好的抽象，使得最终用户无需理解复杂的 CRD 参数，只需要根据最佳实践提供必要的参数。

![](../../../docs/resources/addon-mechanism.jpg)

插件的工作机制如上图所示，KubeVela 的应用具备多集群交付的能力，所以也能帮助插件中的 CRD Operator 部署到这些集群中。模块定义文件仅需要在控制面被 KubeVela 使用，所以无需部署到被管控的集群中。

:::tip
一旦插件被安装，就会创建一个 KubeVela 应用，包含所有的相关资源和配置，这些配置都会设置 KubeVela 应用对外作为 OwnerReference（父节点）。当我们想要卸载一个插件时，只需要删除这个应用，Kubernetes 提供的资源回收机制会自动将标记了 OwnerReference 的资源一并删除。
:::

例如一个 Redis 插件，它能让用户在自己的应用中使用 Redis 集群类型的组件（Component），这样可以快速创建 Redis 集群。那么这个插件至少会包括一个 Redis Operator 来提供创建 Redis 集群的能力（通过 Application 描述），还有一个组件的模块定义 （ComponentDefinition） 来提供 Redis 集群的组件类型。

所有整个插件的安装过程会将 Redis Operator 放在一个 KubeVela 应用中下发到多集群，而组件定义和 UI 扩展等配置文件则只部署到控制面集群并设置应用对象为 OwnerReference。

## 创建自己的插件

:::tip
为保证以下内容功能全部可用，请确保你的 KubeVela 版本 为 v1.5+。 
:::

我们将以 Redis 插件为例，讲解如何从头创建一个 KubeVela 插件的实际过程。本次完整的 Redis 插件代码见 [catalog/redis-operator](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator)。

:::tip
在这里我们会尽可能全面的介绍制作插件中涉及的核心知识，但是作为一个介绍性博客，我们会尽量避免讨论过深的细节以免篇幅过于膨胀，了解完整的功能及细节可以参考[自定义插件文档](https://kubevela.net/zh/docs/platform-engineers/addon/intro)。
:::

**首先我们需要思考我们要创建的插件有什么作用？** 例如我们假设 Redis 插件可以提供 `redis-failover` 类型的 Component，这样用户只需在 Application 中定义一个 `redis-failover` Component 即可快速创建 Redis 集群。

**然后考虑如何达到这个目的？** 要提供 `redis-failover` 类型的 Component 我们需要定义一个 ComponentDefinition ；要提供创建 Redis 集群的能力支持，我们可以使用 [Redis Operator](https://github.com/spotahome/redis-operator) 。

那至此我们的大目标就明确了：

- 编写插件的应用描述文件（OAM Application），这将会用于安装 Redis Operator （完整代码可以到插件中心的[`template.cue`](https://github.com/kubevela/catalog/blob/master/experimental/addons/redis-operator/template.cue) 及 [`resources/`](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator/resources) 目录查看。）
- 编写 `redis-failover` 类型的 [ComponentDefinition](https://kubevela.net/zh/docs/platform-engineers/components/custom-component) （完整代码请查看 [`definitions/` 目录](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator/definitions)）

不过在开始编写之前，我们首先需要了解一个 KubeVela 插件的目录结构。后续我们会在编写的过程中详细说明每个文件的作用，在这里只需大致了解有哪些文件即可。

:::tip
命令行工具 `vela addon init` 可以帮助你创建目录结构的初始化脚手架。
:::

```shell
redis-operator/          
├── definitions           
│   └── redis-failover.cue 
├── resources              
│   ├── crd.yaml           
│   ├── redis-operator.cue
│   └── topology.cue       
├── metadata.yaml         
├── parameter.cue         
├── README.md             
└── template.cue      
```

让我们逐一来解释它们：

1. `redis-operator/` 是目录名，同时也是插件名称，请保持一致。
2. `definitions/` 用于存放模块定义, 例如 TraitDefinition 和 ComponentDefinition。
3. `redis-failover.cue` 定义我们编写的 redis-failover 组件类型，包含了用户如何使用这个组件的参数以及这个组件与底层资源交互的细节。
4. `resources/` 用于存放资源文件, 之后会在 `template.cue` 中使用他们共同组成一个 KubeVela 应用来部署插件。
5. `crd.yaml` 是 Redis Operator 的 Kubernetes 自定义资源定义，在 `resources/` 文件夹中的 YAML 文件会被直接部署到集群中。
6. `redis-operator.cue` 一个 web-service 类型的 Component ，用于安装 Redis Operator。
7. `topology.cue` 是可选的，帮助 KubeVela 建立应用所纳管资源的拓扑关系。
8. `metadata.yaml` 是插件的元数据，包含插件名称、版本、维护人等，为插件中心提供了概览信息。
9. `parameter.cue` 插件参数定义，用户可以利用这些参数在插件安装时做轻量级自定义。
10. `README.md` 提供给最终用户阅读，包含插件使用指南等。
11. `template.cue` 定义插件最终部署时的完整应用形态，包含一个 OAM 应用模板以及对其他资源对象的引用。

:::tip
在插件中制作中我们会广泛使用 CUE 语言来编排配置，如果对 CUE 不熟悉，可以花 10 分钟快速查阅[入门指南](https://kubevela.net/zh/docs/platform-engineers/cue/basic)有一个基本了解。
:::

### parameter.cue

```cue
parameter: {
	//+usage=Redis Operator image.
	image: *"quay.io/spotahome/redis-operator:v1.1.0" | string
	// 其余省略
}
```

在 `parameter.cue` 中定义的参数都是用户可以自定义的（类似于 Helm Values），后续在 template.cue 或者 resources 中可以通过 `parameter.<parameter-name>` 访问参数。在我们的例子中，用户可以自定义 `image` ，这样后续我们创建 Redis Operator (`redis-operator.cue`) 的时候可以通过 `parameter.image` 使用用户指定的容器镜像。

参数不仅可以给用户预留安装时的自定义输入，还可以作为安装时的条件进行部分安装。比如 `fluxcd` 插件有一个参数叫 [`onlyHelmComponents`](https://github.com/kubevela/catalog/blob/master/addons/fluxcd/parameter.cue)，它的作用就是可以帮助用户只部署用于安装 Helm Chart 的组件能力，而其他控制器就可以不安装。如果你对于实现细节感兴趣，可以参考fluxcd 插件的 [这部分配置](https://github.com/kubevela/catalog/blob/master/addons/fluxcd/template.cue#L25).

在设计提供什么参数供用户自定义插件安装时，我们也应该遵循一下这些最佳实践来为用户提供更好的使用体验。

:::tip 最佳实践
- 不要在 parameter.cue 中提供大量的细节参数，将大量细节抽象出少量参数供用户调节是一个更好的做法
- 为参数提供默认值（如样例中的 image 参数）或将参数标记为可选（如样例的 clusters 参数），确保用户仅使用默认值可以得到一个可用的配置
- 为参数提供使用说明（通过注释标记实现，见样例）
- 尽量保持插件不同版本间的参数一致，防止因为升级导致不兼容
:::

### `template.cue` 和 `resources/` 目录

这是存放我们应用描述文件的地方，即一个 OAM Application 。这描述了实际的插件安装过程。我们主要会在这里包含 Redis Operator ，给集群提供管理 Redis 集群的能力。

`template.cue` 和 `resources/` 目录本质上是相同的，都是构成 KubeVela 应用的组成部分，且都是在同一个 package 下的 CUE 文件。

那为什么需要 resources 目录呢？除去历史原因，这主要是为了可读性的考虑，在 Application 中包含大量资源的时候 template.cue 可能变得很长，这时我们可以把资源放置在 resource 中增加可读性。一般来说，我们将 Application 的框架放在 template.cue 中，将 Application 内部的 Components、Traits 等信息放在 resource 目录中。

#### template.cue

`template.cue` 定义了应用的框架，绝大多数内容都是固定写法，具体的作用可以参考代码块中的注释。

```cue
// template.cue 应用描述文件

// package 名称需要与 resources 目录中 cue 的 package 一致，方便引用 resources 目录中的内容
package main

// Application 模板中多数字段均为固定写法，你需要注意的只有 spec.components

output: {
	// 这是一个经典的 OAM Application
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	// 不需要 metadata
	spec: {
		components: [
			// 创建 Redis Operator
			redisOperator // 定义于 resources/redis-operator.cue 中
		]
		policies: [
		// 这里会指定安装插件的 namespace ，是否安装至子集群等
		// 多为固定写法，无需记忆，可查阅本次样例的完整代码
		// https://github.com/kubevela/catalog/blob/master/experimental/addons/redis-operator/template.cue
		// 文档可参照 https://kubevela.net/zh/docs/end-user/policies/references
		]
	}
}
// 定义资源关联规则，用于将资源粘合在一起。后续会着重介绍
// Documentation: https://kubevela.net/zh/docs/reference/topology-rule
outputs: topology: resourceTopology // 定义于 resources/topology.cue 中
```

在插件安装时，系统主要关注两个关键字：

- 一是 `output` 字段，定义了插件对应的应用，在应用内部 `spec.components` 定义了部署的组件，在我们的例子中引用了存放在 `resources/` 目录中的 `redisOperator` 组件。output 中的 Application 对象不是严格的 Kubernetes 对象，其中 metadata 里的内容（主要是插件名称）会被插件安装的过程自动注入。
- 另一个是 `outputs` 字段，定义了除了常规应用之外的配置，任何你想要跟插件一同部署的额外 Kubernetes 对象都可以定义在这里。请注意 outputs 中的这些对象必须遵循 Kubernetes API。

#### `resources/` 资源文件

我们这里使用一个 `webservice` 类型的 Component 来安装 Redis Operator。当然，如果你可以接受依赖 FluxCD 的话，你也可以使用 `helm` 类型的 Component 直接安装一个 Helm Chart（因为 `helm` 类型的 Component 主要由 FluxCD 插件提供）。不过编写 addon 的一个原则是尽量减少外部依赖，所以我们这里使用 KubeVela 内置的 `webservice` 类型，而不是 `helm`。

```cue
// resources/redis-operator.cue

// package 名称与 template.cue 一致，方便在 template.cue 中引用以下的 redisOperator
package main

redisOperator: {
	// 这是 OAM Application 中的 Component ，它将会创建一个 Redis Operator
	// https://kubevela.net/zh/docs/end-user/components/references
	name: "redis-operator"
	type: "webservice"
	properties: {
		// Redis Operator 镜像名称，parameter.image 即在 parameter.cue 中用户可自定义的参数
		image:           parameter.image
		imagePullPolicy: "IfNotPresent"
	}
	traits: [
		// 略
	]
}
```

你可以阅读代码块中的注释了解字段的具体作用。

#### KubeVela 提供的资源粘合能力

值得注意的一个功能是 [*资源关联规则 (Resource Topology)*](https://kubevela.net/zh/docs/reference/topology-rule) 。虽然它不是必须的，但是它能帮助 KubeVela 建立应用所纳管资源的拓扑关系。这就是 KubeVela 如何将各种各样的资源粘合成 Application 的。这在我们使用 Kubernetes 自定义资源（CR）的时候特别有用。

```cue
// resources/topology.cue

package main

import "encoding/json"

resourceTopology: {
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: {
		name:      "redis-operator-topology"
		namespace: "vela-system"
		labels: {
			"rules.oam.dev/resources":       "true"
			"rules.oam.dev/resource-format": "json"
		}
	}
	data: rules: json.Marshal([{
		parentResourceType: {
			group: "databases.spotahome.com"
			kind:  "RedisFailover"
		}
		// RedisFailover CR 会创建以下三类资源
		childrenResourceType: [
			{
				apiVersion: "apps/v1"
				kind:  "StatefulSet"
			},
			// KubeVela 内置 Deployment 等资源的拓扑，因此无需继续向下编写
			{
				apiVersion: "apps/v1"
				kind:  "Deployment"
			},
			{
				apiVersion: "v1"
				kind:  "Service"
			},
		]
	}])
}
```

在本例中，`redis-failover` 类型的 Component 会创建一个 CR ，名为 RedisFailover 。但是在没有资源关联规则的情况下，假设在你的 Application 中使用了 RedisFailover ，虽然我们知道 RedisFailover 管控了数个 Redis Deployment ，但是 KubeVela 并不知道 RedisFailover 之下有 Deployment 。这时我们可以通过 *资源关联规则* 将我们对于 RedisFailover 的了解*告诉* KubeVela，这样 KubeVela 可以帮助我们建立起整个应用下面纳管资源的拓扑层级关系。此时你将获得 KubeVela 提供的许多有用功能，效果见 [运行插件](#运行插件)。

:::tip
资源的拓扑关联功能给我们带来了许多有用的功能，最重要的是为 KubeVela 最终用户使用扩展能力提供了统一体验：

- VelaUX 资源拓扑视图，从应用到底层资源 Pod 的关联关系一应俱全，包括多集群
- 统一的 `vela exec` 命令可以在不同应用组件类型关联的底层容器中执行命令，包括多集群
- 统一的 `vela port-forward` 转发不同类型应用组件关联的底层容器端口，包括多集群
- 统一的 `vela log` 查看不同类型应用组件关联的底层容器日志，包括多集群
- 统一的 `vela status --pod/--endpoint` 查看不同类型应用组件关联的底层容器日志，获得可供访问的地址等，包括多集群
:::

### `definitions/` 目录

Definitions 目录存放 KubeVela [模块定义（Definition）](https://kubevela.io/docs/getting-started/definition)，包括组件定义（ComponentDefinition）、策略定义（TraitDefinition）等。**这是插件中最重要的部分，因为它包含了最终用户安装这个插件以后可以获得哪些功能。**有了这里定义的组件、运维特征、工作流等类型，最终用户就可以在应用中使用他们了。

在插件中编写模块定义跟常规的编写流程一致，这是一个很大的话题，在这里我们就不详细展开了。你可以通过阅读模块定义对应的文档了解其中的细节：

- [自定义组件 Component Definition](https://kubevela.io/docs/platform-engineers/components/custom-component)
- [自定义运维特征 Trait Definition](https://kubevela.io/docs/platform-engineers/traits/customize-trait)
- [自定义策略 Policy Definition](https://kubevela.io/docs/platform-engineers/policy/custom-policy)
- [自定义工作流步骤 Workflow Step Definition](https://kubevela.io/docs/platform-engineers/workflow/workflow)。

在本例中，我们编写 Redis 组件类型主要参照 [自定义组件](https://kubevela.net/zh/docs/platform-engineers/components/custom-component) 与 [Redis Operator 使用文档](https://github.com/spotahome/redis-operator/blob/master/README.md) ，我们将组件类型命名为 `redis-failover`，它会创建一个 RedisFailover 的 CR ，这样刚刚添加的 Redis Operator 就可以帮助创建 Redis 集群，见[完整代码](https://github.com/kubevela/catalog/blob/master/experimental/addons/redis-operator/definitions/redis-failover.cue)。

### metadata.yaml

这里包含了插件的元数据，即插件的名称、版本、系统要求等，可以参考[文档](https://kubevela.net/zh/docs/platform-engineers/addon/intro#%E6%8F%92%E4%BB%B6%E7%9A%84%E5%9F%BA%E6%9C%AC%E4%BF%A1%E6%81%AF%E6%96%87%E4%BB%B6)。需要注意的是，本次介绍的为 KubeVela v1.5 之后的新写法，因此需要避免使用某些不兼容的元数据字段，以下样例中包含了所有的可用元数据。

:::tip
例如传统的 `deployTo.runtimeCluster` （安装至子集群）等元数据在新写法中已有代替（使用 topology Policy），应当使用新写法。可见完整代码中的 [`template.cue`](https://github.com/kubevela/catalog/blob/958a770a9adb3268e56ca4ec2ce99d2763617b15/experimental/addons/redis-operator/template.cue#L28)
:::

```yaml
# 插件名称，与目录名一致
name: redis-operator
# 插件描述
description: Redis Operator creates/configures/manages high availability redis with sentinel automatic failover atop Kubernetes.
# 展示用标签
tags:
- redis
# 插件版本
version: 0.0.1
# 展示用图标
icon: https://xxx.com
# 插件所包含项目的官网地址
url: https://github.com/spotahome/redis-operator
# 可能依赖的其他插件，例如 fluxcd
dependencies: []

# 系统版本要求
system:
  vela: ">=v1.5.0"
  kubernetes: ">=1.19"
```

## 运行插件

至此我们已经将插件的主要部分编写完成，下载 [完整代码](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator) 补全部分细节后，即可尝试运行。

下载得到 redis-operator 目录后，我们可以通过 `vela addon enable redis-operator` 安装本地的 `redis-operator` 插件，这种本地安装插件的方式也可以方便你再制作时做一些调试。

安装完成后就可以参考插件的 [README](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator/README.md) 试用我们的 Redis 插件了！

:::tip
这里也体现出插件的 README 的重要性，其中需要包括插件的作用、详细使用指南等，确保用户可以快速上手。
:::

在用户使用你编写的插件时，只需如下 **4** 行 yaml 即可在 Application 中创建包含 3 个 Node 的高可用 Redis 集群！相比于手动安装 Redis Operator 并创建 CR ，甚至逐一手动配置 Redis 集群，插件的方式极大地方便了用户。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: redis-operator-sample
spec:
  components:
    # This component is provided by redis-operator addon.
    # In this example, 2 redis instance and 2 sentinel instance
    # will be created.
    - type: redis-failover
      name: ha-redis
      properties:
        # You can increase/decrease this later to add/remove instances.
        replicas: 3
```

只需 apply 仅仅数行的 yaml 文件，我们就轻松创建了如下图所示的整个复杂的资源。并且由于我们编写了 *资源关联规则 (Resource Topology)* ，用户可以通过 VelaUX 轻松获得刚刚创建的 Redis 集群的资源拓扑状态，了解 Application 底层资源的运行状况，不再受限于 Application Component 级别的可观测性。如图我们能直接观测到整个 Application 的拓扑，直至每个 Redis Pod ，可见图中部分 Pod 仍在准备中：

![redis-operator-sample-topology-graph](/img/blog-addon/redis-operator-sample-topology-graph.png)

在执行 `vela exec/log/port-forward` 等命令时也可以精确地看到 Application 底层包含的资源（即支撑 Redis 集群的 3 个 Redis Pod 和 3 个 Sentinel Pod）。

![redis-operator-sample-pod-topology](/img/blog-addon/redis-operator-sample-pod-topology.png)

:::
如果你在使用单集群，乍一看你可能不会觉得 exec 进一个 Pod 是很特殊的功能。但是一旦考虑到多集群，能够在横跨多个集群的资源中跟单集群一样以统一的方式进行选择查看能够极大的节省时间。
:::

使用 `vela status` 命令能获取这个 Application 的运行状态，有了资源关联规则后可以更进一步，直接通过 vela 寻找出 Redis Sentinel 的 Endpoint 来访问 Redis 集群：

![redis-operator-sample-endpoint](/img/blog-addon/redis-operator-sample-endpoint.png)

## 结语

通过本文，相信你已经了解插件的作用及制作插件的要点。通过插件体系，我们将获得如下优势：

1. 将平台的能力打包成一个易于安装、便于分发复用、且可以形成社区生态的插件市场。
2. 充分复用 CUE 和 KubeVela 应用通过的强大能力，将基础设施资源灵活定义并进行多集群分发。
3. 无论扩展的资源类型是什么，均可以接入应用体系，为最终用户提供一致的体验。


最后，如果你成功制作了属于自己的插件，KubeVela 社区非常欢迎开发者贡献插件至 [插件中心](https://github.com/kubevela/catalog) ，这样你的插件还能够被其他 KubeVela 社区用户发现并使用！
