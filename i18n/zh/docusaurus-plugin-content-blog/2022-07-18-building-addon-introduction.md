---
title: "KubeVela 插件介绍与编写入门"
authors:
- name: 姜洪烨
  title: KubeVela Team
  url: https://github.com/charlie0129
  image_url: https://github.com/charlie0129.png
tags: [ "KubeVela", "addon", "extensibility" ]
description: Introduction to Building Addons
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

KubeVela 插件（addon）可以方便地扩展 KubeVela 的能力。正如我们所知，KubeVela 是一个高度可扩展的平台，用户可以通过 [模块定义（Definition）](https://kubevela.net/zh/docs/platform-engineers/oam/x-definition)扩展 KubeVela 的能力，而 KubeVela 插件正是方便将这些**自定义扩展**及其**依赖**打包并分发的功能。

这篇博客将会简要介绍 KubeVeka 插件的机制和如何自行编写插件。

<!--truncate-->

## 为什么要使用 KubeVela 插件

用户使用插件的一个典型方法是通过 KubeVela 团队维护的 [addon catalog](https://github.com/kubevela/catalog) ，它包含了 KubeVela 团队与社区开发者精心编写的扩展，并以插件的形式发布于 catalog 中，这样你可以一键下载并安装这些插件。例如安装 FluxCD 可以快速给你的 KubeVela Application 提供部署 HelmComponent 等 FluxCD 提供的能力。

以上述的 FluxCD 为例，相较于一键安装，如果不使用插件就必须这么安装（实际上，这也是 KubeVela v1.1 及之前的安装方法）：

1. 通过 Helm 或者下载 yaml 文件手动安装 FluxCD （包括数个 Controller 和 CRD）
2. 下载 FluxCD 相关的模块定义文件并安装

我们不难发现这样安装有以下这些问题：

1. 操作繁琐：用户需要手动查阅文档如何安装 FluxCD 并处理可能发生的错误
2. 资源分散：用户需要从所处下载不同的文件，既需要安装 Helm 安装 FluxCD 还需要下载模块定义
3. 难以分发：用户需要手动下载模块定义就注定了这些资源难以以一个统一的方式分发给用户
4. 缺少多集群支持：KubeVela 注重多集群交付，而这样的手动安装方式显然是难以维护多集群的环境的

而 KubeVela 插件就是为了逐一解决这些问题而生。

## KubeVela 插件是如何工作的

**KubeVela 插件本质上就是一个 OAM Application** 加上模块定义和其他能力扩展。因为一个模块定义一般需要依赖其他资源（例如需要一个 Operator ），这些依赖的资源将存放在 *应用描述文件* 中，通过 OAM Application 进行描述。例如一个 Redis 插件，它能让用户在自己的 Application 中使用 Redis 集群类型的 Component ，这样可以快速创建 Redis 集群。那么这个插件至少会包括一个 Redis Operator 来提供创建 Redis 集群的能力（通过 Application 描述），还有一个组件定义 （ComponentDefinition） 来提供 Redis 集群类型的 Component。

安装插件工作流程可见下图，即下发插件中定义的 Application 、组件定义和 UI 扩展等：

![](../../../docs/resources/addon-mechanism.jpg)

## 创建自己的插件

> 注意：以下内容适用于 KubeVela v1.5 及更新的版本

我们将以 Redis 插件为例，讲解如何从头创建一个 KubeVela 插件的实际过程。本次完整的 Redis 插件代码见 [catalog/redis-operator](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator)，在这里我们会避免讨论过深的细节，文档可以参考[自定义插件](https://kubevela.net/zh/docs/platform-engineers/addon/intro)。

**首先我们需要思考我们要创建的插件有什么作用？** 例如我们假设 Redis 插件可以提供 `redis-failover` 类型的 Component，这样用户只需在 Application 中定义一个 `redis-failover` Component 即可快速创建 Redis 集群。**然后考虑如何达到这个目的？** 要提供 `redis-failover` 类型的 Component 我们需要定义一个 ComponentDefinition ；要提供创建 Redis 集群的能力支持，我们可以使用 [Redis Operator](https://github.com/spotahome/redis-operator) 。

那至此我们的大目标就明确了：

- 编写插件的应用描述文件（OAM Application），其中包含了一个 Redis Operator （见完整代码的 template.cue 及 resources 目录）
- 编写 `redis-failover` 类型的 ComponentDefinition （见完整代码的 definitions 目录）

不过在开始编写之前，我们首先需要了解一个 KubeVela 插件的目录结构。后续我们会在编写的过程中详细说明每个文件的作用，在这里只需大致了解有哪些文件即可。同时，在插件中我们会大量使用 CUE ，你可能需要先查阅[入门指南](https://kubevela.net/zh/docs/platform-engineers/cue/basic)。

```shell
redis-operator/            # 目录名为插件名称
├── definitions            # 用于存放模块定义, 例如 TraitDefinition 和 ComponentDefinition
│   └── redis-failover.cue # 需要编写的 redis-failover 类型的 ComponentDefinition
├── resources              # 用于存放资源文件, 之后会在 template.cue 中使用他们
│   ├── crd.yaml           # Redis Operator 的 CRD （yaml 类型的文件将会被直接 apply）
│   ├── redis-operator.cue # 一个 web-service 类型的 Component ，用于安装 Redis Operator
│   └── topology.cue       # （可选）帮助 KubeVela 建立应用所纳管资源的拓扑关系
├── metadata.yaml          # 插件元数据，包含插件名称、版本等
├── parameter.cue          # 插件参数定义，用户可以利用这些参数自定义插件安装
├── README.md              # 提供给用户阅读，包含插件使用指南等
└── template.cue           # 应用描述文件，包含一个 OAM Application
```

### parameter.cue

```cue
parameter: {
	//+usage=Redis Operator image.
	image: *"quay.io/spotahome/redis-operator:v1.1.0" | string
	// 其余省略
}
```

在 parameter.cue 中定义的参数都是用户可以自定义的（类似于 Helm Values），后续在 template.cue 或者 resources 中可以通过 `parameter.<parameter-name>` 访问参数。在我们的例子中，用户可以自定义 `image` ，这样后续我们创建 Redis Operator 的时候可以使用用户指定的容器镜像。

在设计提供什么参数供用户自定义时也有一些注意点：

- 不要在 parameter.cue 中提供大量的细节参数，将大量细节抽象出少量参数供用户调节是一个更好的做法
- 为参数提供默认值（如样例中的 image 参数）或将参数标记为可选（如样例的 clusters 参数），确保用户仅使用默认值可以得到一个可用的配置
- 为参数提供使用说明（通过注释标记实现，见样例）
- 尽量保持插件不同版本间的参数一致，防止因为升级导致不兼容

### template.cue 和 resources 目录

这是存放我们应用描述文件的地方，即一个 OAM Application ，我们主要会在这里包含 Redis Operator ，给集群提供管理 Redis 集群的能力。

template.cue 和 resource 目录本质上是相同的，他们共同组成一个 Application 。那为什么需要 resources 目录呢？除去历史原因，这主要是为了可读性的考虑，在 Application 中包含大量资源的时候 template.cue 可能变得很长，这时我们可以把资源放置在 resource 中增加可读性。一般来说，我们将 Application 的框架放在 template.cue 中，将 Application 内部的 Components 放在 resource 目录中。


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
// 定义资源关联规则，后续详细介绍
outputs: topology: resourceTopology // 定义于 resources/topology.cue 中
```

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

```cue
// resources/topology.cue

package main

import "encoding/json"

// 资源关联规则不是必须的，但是它能帮助 KubeVela 建立应用所纳管资源的拓扑关系。
// 在本例中，由于我们即将创建的 `redis-failover` 类型的 ComponentDefinition 会创建
// 一个 RedisFailover 类型的 CustomResource ，而这个 RedisFailover 类型的 CustomResource 
// 又会包括一系列资源，资源关联规则就可以帮助 KubeVela 了解他们之间的关系，在 VelaUX 显示拓扑图等。
// https://kubevela.net/zh/docs/reference/topology-rule

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
### definitions 目录

Definitions 目录存放 KubeVela 模块定义（Definition），包括组件定义（ComponentDefinition）、策略定义（TraitDefinition）等。

编写 ComponentDefinition 的过程主要参照 KubeVela 文档 [自定义组件](https://kubevela.net/zh/docs/platform-engineers/components/custom-component) 与 [Redis Operator 使用文档](https://github.com/spotahome/redis-operator/blob/master/README.md) ，这与传统编写 ComponentDefinition 的方式并无差异。

我们要编写的是一个 ComponentDefinition ，名为 `redis-failover`，它会创建一个 RedisFailover 的 CR ，这样刚刚添加的 Redis Operator 就可以帮助创建 Redis 集群，见[完整代码](https://github.com/kubevela/catalog/blob/master/experimental/addons/redis-operator/definitions/redis-failover.cue)。

### metadata.yaml

这里包含了插件的元数据，即插件的名称、版本、系统要求等，可以参考[文档](https://kubevela.net/zh/docs/platform-engineers/addon/intro#%E6%8F%92%E4%BB%B6%E7%9A%84%E5%9F%BA%E6%9C%AC%E4%BF%A1%E6%81%AF%E6%96%87%E4%BB%B6)。需要注意的是，本次介绍的为 KubeVela v1.5 之后的新写法，因此需要避免使用某些不兼容的元数据字段，以下样例中包含了所有的可用元数据。

> 例如传统的 `deployTo.runtimeCluster` （安装至子集群）等元数据在新写法中已有代替，在我们的样例中使用 topology Policy 达到相同目的，可见完整代码中的 template.cue

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

## 运行自定义插件

至此我们已经将插件的主要部分编写完成，下载 [完整代码](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator) 补全部分细节后，即可尝试运行。

下载得到 redis-operator 目录后，我们可以通过 `vela addon enable redis-operator` 安装本地插件。安装完成后就可以参考插件的 [README](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator) 试用我们的 Redis 插件了！

> 这里也体现出插件的 README 的重要性，其中需要包括插件的作用、详细使用指南等，确保用户可以快速上手
