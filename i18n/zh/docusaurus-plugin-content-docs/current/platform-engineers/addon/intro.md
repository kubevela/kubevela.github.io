---
title: 自定义插件
---

一个 KubeVela 插件就是一个主要包含了以下三类文件的集合:
* 插件的`基本信息文件`，这类文件是制作一个插件所必须具备的文件。包括元数据文件（metadata.yaml）和 自描述文件（README.md）。
* 定义 KubeVela 可扩展点的`扩展配置文件`，这些文件是非必须的。例如[模版定义文件](../../getting-started/definition) (X-definitions), [UI 扩展](../../reference/ui-schema)，[资源拓扑规则](../../reference/topology-rule)等。
* 定义 Kubernetes 资源对象的`资源描述文件`，同样这些文件也是非必须的。他们可以是一个支撑某个模版定义文件背后的 kubernetes operator，或是其他的 Kubernetes 应用。
后面的章节会分别介绍这三类文件的作用和编写规则。

下图展示了在启用一个插件时，KubeVela 做了哪些事情, 主要包含以下三个步骤。
* 当通过 UX/CLI 启用一个插件时，会从插件仓库把插件中的源文件拉取下来。
* 文件中`扩展配置`文件会被 UX/CLI 直接下发到管控集群。 资源描述（ [template](#应用模版-templateyaml-或-templatecue-文件)）, [metadata](#元数据metadatayaml-文件) 和 [resources/](#资源目录-resources) 目录下的文件 ）文件会被用来渲染成一个 KubeVela 应用并创建。
* 接下来运行在管控集群的 KubeVela 控制器完全按照应用（Application）的执行流程交付资源，与 KubeVela 其他的应用执行没有差别。

![alt](../../resources/addon-mechanism.jpg)

# 制作插件 (Make an Addon)

接下来将介绍如何制作一个自己的插件。

通常，一个插件目录结构如下所示：

```shell
├── resources/
│   ├── xxx.cue
│   └── xxx.yaml
├── definitions/
├── schemas/
├── README.md
├── metadata.yaml
├── parameter.cue
└── template.yaml(or template.cue)
```

你也可以使用命令 `vela addon init`（vela CLI v1.5 或更新）帮你快速创建这个目录框架，你可以查阅 `vela addon init -h`来获取详细信息。这里我们使用最简单的 `vela addon init your-addon-name` 就足够了。

需要注意的是，上面的文件并不都是必须的。接下来将介绍该目录下的每个文件和子目录的详细作用。

## 插件的基本信息文件 （必须）

### 元数据 (metadata.yaml) 文件 

首先你需要编写一个插件的元数据文件 (metadata.yaml) ，该文件描述了插件的名称、版本、描述等基本描述信息。只有包含这个文件，一个目录才会被 UX/CLI 识别为一个插件的资源目录, 一个元数据文件的例子如下所示：

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
| dependencies     | no  | []{ name: string } | 依赖的其他插件，安装是 KubeVela 会保证依赖插件均已安装 |
| system.vela     | no  | string | 环境中所要求的 KubeVela 的版本，如果不满足，安装将会被拒绝  |
| system.kubernetes     | no  | string | 环境中所要求的 Kubernetes 的版本 |
| deployTo.runtimeCluster     | no  | bool |  插件是否可以安装到子集群，默认不设置该字段插件不会安装在任何子集群中 |

### 自描述  (README.md) 文件 

插件的自描述文件用于描述插件的主要功能，并且该文件会在 UX 的插件详情页面呈现给用户。所以 README.md 需要包含以下基本信息：

* 插件是什么？
* 为什么要使用该插件？使用案例或场景
* 如何使用？ `End user` 能够快速理解如何使用该插件。最好能够提供一个端到端的例子。
* 安装了什么？ 插件中包含的 `X-definition` 以及相关的 CRD 和 controller。

[实验阶段的插件](https://github.com/kubevela/catalog/tree/master/experimental/addons) 通常没有这些非常严格的规则，但对于一个想要进阶到 [认证仓库](https://github.com/kubevela/catalog/tree/master/addons) 的插件而言，README 至关重要。

## KubeVela 的扩展配置文件 （可缺省）

### 模版定义文件 (definitions/) 目录

`definitions` 文件目录用于存放模版定义文件（`X-Definitions`）, 这些文件可以是一个 YAML 类型的 ComponentDefinition，traitDefinitions 或 workflowStepDefinitions Kubernetes CR。也可以是 CUE 格式的 KubeVela [def](../../getting-started/definition) 文件，这类文件在启用时会被渲染成对应的 X-definitions CR 再下发到集群。

> 需要注意的是，这些 X-definitions 只会被下发到管控集群。

### 模版参数展示增强文件 (schema/) 目录

`schemas/` 目录用于存放 `X-Definitions` 所对应的 [UI-schema](../../reference/ui-schema) 文件，用于在 UX 中展示 `X-Definitions`所需要填写参数时增强显示效果。需要注意的是，和模块定义文件一样，这些文件仅会被下发到管控集群。

## 资源描述文件（可缺省）

通过上面的介绍，我们知道插件中很重要的一部分就是通过`资源描述文件`定义需要安装的 Kubernetes 资源对象。你可以在应用模版文件和 `resources/` 目录下的文件中定义这些资源。而这些资源描述文件会最终被渲染成一个 KubeVela 的 `应用`（application），由 KubeVela 控制器下发至集群。

需要注意的是，应用模版文件和资源目录下面的资源描述文件，都可以通过 CUE 或 YAML 格式定义，本文档会只介绍最简单的通过 YAML 描述资源的方法，[下一篇文档](./addon-cue) 会详细介绍如何如果通过 CUE 定义资源描述文件。

### 应用模版 (template.yaml 或 template.cue) 文件

应用模板文件就是用来定义这个`应用` （application） 的基础框架。你可以通过该文件描述这个`应用`的特定信息，比如你可以为`应用`打上特定的标签或注解，当然你也可以直接在该应用模版文件中添加组件，策略和设置工作流。 应用模版定义文件可以是 YAML 类型的文件（template.yaml）或 CUE 类型文件 （template.cue）。

> 请注意，你只能选择 template.yaml 或 template.cue 其中之一，同时包含两个文件的插件，启用时会报错。

#### template.yaml

一个 YAML 格式的应用模版文件 （`template.yaml`） 文件就是定义一个 KubeVela 的 application，下面就是一个 `template.yaml` 例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: velaux
  namespace: vela-system
spec:
  components:
    - name: namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: my-namespace
```

在这个例子中，我们所定义的应用基础框架中包含了一个` k8s-objects` 类型的组件，组件中是一个 `namespace` 资源，插件启用之后这个 namespace 就会被 KubeVela 在集群中下发。

> 需要注意的是，即使你通过 `metadata.name` 字段设置了应用的名称，该设置也不会生效，在启用时应用会统一以 addon-{addonName} 的格式被命名。

### 资源目录 (resources)

虽然你可以在应用模版文件中定义全部的资源，但这可能会导致单个文件过于庞大，所以你也可以选择在 `resources/` 目录下编写单独的文件定义资源。该目录下面的文件格式也可以是 YAML 或 CUE 格式的文件，同样为了简单，本文档会直接介绍 YAML 方式的定义方法。[下篇文档](./addon-cue) 将会详细介绍 CUE 的定义方式。

`resources` 目录下的 YAML 资源描述文件中所定义的必须是一些个 kubernetes 对象，这些对象在渲染时会被追加到应用的组件列表中，被 KubeVela 下发至集群。下面就是一个例子：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
secrets:
  - name: my-secret
```

这个 YAML 中我们定义了一个 service account，结合上面的 `template.yaml` 经过渲染之后最终的应用为：

```yaml
kind: Application
metadata:
  name: example
  namespace: vela-system
spec:
  components:
    - name: namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: my-namespace
    - name: example-resources
      type: k8s-objects
      components:
        objects:
          - apiVersion: v1
            kind: ServiceAccount
            metadata:
              name: my-service-account
              namespace: default
              secrets:
                - name: my-secret
```

上面通过一个最简单的例子，讲述了如何通过简单的 YAML 定义资源描述文件。但如果你想要插件具备以下功能的话，可以通过 CUE 的方式来定义资源描述文件。

* 资源可以在启用插件时通过启动参数动态渲染结果。
* 插件中某些特殊的资源并不想作为应用的一部分在多集群范围内下发，而只想仅在管控中被创建。
* 插件中可能包含多个 X-definitions 和背后支撑这些能力的 operator，他们能够根据参数被动态的被启用。

[CUE 定义资源描述文件](./addon-cue) 会详细介绍通过 CUE 定义资源的方法。

#### 例子

* [OCM control plane](https://github.com/kubevela/catalog/blob/master/addons/ocm-hub-control-plane/template.yaml) 插件的 应用模版定义文件和 `resources/` 目录下的资源描述文件就是全部通过 YAML 的方式来定义的。

# 本地安装（离线安装）

你可以通过本地安装的方式调试你的 addon，命令如下：

```
$ vela addon enable ./your-addon-dir/
```

# 已知局限 (Known Limits)

- 尚不支持仅在子集群中安装插件。 由于 KubeVela 需要在管控平面中渲染出所有类型的资源再将其下发到子集群当中，如果插件中包含了一些 [CRD](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/), 插件不在管控平面安装的话 Vela 的控制器会遇到无法找到 CRD 错误。

# 贡献 Addon

除了将插件资源文件上传到自己的插件仓库中，你也可以通过提交 pull request 向 KubeVela [官方插件仓库](https://github.com/kubevela/catalog/tree/master/addons) 和 [试验阶段插件仓库](https://github.com/kubevela/catalog/tree/master/experimental/addons) 添加新的插件，pr 合并之后你的插件就可以被其他 KubeVela 用户发现并使用了。

如果你根据本文档制作了新的插件，非常欢迎贡献到社区。 同时，如果你发现了某个插件的 bug，也欢迎帮助社区修复此 bug。