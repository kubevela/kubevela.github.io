---
title: CUE 定义资源描述文件
---

本文档将会详细介绍如何通过 CUE 编写应用模版定义文件 (template.cue) 和 `resources/` 目录下的资源文件来定义需要下发的资源。

通过编写 CUE 的资源文件，插件将会获得以下能力：

* 资源可以在启用插件时通过启动参数动态渲染结果。
* 插件中某些特殊的资源并不想作为应用的一部分在多集群范围内下发，而只想仅在管控中被创建。
* 插件中可能包含多个 X-definitions 和背后支撑这些能力的 operator，他们能够根据启动参数被动态的被启用。


## 应用模版文件（template.cue）

CUE 格式的应用模版描述文件中最重要的是定义一个 `output` 的 CUE 代码块，这个代码块所包含的必须是一个 KubeVela 的`应用`（application）。如下所示：

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

请注意这个`应用`与 [YAML](./intro#templateyaml) 应用模版文件中所定义的`应用`不同的是，这个`应用`中 `spec.components[0].properties.objects[0].metadata.name` 资源所定义的 namespace 的名称是由 `parameter.namespace` 所决定的。这代表它的名字在启用插件时被 `namespace` 启动参数所设置。

如果你希望这个 `namespace` 的名称是 `my-namespace`, 就可以这样启用这个插件：

```shell
$ vela addon enable <addon-name> namespace=my-namespace
```

经过渲染之后，`应用`如下所示：

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

### 例子

* [ingress-nginx](https://github.com/kubevela/catalog/tree/master/addons/ingress-nginx/template.cue) 这个例子中使用的就是 CUE 模版定义文件。


### 如何定义 `template.cue` 实现根据参数选择安装集群

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

经过渲染，`应用`为：

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

## parameter.cue

在上面的例子中，我们使用了通过 `parameter.namespace` 启动参数设置被创建资源 `namespace` 的名称，和 `parameter.clusters` 设置插件的安装集群。 但其实我们还需要一个参数定义文件（`parameter.cue`）来定义插件有哪些启动参数。 针对上面的例子就是：

```cue
parameter: {		
  //+usage=clsuters install to
  clsuters: [...string]
  //+usage=namespace to create
  namespace: string
}
```

## 部署附属资源

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

这个例子中我们定义了一个 `resourceTree` 的 configmap ，这个 configmap 其实是一个[拓扑树资源关系规则](../../reference/topology-rule)，这个 configmap 就只需要在管控集群中部署。

## 资源目录 `resources/` 下的 CUE 资源描述文件

跟 [YAML 资源描述文件](./intro#资源目录) 中是 Kubernetes 资源对象不同，CUE 资源描述文件的作用是定义可以被 `template.cue` 引用的 CUE 代码块。

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

> 需要注意的是，CUE 资源描述文件需要必须要包含一个 `package main` header 才会被识别为一个资源描述文件，从而与应用模版文件放在一个渲染上下文中渲染。 

### 使用 context 中的变量渲染组件

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

在渲染时 `metadata.yaml` 中定义的各个字段，会被放进 `context` CUE 的代码块中，连同其他 CUE 文件一并渲染，假如你的 `metadata.yaml` 为：

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

上面就完整的介绍了如何用 CUE 编写 `template.cue`, `parameter.cue` 以及 `resources/` 目录下的 CUE 资源文件，在启用插件时这些文件会联同 `metadata.yaml` 中记录的插件元信息在同一个上下文中渲染得到渲染结果并下发。

如果你对 CUE 语言还不了解，可以通过 [CUE 基础入门文档](../cue/basic) 了解 CUE 的具体语法。

## `definitions/` 中模版定义文件与`应用`中组件关联

一些情况下，你的插件中可能包含多个模版定义文件 (X-definitions) 和背后支撑这些能力的 operators，如果你希望他们能够根据启动参数被动态的被启用，你就可以通过在[模版定义文件](X-definitions) 上设置 `addon.oam.dev/bind-component` 注解的方式和`应用`中的某个组件相关联来实现。 一个典型的例子就是 [`fluxcd` 插件](https://github.com/kubevela/catalog/tree/master/addons/fluxcd) 。 插件中的 `kustomize` componentDefinitions 如下所示：

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