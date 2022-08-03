---
title:  自定义运维特征
---


本节介绍如何自定义运维特征，为用户的组件增添任何需要的运维特征能力。开始这一部分之前，请确保你已经对[核心概念](../../getting-started/definition) 以及 [如何管理模块定义](../cue/definition-edit)有了基本的了解。

## 通过 Trait 生成资源对象

通过 Trait 生成资源的用法和 Component 基本类似，这种场景通常用于生成运维的对象，比如用于服务访问的 Ingress、Service，或者用于扩缩容的 HPA 等对象。

同样的，我们使用 `vela def init`命令来生成一个框架：

```
vela def init my-route -t trait --desc "My ingress route trait." > myroute.cue
```

> 注意： 在 vela CLI(`<=1.4.2`)的版本中有一个已知问题，`vela def init` 命令会生成一个错误的 `definitionRef: ""` 字段，这一行需要删除。

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

与组件定义有所不同，在用法上，你需要把所有的运维特征定义在 `outputs` 里(注意，不是 `output`)，格式如下：

```cue
outputs: <unique-name>: 
  <full template data>
```

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
vela def apply -f myroute.cue
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

> 注意在 For 循环里的 `parameter` 字段必须是 map 类型。

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

> 请确保目标 HTTP 服务器返回的数据是 JSON 格式

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

>  KubeVela 保证了 `ComponentDefinition` 一定会在 `TraitDefinition` 之前渲染

具体来说，`context.output` 字段包含了所有渲染后的工作负载 API 资源，然后 `context.outputs.<xx>` 则包含渲染后的其它类型 API 资源。

下面是一个数据传递的例子:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: worker
spec:
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
  schematic:
    cue:
      template: |
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


---
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: ingress
spec:
  schematic:
    cue:
      template: |
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

## 下一步

* 了解组件和运维特征如何[定义健康状态](../traits/status)。
* 了解如何通过 CUE [定义工作流步骤](../workflow/workflow)。