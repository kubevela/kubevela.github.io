---
title:  自定义运维特征
---


本节介绍如何自定义运维特征，为用户的组件增添任何需要的运维特征能力。开始这一部分之前，请确保你已经对[核心概念](../../getting-started/definition) 以及 [如何管理模块定义](../cue/definition-edit)有了基本的了解。

## 通过 Trait 生成资源对象

通过 Trait 生成资源的用法和 Component 基本类似，有如下场景：

- 用于生成运维的资源对象，比如用于服务访问的 Ingress、Service，或者用于扩缩容的 HPA 等对象。
- 用于上述运维对象的多种组合。
- 用于对组件配置的补丁，如增加一个边车容器做日志收集等。

同样的，我们使用 `vela def init`命令来生成一个框架：

```
vela def init my-route -t trait --desc "My ingress route trait." > myroute.cue
```

期望生成的内容如下：

```
$ cat myroute.cue
"my-route": {
	annotations: {}
	attributes: {
		appliesToWorkloads: []
		conflictsWith: []
		podDisruptive:   false
		workloadRefPath: ""
	}
	description: "My ingress route trait."
	labels: {}
	type: "trait"
}

template: {
	patch: {}
	parameter: {}
}
```

:::caution
在 vela CLI(`<=1.4.2`)的版本中有一个已知问题，`vela def init` 命令会生成一个错误的 `definitionRef: ""` 字段，这一行需要删除。
:::


与组件定义有所不同，在用法上，你需要把所有的运维特征定义在 `outputs` 里(注意，不是 `output`)，格式如下：

```cue
outputs: {
  <unique-name>: {
    <template of trait resource structural data>
  }
}
```

:::tip
Actually the CUE template of trait here will be evaluated with component CUE template in the same context, so the name can't be conflict. That also explain why the `output` can't be defined in trait.
:::

我们下面使用一个 `ingress` 和 `Service` 组成一个称为 `my-route` 的运维特征作为示例讲解：

```cue
"my-route": {
	annotations: {}
	attributes: {
		appliesToWorkloads: []
		conflictsWith: []
		podDisruptive:   false
		workloadRefPath: ""
	}
	description: "My ingress route trait."
	labels: {}
	type: "trait"
}

template: {
	parameter: {
		domain: string
		http: [string]: int
	}

  // 我们可以在一个运维特征 CUE 模版定义多个 outputs
	outputs: service: {
		apiVersion: "v1"
		kind:       "Service"
		spec: {
			selector:
				app: context.name
			ports: [
				for k, v in parameter.http {
					port:       v
					targetPort: v
				},
			]
		}
	}

	outputs: ingress: {
		apiVersion: "networking.k8s.io/v1beta1"
		kind:       "Ingress"
		metadata:
			name: context.name
		spec: {
			rules: [{
				host: parameter.domain
				http: {
					paths: [
						for k, v in parameter.http {
							path: k
							backend: {
								serviceName: context.name
								servicePort: v
							}
						},
					]
				}
			}]
		}
	}
}
```

将这个运维特征通过如下命令部署到控制平面上：

```
vela def apply myroute.cue
```

然后最终用户就立即可以发现并使用这个运维特征了，这个运维特征没有限制，可以作用于任意 `Application`。

我们通过如下的 `vela up` 命令将它启动起来：

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        cmd:
          - node
          - server.js
        image: oamdev/testapp:v1
        port: 8080
      traits:
        - type: my-route
          properties:
            domain: test.my.domain
            http:
              "/api": 8080
EOF
```

然后 KubeVela 在服务端就会将其生成 Kubernetes 资源，通过 CUE 我们可以完成很多复杂的玩法。

### 一次渲染多个资源

你可以在 `outputs` 里定义 For 循环。

:::note
注意在 For 循环里的 `parameter` 字段必须是 map 类型。
:::

看看如下这个例子，在一个 `TraitDefinition` 对象里渲染多个 `Service`：

```yaml
"expose": {
	type: "trait"
}

template: {
	parameter: {
		http: [string]: int
	}
	outputs: {
		for k, v in parameter.http {
			"\(k)": {
				apiVersion: "v1"
				kind:       "Service"
				spec: {
					selector:
						app: context.name
					ports: [{
						port:       v
						targetPort: v
					}]
				}
			}
		}
	}
}
```

这个运维特征可以这样使用：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        ...
      traits:
        - type: expose
          properties:
            http:
              myservice1: 8080
              myservice2: 8081
```

### 自定义运维特征里执行 HTTP Request

`TraitDefinition` 对象可以发送 HTTP 请求并获取应答，让你可以通过关键字 `processing` 来渲染资源。

你可以在 `processing.http` 里定义 HTTP 请求的 `method`, `url`, `body`, `header` 和 `trailer`，然后返回的数据将被存储在 `processing.output` 中。

:::tip
请确保目标 HTTP 服务器返回的数据是 JSON 格式才能正确解析到 `output` 字段中。
:::

接着，你就可以通过 `patch` 或者 `output/outputs` 里的 `processing.output` 来引用返回数据了。

下面是一个示例:

```yaml
"auth-service": {
	type: "trait"
}

template: {
	parameter: {
		serviceURL: string
	}

	processing: {
		output: {
			token?: string
		}
		// The target server will return a JSON data with `token` as key.
		http: {
			method: *"GET" | string
			url:    parameter.serviceURL
			request: {
				body?: bytes
				header: {}
				trailer: {}
			}
		}
	}

	patch: {
		data: token: processing.output.token
	}
}
```

在上面这个例子中，`TraitDefinition` 对象发送请求来获取 `token` 的数据，然后将这些数据补丁给组件实例。

## 数据传递

`TraitDefinition` 对象可以读取特定 `ComponentDefinition` 对象生成的 API 资源（渲染自 `output` 和 `outputs`）。

:::caution
Generally, KubeVela will ensure the component definitions are evaluated before its traits. But there're a [stage mechanism](https://github.com/kubevela/kubevela/pull/4570) that allow trait be deployed before component.
:::


具体来说，`context.output` 字段包含了所有渲染后的工作负载 API 资源，然后 `context.outputs.<xx>` 则包含渲染后的其它类型 API 资源。

下面是一个数据传递的例子:

1. Let's define a component definition `myworker` like below:

```cue
"myworker": {
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	type: "component"
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		spec: {
			selector: matchLabels: {
				"app.oam.dev/component": context.name
			}

			template: {
				metadata: labels: {
					"app.oam.dev/component": context.name
				}
				spec: {
					containers: [{
						name:  context.name
						image: parameter.image
						ports: [{containerPort: parameter.port}]
						envFrom: [{
							configMapRef: name: context.name + "game-config"
						}]
						if parameter["cmd"] != _|_ {
							command: parameter.cmd
						}
					}]
				}
			}
		}
	}

	outputs: gameconfig: {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: {
			name: context.name + "game-config"
		}
		data: {
			enemies: parameter.enemies
			lives:   parameter.lives
		}
	}

	parameter: {
		// +usage=Which image would you like to use for your service
		// +short=i
		image: string
		// +usage=Commands to run in the container
		cmd?: [...string]
		lives:   string
		enemies: string
		port:    int
	}
}
```

2. Define a new `myingress` trait that read the port.

```cue
"myingress": {
	type: "trait"
  attributes: {
		appliesToWorkloads: ["myworker"]
  }
}

template: {
	parameter: {
		domain:     string
		path:       string
		exposePort: int
	}
	// trait template can have multiple outputs in one trait
	outputs: service: {
		apiVersion: "v1"
		kind:       "Service"
		spec: {
			selector:
				app: context.name
			ports: [{
				port:       parameter.exposePort
				targetPort: context.output.spec.template.spec.containers[0].ports[0].containerPort
			}]
		}
	}
	outputs: ingress: {
		apiVersion: "networking.k8s.io/v1beta1"
		kind:       "Ingress"
		metadata:
				name: context.name
		labels: config: context.outputs.gameconfig.data.enemies
		spec: {
			rules: [{
				host: parameter.domain
				http: {
					paths: [{
						path: parameter.path
						backend: {
							serviceName: context.name
							servicePort: parameter.exposePort
						}
					}]
				}
			}]
		}
	}
}
```

在渲染 `worker` `ComponentDefinition` 时，具体发生了：
1. 渲染的 `Deployment` 资源放在 `context.output` 中。
2. 其它类型资源则放进 `context.outputs.<xx>` 中，同时 `<xx>` 是在特指 `template.outputs` 的唯一名字

因而，`TraitDefinition` 对象可以从 `context` 里读取渲染后的 API 资源（比如 `context.outputs.gameconfig.data.enemies` 这个字段）。

## 使用 Patch Trait 对参数增补或覆盖

除了利用 Trait 生成资源以外，一个更高级的用法是对组件生成的参数做增补或修改。

什么场景下会使用这种功能？

1. 组件由其他人定义，运维人员对参数做修改。
2. 组件由第三方组织定义，我们不拥有修改能力（不维护），只在部署时使用。

针对上述场景，KubeVela 通过 patch 功能来支撑，因为 Patch 的能力针对 Trait 和 Workflow 均适用，我们通过[这篇 Patch 文档](./patch-trait)统一介绍。

## Define Health for Definition

You can also define health check policy and status message when a trait deployed and tell the real status to end users.

:::caution
Reference `parameter` defined in `template` is not supported now in health check and custom status, they work in different stage with the resource template. While we're going to support this feature in https://github.com/kubevela/kubevela/issues/4863 .
:::

### Health Check

The spec of health check is `<trait-type-name>.attributes.status.healthPolicy`, it's similar to component definition.

If not defined, the health result will always be `true`, which means it will be marked as healthy immediately after resources applied to Kubernetes. You can define a CUE expression in it to notify if the trait is healthy or not.

The keyword in CUE is `isHealth`, the result of CUE expression must be `bool` type.

KubeVela runtime will evaluate the CUE expression periodically until it becomes healthy. Every time the controller will get all the Kubernetes resources and fill them into the `context` variables.

So the context will contain following information:

```cue
context:{
  name: <component name>
  appName: <app name>
  outputs: {
    <resource1>: <K8s trait resource1>
    <resource2>: <K8s trait resource2>
  }
}
```

The example of health check likes below:

```cue
my-ingress: {
	type: "trait"
	...
	attributes: {
		status: {
			healthPolicy: #"""
              isHealth: len(context.outputs.service.spec.clusterIP) > 0
		      """#
    	}
  	}
}
```

The health check result will be recorded into the corresponding trait in `.status.services` of `Application` resource.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
status:
  ...
  services:
  - healthy: true
    ...
    name: myweb
    traits:
    - healthy: true
      type: my-ingress
  status: running
```

> Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/trait/gateway.cue) for more complete example.


### Custom Status

The spec of custom status is `<trait-type-name>.attributes.status.customStatus`, it shares the same mechanism with the health check.

The keyword in CUE is `message`, the result of CUE expression must be `string` type.

Application CRD controller will evaluate the CUE expression after the health check succeed.

The example of custom status likes below:

```cue
my-service: {
	type: "trait"
	...
	attributes: {
		status: {
			customStatus: #"""
				if context.outputs.ingress.status.loadBalancer.ingress != _|_ {
					let igs = context.outputs.ingress.status.loadBalancer.ingress
				  if igs[0].ip != _|_ {
				  	if igs[0].host != _|_ {
					    message: "Visiting URL: " + context.outputs.ingress.spec.rules[0].host + ", IP: " + igs[0].ip
				  	}
				  	if igs[0].host == _|_ {
					    message: "Host not specified, visit the cluster or load balancer in front of the cluster with IP: " + igs[0].ip
				  	}
				  }
				}
				"""#
    	}
  	}
}
```

The message will be recorded into the corresponding trait in `.status.services` of `Application` resource.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
status:
  ...
  services:
  - healthy: true
    ...
    name: myweb
    traits:
    - healthy: true
      message: 'Visiting URL: www.example.com, IP: 47.111.233.220'
      type: my-ingress
  status: running
```

> Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/trait/gateway.cue) for more complete example.


## Full available `context` in Trait


|         Context Variable         |                                                                         Description                                                                         |    Type    |
| :------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------: |
|        `context.appName`         |                                           The app name corresponding to the current instance of the application.                                            |   string   |
|       `context.namespace`        | The target namespace of the current resource is going to be deployed, it can be different with the namespace of application if overridden by some policies. |   string   |
|        `context.cluster`         |  The target cluster of the current resource is going to be deployed, it can be different with the namespace of application if overridden by some policies.  |   string   |
|      `context.appRevision`       |                                       The app version name corresponding to the current instance of the application.                                        |   string   |
|     `context.appRevisionNum`     |                                      The app version number corresponding to the current instance of the application.                                       |    int     |
|          `context.name`          |                                        The component name corresponding to the current instance of the application.                                         |   string   |
|        `context.revision`        |                                                     The version name of the current component instance.                                                     |   string   |
|         `context.output`         |                                               The object structure after instantiation of current component.                                                | Object Map |
| `context.outputs.<resourceName>` |                                           Structure after instantiation of current component auxiliary resources.                                           | Object Map |
|      `context.workflowName`      |                                                         The workflow name specified in annotation.                                                          |   string   |
|     `context.publishVersion`     |                                                The version of application instance specified in annotation.                                                 |   string   |
|       `context.components`       |                                                The object structure of components spec  in this application.                                                | Object Map |
|       `context.appLabels`        |                                                       The labels of the current application instance.                                                       | Object Map |
|     `context.appAnnotations`     |                                                    The annotations of the current application instance.                                                     | Object Map |


## Trait definition in Kubernetes

KubeVela is fully programmable via CUE, while it leverage Kubernetes as control plane and align with the API in yaml.
As a result, the CUE definition will be converted as Kubernetes API when applied into cluster.

The trait definition will be in the following API format:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: <TraitDefinition name>
  annotations:
    definition.oam.dev/description: <function description>
spec:
  definition:
    apiVersion: <corresponding Kubernetes resource group>
    kind: <corresponding Kubernetes resource type>
  workloadRefPath: <The path to the reference field of the Workload object in the Trait>
  podDisruptive: <whether the parameter update of Trait cause the underlying resource (pod) to restart>
  manageWorkload: <Whether the workload is managed by this Trait>
  skipRevisionAffect: <Whether this Trait is not included in the calculation of version changes>
  appliesToWorkloads:
  - <Workload that TraitDefinition can adapt to>
  conflictsWith:
  - <other Traits that conflict with this><>
  revisionEnabled: <whether Trait is aware of changes in component version>
  controlPlaneOnly: <Whether resources generated by trait are dispatched to the hubcluster (local)>
  schematic:  # Abstract
    cue: # There are many abstracts
      template: <CUE format template>
```

You can check the detail of this format [here](../oam/x-definition).

## More examples to learn

You can check the following resources for more examples:

- Builtin trait definitions in the [KubeVela github repo](https://github.com/kubevela/kubevela/tree/master/vela-templates/definitions/internal/trait).
- Definitions defined in addons in the [catalog repo](https://github.com/kubevela/catalog/tree/master/addons).