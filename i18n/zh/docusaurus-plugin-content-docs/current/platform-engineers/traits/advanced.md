---
title:  更多用法
---

CUE 作为一种配置语言，可以让你在定义对象的时候使用更多进阶用法。

## 一次渲染多个资源

你可以在 `outputs` 里定义 For 循环。

> 注意在 For 循环里的 `parameter` 字段必须是 map 类型。

看看如下这个例子，在一个 `TraitDefinition` 对象里渲染多个 `Service`：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: expose
spec:
  schematic:
    cue:
      template: |
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

## 自定义运维特征里执行 HTTP Request

`TraitDefinition` 对象可以发送 HTTP 请求并获取应答，让你可以通过关键字 `processing` 来渲染资源。

你可以在 `processing.http` 里定义 HTTP 请求的 `method`, `url`, `body`, `header` 和 `trailer`，然后返回的数据将被存储在 `processing.output` 中。

> 请确保目标 HTTP 服务器返回的数据是 JSON 格式

接着，你就可以通过 `patch` 或者 `output/outputs` 里的 `processing.output` 来引用返回数据了。

下面是一个示例:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: auth-service
spec:
  schematic:
    cue:
      template: |
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
