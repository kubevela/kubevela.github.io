---
title: 使用 CUE 描述插件应用
---

文档 [自定义插件](./intro) 介绍了插件的基本目录结构和原理。此外，文档 [YAML 描述插件应用](./addon-yaml) 也介绍了通过最简单的 YAML 格式如何定义应用描述文件。如果你希望插件具备以下能力，你也可以选择使用 CUE 格式定义插件的应用描述文件：

* 利用 CUE 语言灵活简洁的语法、丰富的内置函数及其参数校验能力，根据启动参数和插件元数据渲染和部署插件应用和[附属资源](#部署附属资源) 。
* 插件中可能包含多个模块定义（Definition）文件及其背后支撑的 CRD Operator，他们能够根据启动参数被选择性安装。

本文将会详细介绍如何编写 CUE 格式的应用描述文件，并实现特定的场景和功能。

应用描述文件通常包含两个部分：应用模版文件和 resources/ 目录下的资源文件。

## 应用模版文件 （template.cue）

CUE 格式的应用模版中最重要的是定义一个 `output` 的 CUE 代码块，这个代码块所包含的必须是一个 KubeVela 的`应用`（application）。如下所示：

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

请注意这个应用中的 `spec.components[0].properties.objects[0]` 中所所定义的 Kubernetes namespace 的名称是由 `parameter.namespace` 所决定的。这代表它的名字在启用插件时会被 `namespace` 启动参数所动态渲染。

如果你希望这个 `namespace` 的名称是 `my-namespace`, 就可以这样启用这个插件：

```shell
$ vela addon enable <addon-name> namespace=my-namespace
```

经过渲染之后，这个插件的应用如下所示：

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
如果你对 CUE 语言还不了解，可以通过 [CUE 基础入门文档](../cue/basic) 了解 CUE 的具体语法。

> 需要注意的是，即使你在应用模版文件中设置了应用的名称，该设置也不会生效，在启用时应用会统一以 addon-{addonName} 的格式自动命名。

虽然你可以在应用模版文件中定义应用的全部内容，但这可能会导致这个文件变得非常的庞大，所以你可以选择将一部分关于资源描述的内容拆分到 `resources/` 目录下面，后面的章节将会详细介绍 `resources/` 目录中的资源描述文件如何定义。

## 参数定义文件 （parameter.cue）

在上面的例子中，我们使用了通过 `parameter.namespace` 启动参数设置被创建资源 `namespace` 的名称。 但其实我们还需要一个参数定义文件（`parameter.cue`）来定义插件有哪些启动参数。 针对上面的例子参数定义文件就是：

```cue
parameter: {
  //+usage=namespace to create
  namespace?: foo-namespace | string
}
```

在启用插件时，你可以通过在启动命令后面追加启动参数的方式来设置参数定义文件中声明的参数，如下所示：

```shell
$ vela addon enable <addon-Name> <parameter-name-1=value> <parameter-name-1=value>
```

## 目录 `resources/` 下的 CUE 资源文件

目录 `resources/` 下的资源文件的作用是：定义可以被应用模版文件（template.cue）引用的 CUE 代码块。

继续使用上面的例子，我们把定义 `namesapce` 资源的 CUE 代码块拆分到 `resources` 目录下，那么插件的目录结构如下所示：

```shell
├── resources/
│   └── namespace.cue
├── README.md
├── metadata.yaml
├── parameter.cue
└── template.cue
```

`resources/namesapce.cue` 文件的内容如下所示：

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

可以看到我们在这个文件中分别定义了一个 Kubernetes namespace 的 CUE 代码块，接下来我们就可以在 `template.cue` 中引用这个代码块：

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
	}
}
```

通过下面的命令，设置 `namespace` 参数启用插件后，渲染出来的应用如下所示：

```shell
$ vela addon enable <addon-name> namespace=my-namespace
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
```

> 需要注意的是，CUE 资源描述文件需要必须要包含一个 `package main` header 才会被识别为一个资源描述文件，进而才会与应用模版文件放在一个渲染上下文中渲染。这可以帮你过滤掉不想放到渲染上下文中的那些 CUE 文件。

## 场景和功能

下面将会介绍几个核心的插件功能所对应的应用描述文件的编写方法。

### 实现根据参数选择安装集群

如果你希望插件中的 Kubernetes 资源能够不止被安装在管控集群，同时也能够安装在其他的子集群中， 并且具体安装在哪些集群需要由用户在启用插件时设置 `clusters` 启动参数来指定。 你就可以在插件应用中添加一个根据参数渲染的 [topology 策略](../../end-user/policies/references#topology) 来实现，应用模版文件如下所示：

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

如果你执行下面的命令，应用中的资源将会被部署在 `local` 集群和 `cluster1` 集群：

```shell
$ vela addon enable <addon-name> clusters=local,cluser1
```

经过渲染，应用为：

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

启用插件之后，应用会被在管控集群中创建。KubeVela 控制器会进一步根据这个应用的 topology 策略中的定义把组件安装到 local 和 cluster1 集群。

如果你需要在所有集群中启用插件的，可以通过在启用插件时不设置 cluster 参数，如下所示：

```shell
$ vela addon enable <addon-name>
```

渲染出来的应用则会变成：

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
        clusterLabelSelector: { }
```

由于如果应用如果设置一个空的 （`{}`） `clusterLabelSelector` topology 策略，会默认在所有集群部署组件，所以插件启用之后应用中的组件会被安装到 KubeVela 所管控的所有集群中。

### 部署附属资源

在 CUE 类型的应用模版文件中，除了在 `output` 代码块中定义 KubeVela 应用外，还可以定义其他需要仅在管控集群部署的 `附属资源`。定义的方法是把需要部署的 Kubernetes 资源对象放到 `outputs` 中，这些资源会被渲染并直接下发到管控集群。例如：

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

这个例子中我们定义了一个 `resourceTree` 的 configmap ，这个 configmap 其实是一个[拓扑树资源关系规则](../../reference/topology-rule)，这个资源的作用是建立集群中自定义类型资源的关联关系，从而使这些能够被在资源拓扑图中展示。这个 configmap 就只需要在管控集群中部署。


### 使用 context 中的变量渲染组件

除了通过启动参数动态渲染应用外，你还可以读取插件的元数据文件 `metadata.yaml` 中定义的字段来做渲染。 例如你可以如下定义一个应用模版文件：

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

在渲染时元数据文件（`metadata.yaml`）中定义的各个字段，会被放进 `context` CUE 代码块中，连同其他 CUE 文件一并渲染，假如你的元数据文件（`metadata.yaml`）为：

```yaml
...
name: velaux
version: 1.2.4
...
```

渲染出来的应用为：

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

这个例子中，使用了插件的版本来填充镜像的 tag。一个例子是 [VelaUX](https://github.com/kubevela/catalog/blob/master/addons/velaux/resources/apiserver.cue) 插件。 其他字段请参考插件的[元数据文件](./intro) 定义。

上面就完整的介绍了如何用 CUE 编写 `template.cue`, `parameter.cue` 以及 `resources/` 目录下的 CUE 资源文件，在启用插件时这些文件会连同 `metadata.yaml` 中记录的插件元信息在同一个上下文中渲染得到结果并下发。

你也可以在本地使用 `cue eval *.cue resources/*.cue -e output -d yaml` 命令查看资源渲染的效果。

### 模块化能力与应用中组件关联

一些情况下，你的插件中可能包含多个模块化能力 (Definitions) 和背后支撑这些能力的 operator，如果你希望他们能够根据启动被参数选择性的安装，你就可以通过在模版化能力（Definition）上设置 `addon.oam.dev/bind-component` 注解的方式和应用中的某个组件相关联来实现。 一个典型的例子就是 [`fluxcd` 插件](https://github.com/kubevela/catalog/tree/master/addons/fluxcd) 。 插件中的 `kustomize` componentDefinitions 如下所示：

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

可见这个 definition 与插件应用中的 `fluxcd-kustomize-controller` 组件相关联。

这个插件中的应用模版文件如下所示：

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

用户就可以通过设置 `onlyHelmComponents=true` 的启动参数禁用 `kustomize` 相关模块化能力和 operator ，如下所示：

```shell
$ vela addon enable fluxcd onlyHelmComponents=true
```

由于当参数 `onlyHelmComponents` 被设置为 `true` 时, 渲染出来的应用中不会包含 `fluxcd-kustomize-controller` 组件，所以与之绑定的 `kustomize` ComponentDefinition 也不会被在管控集群当中创建。

## 例子

一个 CUE 定义应用描述文件的例子就是 [ingress-nginx](https://github.com/kubevela/catalog/tree/master/addons/ingress-nginx/template.cue) 插件。
