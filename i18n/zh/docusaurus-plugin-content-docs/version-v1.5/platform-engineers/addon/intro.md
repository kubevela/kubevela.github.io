---
title: 自定义插件
---

一个 KubeVela 插件就是一个可以包含了以下两类文件的集合:
* 定义 Kubernetes 资源对象的`资源描述文件`。他们可以是一个支撑某个模版定义文件背后的 kubernetes operator，或者是一个 webserver 等。
* 定义 KubeVela 可扩展点的`扩展配置文件`。例如[模版定义文件](../../getting-started/definition) (X-definitions), [UI 扩展](../../reference/ui-schema)，[资源拓扑规则](../../reference/topology-rule)等。

下图展示了在启用一个插件时，KubeVela 做了哪些事情, 主要包含以下三个步骤。
* 当通过 UX/CLI 启用一个插件时，会从插件仓库把插件中的源文件拉取下来。
* 文件中`扩展配置`文件会被 UX/CLI 直接下发到管控集群。 资源描述（ resources, template 和 metadata ）文件会被用来渲染成一个 KubeVela 应用并创建。
* 接下来运行在管控集群的 KubeVela 控制器根据需要在管控平面或者子集群中下发 kubernetes 资源。

![alt](../../resources/addon-mechanism.jpg)

## 制作插件 (Make an Addon)

接下来将介绍如何制作一个自己的插件。

你需要先创建一个包含一些插件基本文件的目录。不想手动创建？ `vela addon init`（vela CLI v1.5 或更新）可以帮你快速创建目录框架，你可以查阅 `vela addon init -h`来获取详细信息。对于快速开始，这里我们使用 `vela addon init your-addon-name` 就足够了。

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

需要注意的是，上面的文件并不都是必须的。接下来将介绍该目录下的每个文件和子目录的详细作用。

### 元数据 (metadata.yaml) 文件 (必须)

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

### 自描述  (README.md) 文件 (必须)

插件的自描述文件用于描述插件的主要功能，并且该文件会在 UX 的插件详情页面呈现给用户。所以 README.md 需要包含以下基本信息：

* 插件是什么？
* 为什么要使用该插件？使用案例或场景
* 如何使用？ `End user` 能够快速理解如何使用该插件。最好能够提供一个端到端的例子。
* 安装了什么？ 插件中包含的各个 `definition` 以及相关的 CRD 和 controller。

[实验阶段的插件](https://github.com/kubevela/catalog/tree/master/experimental/addons) 通常没有这些非常严格的规则，但对于一个想要进阶到 [认证仓库](https://github.com/kubevela/catalog/tree/master/addons) 的插件而言，README 至关重要。

### 应用模版 (template.yaml 或 template.cue) 文件 (非必须)

通过上面的介绍，我们知道插件中很重要的一部分就是通过`资源描述文件`定义需要安装的 kubernetes 资源对象。你可以在应用模版文件 (template.yaml 或 template.cue) 和 `resources/` 目录下的文件中定义这些资源。而这些资源描述文件会最终被渲染成一个 KubeVela 的 `应用`，由 KubeVela 控制器下发到各个集群。 所以这里的应用模板文件就是用来定义这个`应用`的基础框架。你可以通过该文件描述这个`应用`的特定信息，比如你可以为`应用`打上特定的标签或注解，当然你也可以直接在该应用模版文件中添加组件，策略和设置工作流。 应用模版定义文件可以是 YAML 类型的文件（template.yaml）或 CUE 类型文件 （template.cue）。

选择其中的哪个取决于你是否期望在启用插件时，通过启用参数动态变更应用当中的内容。

> 请注意，你只能选择 template.yaml 或 template.cue 其中之一，同时包含两个文件的插件，启用时会报错。

#### template.yaml

如果你不希望在启用时动态的变更资源的某些字段，`template.yaml` 就是足够的了。下面就是一个例子：

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

在这个例子中，我们定义一个应用的基础框架，这个应用中包含了一个` k8s-objects` 类型的组件，组件中是一个 `namespace` 资源，插件启用之后这个 namespace 就会被 KubeVela 在集群中下发。

#### template.cue

如果你期望让用户在启用插件时，通过设置启用参数来决定应用的部分字段，你就需要编写一个 `template.cue` 文件来实现。 我们可以这样定义 `template.cue` 文件，去允许用户指定上面例子中被创建 namespace 的名字：

```cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
	spec: {
		components: [
			{
				type: "k8s-objects"
				name: "example-namespace"
				properties: objects: [{
					apiVersion: "v1"
					kind:       "Namespace"
					metadata: name: parameter.namespace
				}]
			},
		]
	}}
```

可以看到，这个例子中的需要创建的 `namespace` 资源的名称是通过输入参数来确定的。 如果你希望这个 `namespace` 的名称是 `my-namespace`, 你可以这样启用这个插件：

```shell
$ vela addon enable <addon-name> namespace=my-namespace
```

经过渲染之后，会得到如下的应用：

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
```

> 需要注意的是，即使你通过 `metadata.name` 字段设置了应用的名称，该设置也不会生效，在启用时应用会统一以 addon-{addonName} 的格式被命名。

虽然你可以在应用模版文件中定义应用的全部内容，但这可能会导致整个模版文件变得非常的庞大，所以你可以选择将一部分关于资源描述的内容拆分到 `resources` 目录下面，后面的章节将会详细介绍 `resources` 目录中的资源描述文件如何定义。

##### 部署附属资源

在 CUE 类型的应用模版 (`template.cue`) 文件中，除了在 `output` 代码块中定义`应用`外，还可以定义其他需要仅在管控集群部署的 `附属资源`。定义的方法是把需要部署的 Kubernetes 资源对象放到 `outputs` 中，并且这些资源只会被下发到管控集群。例如：

```cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
	spec: {
		
	}
	... 
}

outputs: resourceTree: {
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: {
		name:      "resource-tree"
		namespace: "vela-system"
		labels: {
			"rules.oam.dev/resources":       "true"
			"rules.oam.dev/resource-format": "json"
		}
	}
	data: rules: json.Marshal(_rules)
}

_rules: {...}
```

这个例子中我们定义了一个 `resourceTree` 的 configmap ，这个 configmap 其实是一个[拓扑树资源关系规则](../../reference/topology-rule)，这个 configmap 只需要在管控集群中部署。

##### 如何定义 `template.cue` 实现根据参数选择安装集群

如果你希望插件中的资源能够不止被安装在管控集群，同时也能够安装在各个其他的子集群中， 并且具体安装在哪些集群需要由用户在启用插件时设置 `clusters` 启动参数来指定。 你就可以在 `template.cue` 中添加一个 topology 策略来实现，如下所示：

```cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
	spec: {
		components:{...}
		policies: [{
			type: "topology"
			name: "deploy-topology"
			properties: {
				if parameter.clusters != _|_ {
					clusters: parameter.clusters
				}
				if parameter.clusters == _|_ {
					clusterLabelSelector: {}
				}
			}
		}]
	}
}
	
outputs: {
	...
}	
```

在这个例子中，我们在应用的策略列表中定一个了 [topology 策略](../../end-user/policies/references)。如果你执行下面的命令，应用中的资源将会被部署在 `local` 集群和 `cluster1` 集群：

```shell
$ vela addon enable <addon-name> clusters=local,cluser1
```

经过渲染，最终创建的应用为：

```yaml
kind: Application
metadata:
  name: example
  namespace: vela-system
spec:
  components: 
#  ...
#  defined in components
#  ...
  policies:
    - type: "topology"
      name: "deploy-topology"
      properties:
        clusters:
          - local
          - cluster1
```

因为应用如果设置一个空 `clusterLabelSelector` topology 策略，会默认在所有集群创建应用中所定义的资源，所以如果你需要在所有集群中启用插件的话，你可以执行下面的命令：

```shell
$ vela addon enable <addon-name>
```

渲染出来的应用结果为：

```yaml
kind: Application
metadata:
  name: example
  namespace: vela-system
spec:
  components: ...
  policies:
    - type: "topology"
      name: "deploy-topology"
      properties:
        clusterLabelSelector: { }
```

#### 例子

这里是一些已经制作完成的插件的例子：

* [OCM control plane](https://github.com/kubevela/catalog/blob/master/addons/ocm-hub-control-plane/template.yaml) 在这个例子中使用的是 YAML 模版文件，应用应用中的资源只需要在管控集群中创建，且不需要在启用时更改字段。
* [ingress-nginx](https://github.com/kubevela/catalog/tree/master/addons/ingress-nginx/template.cue) 这个例子中使用 CUE 模版定义文件。

### parameter.cue （非必须）

在上面的例子中，我们使用了通过 `parameter.namespace` 启动参数设置 `namespace` 的名称，和 `parameter.clusters` 设置插件的安装集群。 为了让用户在在启用是能够使用这些参数，我们还需要一个参数定义文件（`parameter.cue`）来定义插件有哪些启动参数。 例如：

```cue
parameter: {		
  //+usage=clsuters install to
  clsuters: [...string]
  //+usage=namespace to create
  namespace: string
}
```

### 资源 (resources) 目录 (非必须)

你也可以 `resouces` 目录中添加 YAML/CUE 格式的资源描述文件，这些文件会被用来渲染最终的应用。

#### YAML 资源描述文件

放在 `resources` 目录下的资源描述文件中所定义的必须是一些个 kubernetes 对象，这些对象在渲染时会被添加到应用的组件列表中，被 KubeVela 在集群间下发。下面就是一个 YAML 的例子：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
secrets:
  - name: my-secret
```

这个 YAML 中我们定义了一个 service account，经过渲染之后应用为：

```yaml
kind: Application
metadata:
  name: example
  namespace: vela-system
spec:
  components:
    - #   ...
      #   other contents defined in template file
    #   ...
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

一个现有的插件的例子就是 [OCM](https://github.com/kubevela/catalog/tree/master/addons/ocm-hub-control-plane) 插件， 这个插件中所有的 `resources` 目录下面的资源描述文件均是通过 YAML 的方式去定义的。

#### CUE 资源描述文件

跟 YAML 的资源描述文件中是 Kubernetes 资源对象不同，CUE 资源描述文件的作用定义可以被 `template.cue` 引用的 CUE 代码块。

继续使用在介绍 `template.cue` 的例子，我们把定义 `namesapce` 组件和 `topology` 策略的代码块拆分到 `resources` 目录下，目录结构如下：

```shell
├── resources/
│   ├── namespace.cue
│   └── topology.cue
├── README.md
├── metadata.yaml
├── parameter.cue
└── template.cue
```

`topology.cue` 和 `namesapce.cue` 文件的内容分别如下所示：

```cue
// resources/topology.cue
package main

topology: {
	type: "topology"
	name: "deploy-topology"
	properties: {
		if parameter.clusters != _|_ {
			clusters: parameter.clusters
		}
		if parameter.clusters == _|_ {
			clusterLabelSelector: {}
		}
	}
}
```

```cue
// resources/namespace.cue
package main

namespace: {
	type: "k8s-objects"
	name: "example-namespace"
	properties: objects: [{
		apiVersion: "v1"
		kind:       "Namespace"
		metadata: name: parameter.namespace
	}]
}
```

可以看到我们在这两个文件中分别定义了一个 `topology` 的策略和 `namespace` 的组件代码块，接下来我们就可以在 `template.cue` 中引用这两个代码块：

```cue
// template.cue

package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
	spec: {
		// reference namespace block from resources/naemspace.cue
		components: [namespace]
		// reference topology block from resources/topology.cue
		policies: [topology]
	}
}
```

通过下面的命令，设置 `namespace` 和 `clusters` 参数启用插件后，渲染出来的应用如下所示：

```shell
$ vela addon enable <addon-name> namespace=my-namespace clusters=local,cluster1
```

```yaml
apiVersion: core.oam.dev/v1beta1
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
  policies:
    - type: "topology"
      name: "deploy-topology"
      properties:
        clusters:
          - local
          - cluster1
```

##### 使用 context 中的变量渲染组件

除了通过启动参数动态渲染应用外，你还可以读取 `metadata.yaml` 中定义的字段来做渲染。 例如你可以如下定义一个 `templatec.cue` 文件：

```cue
output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
	spec: {
		components: [
			{
				type: "webservice"
				properties: {
					image: "oamdev/vela-apiserver:" + context.metadata.version
				}
			},
		]
	}
}

```

在渲染时 `metadata.yaml` 中定义的各个字段，会被塞进 `context` CUE 的代码块中，连同其他 CUE 文件一并渲染，假如你的 `metadata.yaml` 为：

```yaml
...
name: velaux
version: 1.2.4
...
```

渲染的结果为：

```yaml
apiVersion: core.oam.dev/v1beta1
kind:       Application
metadata:
  name: example
  namespace: "vela-system"
spec:
  components:
    - type: webservice
      properties:
        image: "oamdev/vela-apiserver:v1.2.4"
```

这个例子中，使用了插件的版本来填充镜像的 tag。一个例子是 [VelaUX](https://github.com/kubevela/catalog/blob/master/addons/velaux/resources/apiserver.cue) 插件。 其他字段请参考元数据文件定义。

你也可以通过 [CUE 基础入门文档](../cue/basic) 了解 CUE 的具体语法。

### 模块定义文件 (definitions/) 目录 (非必须)

`definitions` 文件目录用于存放模版定义文件（`X-Definitions` ）, 这些文件可以是一个 YAML 类型的 ComponentDefinition，traitDefinitions 或 workflowStepDefinitions Kubernetes CR。也可以是 CUE 格式的 KubeVela [def](../../getting-started/definition) 文件，这类文件在启用时会被渲染成对应的 X-definitions CR 再下发到集群。

> 需要注意的是，这些 X-definitions 只会被下发到管控集群。

#### 模版定义文件与组件关联

如果你想让某个模版定义文件和应用中的组件相关联，从而达到动态启用模版组件定义的能力，你就可以在 definitions 上设置 `addon.oam.dev/bind-component` 注解的方式来实现。
一个典型的例子就是 [`fluxcd` 插件](https://github.com/kubevela/catalog/tree/master/addons/fluxcd) 。
插件中的 `kustomize` componentDefinitions 如下所示：

```cue
kustomize: {
	attributes: workload: type: "autodetects.core.oam.dev"
	description: "kustomize can fetching, building, updating and applying Kustomize manifests from git repo."
	type:        "component"
	annotations: {
		 "addon.oam.dev/ignore-without-component": "fluxcd-kustomize-controller"
   }
}

...
```

可见这个模版定义文件与插件应用中的 `fluxcd-kustomize-controller` 组件相关联。

它的 `template.cue` 如下所示：

```cue
//...

kustomizeController: {
	type: "webService"
	Name: "fluxcd-kustomize-controller",
	//....
}

gitOpsController: [...]

if parameter.onlyHelmComponents == false {
	gitOpsController: [kustomizeController]
}

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		//...
		components: [
			helmController,
			sourceController,
		] + gitOpsController
		//...
	}
}
//...
```

当用户通过下面的命令启用插件时 `fluxcd-kustomize-controller` 组件并不会被添加到应用当中，同时`kustomize` ComponentDefinitions 也不会被在管控集群当中创建。

```shell
$ vela addon enable fluxcd onlyHelmComponents=true
```

### 模版参数展示增强文件 (schema/) 目录 (非必须)

`schemas/` 目录用于存放 `X-Definitions` 所对应的 [UI-schema](../../reference/ui-schema) 文件，用于在 UX 中展示 `X-Definitions`所需要填写参数时增强显示效果。需要注意的是，和模块定义文件一样，这些文件仅会被下发到管控集群。

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