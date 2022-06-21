---
title: 自定义插件
---

一个 KubeVela 的插件就是包含了一系列文件的目录。 下图展示了在启用一个插件时，KubeVela 做了哪些事情, 主要包含以下三个步骤。

* 当通过 UX/CLI 启用一个插件时，会从插件仓库把这些资源文件拉取下来。

* 文件当中用于扩展平台能力的文件如各种模块定义文件（componentDefinition，traitDefinition 等）和 schema 文件（在 UX 上增强显示效果的文件）会被 UX/CLI 直接下发到管控集群。 资源描述（ resources, template 和 metadata ）文件会被用来渲染成一个 KubeVela 应用并创建，最终由运行在管控集群的 KubeVela 下发到各个集群当中。

* 接下来运行在管控集群的 KubeVela 控制器根据需要在管控平面或者子集群中下发资源。

![alt](../../resources/addon-mechanism.jpg)

## 制作插件 (Make an Addon)

接下来将介绍如何制作一个自己的插件。

你需要先创建一个包含一些插件基本文件的目录。 社区正在支持一个 CLI 的[功能](https://github.com/kubevela/kubevela/pull/4162) 帮助你快速创建一个插件目录框架，该特性将在 1.5 推出。

```shell
├── resources/
│   ├── xxx.cue
│   ├── xxx.yaml
│   └── parameter.cue
├── definitions/
├── schemas/
├── README.md
├── metadata.yaml
└── template.yaml
```

需要注意的是，上面的文件并不都是必须的。接下来将介绍该目录下的每个资源文件和子目录的详细作用。

### 元数据 (metadata.yaml) 文件 (必须)

首先你需要编写一个插件的元数据文件 (metadata.yaml) ，该文件描述了插件的名称、版本、描述等基本描述信息。只有包含这个文件，一个仓库下的目录才会被 UX/CLI 识别为一个插件的资源目录, 一个元数据文件的例子如下所示。

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

dependencies:
- name: addon_name

system:
  vela: ">=v1.4.0"
  kubernetes: ">=1.19.0-0"

needNamespace:
  - flux-system

invisible: false
```

所有的字段及其作用如下：

| Field | Required  | Type | Usage  |
|:----:|:---:|:--:|:------:|
| name    |  yes | string | 名称  |
| version    | yes  | string | 版本，每次变更递增且符合 [SemVer](https://semver.org/) 规范  |
| description     | yes  | string | 描述  |
| icon     | no  | string |  图标，图标将在 VelaUX 的插件页面展示  |
| url     | no  | string |  插件所包含项目的官网地址   |
| tags     | no  | []string | 标签 |
| deployTo.runtimeCluster     | no  | bool |  插件是否可以安装到子集群，默认不设置该字段插件不会安装在任何子集群中 |
| dependencies     | no  | []{ name: string } | 依赖的其他插件，安装是 KubeVela 会保证依赖插件均已安装 |
| system.vela     | no  | string | 环境中所要求的 KubeVela 的版本，如果不满足，安装将会被拒绝  |
| system.kubernetes     | no  | string | 环境中所要求的 Kubernetes 的版本 |
| needNamespace     | no  | []string | 安装之前需要创建的 namespace ， kubeVela 在插件安装开始之前会在所有集群上创建该 namespace   |
| invisible     | no  | bool | 是否不可见，当插件尚在未完成阶段，可以设置暂时不可被启用 |

### 自描述  (README.md) 文件 (必须)

插件的自描述文件用于描述插件的主要功能，并且该文件会在 UX 的插件详情页面呈现给用户。所以 README.md 需要包含以下基本信息：

* 插件是什么？
* 为什么要使用该插件？使用案例或场景
* 如何使用？ `End user` 能够快速理解如何使用该插件。最好能够提供一个端到端的例子。
* 安装了什么？ 插件中包含的各个 `definition` 以及相关的 CRD 和 controller。

[实验阶段的插件](https://github.com/kubevela/catalog/tree/master/experimental/addons)通常没有这些非常严格的规则，但对于一个想要进阶到 [认证仓库](https://github.com/kubevela/catalog/tree/master/addons) 的插件而言，README 至关重要。

### 应用模版 (template.yaml) 文件 (非必须)

事实上，通过上面的介绍，我们知道插件目录下面的所有文件最终会渲染成为一个 KubeVela 的 Application 应用，所以这里的模板就是用于组成这个应用的框架。你可以通过该文件描述这个应用的特定信息，比如你可以为应用打上特定的标签或注解，当然你也可以直接在该应用模版文件中添加组件和工作流步骤。
定义在其他目录中的资源在安装时，会自动被追加到这个应用的组件列表中。


```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  namespace: vela-system
spec:
# component definition of resource dir .
```

需要注意的是，即使你通过 `metadata.name` 字段设置了应用的名称，该设置也不会生效，在启用时应用会统一以 addon-{addonName} 的格式被命名。

#### 例子

* [VelaUX](https://github.com/kubevela/catalog/blob/master/addons/velaux/template.yaml)，这个例子中仅定义了应用的头信息。
* [OCM control plane](https://github.com/kubevela/catalog/blob/master/addons/ocm-hub-control-plane/template.yaml)，这个例子中则在 `template` 中定义了插件 所有组件。

### 组件资源 (resources) 目录 (非必须)

除了直接在模版文件中添加组件，你也可以在插件目录下创建一个 `resources` 目录，并在里面添加 YAML/CUE 类型的文件，这些文件最终会被渲染成组件并添加到应用当中。

#### CUE 格式的资源

如果你需要为应用添加一个需要在启用时根据参数动态渲染的组件，你就可以编写一个 CUE 格式的文件，如下所示。

```cue
output: {
	type: "webservice"
	properties: {
		image: "oamdev/vela-apiserver:v1.4.0"
	}
	traits:[{
		type: "service-account"
		properties: name: "serviceAccountName"
	}]
}
```

你如果了解 [模版定义](../oam/x-definition) 中 CUE 模版的写法的话，应该会对这种写法感到非常熟悉，它们之间的区别是模版定义的 `output` 是一个具体的 K8S 对象，而这里的 `output` 定义的其实是一个应用中的具体组件。

可以看到上面例子中的 `output` 中描述了一个 `webservice` 类型的组件。

这个组件被渲染出来之后的应用如下：

```yaml
kind: Application
... 
# application header in template
spec:
  components:
  - type: webservice
    properties:
    	image: "oamdev/vela-apiserver:v1.4.0"
    traits:
    - type: service-account
      properties:
        name: serviceAccountName
```

你也可以通过 [CUE 基础入门文档](../cue/basic) 了解 CUE 的具体语法。

#### 定义插件参数

当资源通过 CUE 的方式定义时，你可以在 `resources` 目录下，另外定义一个 `parameter.cue` 如下所示：

```cue
parameter: {
  serviceAccountName: string
}
```

再定一个使用这个参数的资源文件：

```cue
output: {
	type: "webservice"
	properties: {
		image: "oamdev/vela-apiserver:v1.4.0"
	}
	traits:[{
		type: "service-account"
		properties: name: parameter.serviceAccountName
	}]
}
```

这样在用户启用时，就可以通过输入参数来设置对应字段：

```shell
vela addon enable velaux serviceAccountName="my-account"
```

这样最终渲染出来的组件如下：

```yaml
kind: Application
... 
# application header in template
spec:
  components:
  - type: webservice
    properties:
    	image: "oamdev/vela-apiserver:v1.4.0"
    traits:
    - type: service-account
      properties:
        name: my-account
```

##### 使用 context 中的变量渲染组件

除了使用定义使用参数动态渲染组件外，你还可以使用定义在  `context` 中的变量来进行渲染。
例如你可以定义一个这样的 CUE 组件：

```cue
output: {
	type: "webservice"
	properties: {
		image: "oamdev/vela-apiserver:" + context.metadata.version
		....
    }
}
```

同时你的  `metadata.yaml` 为：

```yaml
...
name: velaux
version: 1.2.4
...
```

渲染的结果为：

```yaml
kind: Application
... 
# application header in template
spec:
  components:
  - type: webservice
    properties:
    	image: "oamdev/vela-apiserver:v1.2.4"
```

这个例子中，使用了插件的版本来填充镜像的 tag。一个例子是 [VelaUX](https://github.com/kubevela/catalog/blob/master/addons/velaux/resources/apiserver.cue) 插件。

插件渲染的机制是，在启用时 UX/CLI 会把 CUE 定义的资源文件、参数文件和 `metadata.yaml` 中定义的数据放在一个上下文中渲染，得到一系列组件追加到应用当中去。

#### YAML 格式的资源

YAML 类型的文件中应该包含的是一个 K8S 资源对象，在渲染时该对象会被做为 K8s-object 类型的组件直接添加到应用当中。 

如 [OCM](https://github.com/kubevela/catalog/tree/master/addons/ocm-cluster-manager/resources) 中插件的例子所示，所有 yaml 都会通过 KubeVela Application 中的 Component 形式，被部署到系统中。

### 模块定义文件 (definitions/) 目录 (非必须)

你可以在插件目录下面创建一个 definitions 文件目录，用于存放组件定义、运维特征定义和工作流节点定义等模版定义文件。需要注意的是，由于被管控集群中通常不会安装 KubeVela 控制器，所以在启用插件时这些文件仅会被下发到管控集群。

### 模版参数展示增强文件 (schema/) 目录 (非必须)

schemas 目录用于存放`X-Definitions` 所对应的 UI-schema 文件，用于在 UX 中展示 `X-Definitions` 所需要填写参数时增强显示效果。需要注意的是，和模块定义文件一样，这些文件仅会被下发到管控集群。

上面就完整介绍了如何制作一个插件，你可以在这个 [目录中](https://github.com/kubevela/catalog/tree/master/experimental/addons/example) 找到上面所介绍插件的完整例子。

除了将插件资源文件上传到自己的插件仓库中，你也可以通过提交 pull request 向 KubeVela [官方插件仓库](https://github.com/kubevela/catalog/tree/master/addons) 和 [试验阶段插件仓库](https://github.com/kubevela/catalog/tree/master/experimental/addons) 添加新的插件，pr 合并之后你的插件就可以被其他 KubeVela 用户发现并使用了。

## 本地安装（离线安装）

你可以通过本地安装的方式调试你的 addon，命令如下：

```
vela addon enable ./your-addon-dir/
```

## 已知局限 (Known Limits)

- 尚不支持仅在子集群中安装插件。 由于 KubeVela 需要在管控平面中渲染出所有类型的资源再将其下发到子集群当中，如果插件中包含了一些 [CRD](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/), 插件不在管控平面安装的话 Vela 的控制器会遇到无法找到 CRD 错误。

## 贡献 Addon

如果你根据本文档制作了新的插件，非常欢迎贡献到社区。
同时，如果你发现了某个插件的 bug，也欢迎帮助社区修复此 bug。