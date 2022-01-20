---
title: 插件扩展
---

下图展示了在启用一个插件时，KubeVela 做了哪些事情。可以看到插件仓库中所存放的其实是插件的资源文件，当通过 UX/CLI 启用一个插件时，它们会从插件仓库把这些资源文件拉取下来，渲染成一个 KubeVela 应用并创建。最终由运行在管控集群的 KubeVela 控制器完成对应用中所描述资源的下发。

![alt](../../resources/addon-mechanism.jpg)

## 制作插件 (Make an Addon)

接下来将介绍如何制作一个自己的插件。

首先你需要在插件仓库中，添加一个用于存放插件资源文件的目录。通常这个目录结构如下所示。

```shell
├── resources/
│   ├── xxx.cue
│   ├── xxx.yaml
│   └── parameter.cue
├── definitions/
├── schemas/
├── definitions/
├── schemas/
├── README.md
├── metadata.yaml
└── template.yaml
```

接下来将介绍该目录下的每个资源文件和子目录的详细作用。

### 元数据 (metadata.yaml) 文件 (必须)

首先你需要编写一个插件的元数据文件 (metadata.yaml) ，该文件描述了插件的名称、描述等基本描述信息。只有包含这个文件，一个仓库下的目录才会被 UX/CLI 识别为一个插件的资源目录, 一个元数据文件的例子如下所示。

```yaml
name: example
version: 1.0.0
description: Example adddon.
icon: xxx
url: xxx

tags:
  - only_example

deployTo:
  runtimeCluster: false

dependencies: []
- name: addon_name

invisible: false
```

该文件中除了 name，version，tag 等基础信息外。还包括以下能够控制插件行为的字段：

- `deployTo.runtimeCluster`: 表示插件是否安装到子集群当中，当该字段被设置为 `true`，应用中的资源会被下发到子集群当中。
- `dependencies`: 表示所依赖的其他插件，启用时 KubeVela 会自动启用它所依赖的插件。
- `invisible`: 表示在拉取插件列表时，是否展示该插件。当发现插件有某些致命性的bug时，你可以通过设置该字段为 `true` 暂时对用户隐藏该插件。

### 应用模版 (template.yaml) 文件 (必须)

接下来你还需要编写一个插件的应用模版文件 (template.yaml) ，因为通过上面的介绍，我们知道插件目录下面的所有文件最终会被渲染为一个 KubeVela 应用，那么你就可以通过该文件描述这个应用的基本信息，比如你可以为应用打上特定的标签或注解， 当然你也可以直接在该应用模版文件中添加组件和工作流步骤。
需要注意的是，即使你通过 `metadata.name` 字段设置了应用的名称，该设置也不会生效，在启用时应用会统一以 addon-{addonName} 的格式被命名。

### 自描述  (README.md) 文件 (必须)

插件的自描述文件用于描述插件的主要功能，并且该文件会在 UX 的插件详情页面呈现给用户。

### 组件资源 (resources) 目录 (非必须)

除了直接在模版文件中添加组件，你也可以在插件目录下创建一个 `resources` 目录，并在里面添加 YAML/CUE 类型的文件，这些文件最终会被渲染成组件并添加到应用当中。
其中，YAML 类型的文件中应该包含的是一个 K8S 资源对象，在渲染时该对象会被做为 K8s-object 类型的组件直接添加到应用当中。 

如果你需要为应用添加一个需要在启用时根据参数动态渲染的组件，你就可以编写一个 CUE 格式的文件，如下所示。

```cue
output: {
	type: "k8s-obeject"
	properties: {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: {
			name:      "exampleinput"
			namespace: "default"
		}
		data: input: parameter.example
	}
}
```

你还需要编写一个 `parameter.cue` 的文件描述有哪些启用参数，如下所示。

```cue
parameter: {
  example: string
}
```

你如果了解 [模版定义](../oam/x-definition) 中 CUE 模版的写法的话，应该会对这种写法感到非常熟悉，它们之间的区别是模版定义的 `output` 是一个具体的 K8S 对象，而这里的 `output` 定义的其实是一个应用中的具体组件。

可以看到上面例子中的 `output` 中描述了一个 `k8s-object` 类型的组件，其中 `properties.data.input` 需要在启用时根据输入参数指定。插件在启用时的参数都需要以 CUE 的语法编写在 `parameter.cue` 文件当中。 UX/CLI 在启用插件时会把全部的 CUE 文件和 `parameter.cue` 放在一个上下文中进行渲染，最终得到一系列的组件并添加到应用当中。

你也可以通过 [CUE 基础入门文档](../cue/basic) 了解 CUE 的具体语法。 

### 模块定义文件 (X-Definitions) 目录 (非必须)

你可以在插件目录下面创建一个 definitions 文件目录，用于存放组件定义、运维特征定义和工作流节点定义等模版定义文件。需要注意的是，由于被管控集群中通常不会安装 KubeVela 控制器，所以即使插件通过设置元数据文件 (metadata.yaml) 中 `deployTo.runtimeCluster` 字段开启在子集群安装该插件，模版定义的文件也并不会下发到子集群中。

### 模版参数展示增强文件 (UI-Schema) 目录 (非必须)

schemas 目录用于存放`X-Definitions` 所对应的 UI-schema 文件，用于在 UX 中展示 `X-Definitions` 所需要填写参数时增强显示效果。

上面就完整介绍了如何制作一个插件，你可以在这个 [目录中](https://github.com/oam-dev/catalog/tree/master/experimental/addons/example) 找到上面所介绍插件的完整例子。

除了将插件资源文件上传到自己的插件仓库中，你也可以通过提交 pull request 向 KubeVela [官方插件仓库](https://github.com/oam-dev/catalog/tree/master/addons) 和 [试验阶段插件仓库](https://github.com/oam-dev/catalog/tree/master/experimental/addons) 添加新的插件，pr 合并之后你的插件就可以被其他 KubeVela 用户发现并使用了。

## 已知局限 (Known Limits)

- 现在如果选择在集群中启用插件，KubeVela 会默认在所有子集群中安装，并且启用插件时所填的参数，会在所有集群中生效，之后计划完善多集群插件管理体系，包括支持集群差异化配置等特性。

- 尚缺少插件的版本管理，升降级等机制，之后计划完善这些特性。

- 尚缺少方便的本地插件调试手段，后续计划在 CLI 侧提供完善的插件本地调试的功能。

- 尚不支持仅在子集群中安装插件。 如果不在控制平面安装插件，仅安装在子集群中，会遇到诸多已知问题。