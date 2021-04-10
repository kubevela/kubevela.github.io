---
title:  Application CRD
---

本部分将逐步介绍如何以声明方式使用`Application`来定义具有相应操作行为的应用。

## 示例

下面的示例应用声明了一个具有 *Worker* 工作负载类型的 `backend` 组件和具有 *Web Service* 工作负载类型的`frontend`组件。

此外，`frontend`组件声明了具有 `sidecar` 和 `autoscaler` 的`trait`运维能力，这意味着工作负载将自动注入 `fluentd` 的sidecar，并可以根据CPU使用情况触发1-10个副本进行扩展。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: backend
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
    - name: frontend
      type: webservice
      properties:
        image: nginx
      traits:
        - type: autoscaler
          properties:
            min: 1
            max: 10
            cpuPercent: 60
        - type: sidecar
          properties:
            name: "sidecar-test"
            image: "fluentd"
```

### 部署应用

Apply上述的 application yaml文件, 然后应用启动

```shell
$ kubectl get application -o yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
 name: website
....
status:
  components:
  - apiVersion: core.oam.dev/v1alpha2
    kind: Component
    name: backend
  - apiVersion: core.oam.dev/v1alpha2
    kind: Component
    name: frontend
....
  status: running

```

你可以看到一个命名为`frontend`的deployment，其中被注入的容器`fluentd`正在运行。

```shell
$ kubectl get deploy frontend
NAME       READY   UP-TO-DATE   AVAILABLE   AGE
frontend   1/1     1            1           100m
```

另一个命名为`backend`的deployment也在运行。

```shell
$ kubectl get deploy backend
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
backend   1/1     1            1           100m
```

一个HPA也被`autoscaler` 运维能力创建了出来。

```shell
$ kubectl get HorizontalPodAutoscaler frontend
NAME       REFERENCE             TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
frontend   Deployment/frontend   <unknown>/50%   1         10        1          101m
```


## 底层

在上面的示例中, `type: worker` 指的是该组件的规范（在后面的 `properties` 部分中声明）将由名为 `worker` 的 `ComponentDefinition` 对象执行，如下所示：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: worker
  annotations:
    definition.oam.dev/description: "Describes long-running, scalable, containerized services that running at backend. They do NOT have network endpoint to receive external network traffic."
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

                  if parameter["cmd"] != _|_ {
                    command: parameter.cmd
                  }
                }]
              }
            }
          }
        }
        parameter: {
          image: string
          cmd?: [...string]
        }
```

因此，`backend` 的 `properties` 部分仅支持两个参数：`image` 和 `cmd`。这是由定义的 `.spec.template` 字段的 `parameter` 列表执行的。

类似的可扩展抽象机制也同样适用于运维能力trait。
例如，`frontend` 中的 `type：autoscaler` 指的是其运维能力规范（比如 `properties` 部分）
将由名为 `autoscaler` 的 `TraitDefinition` 对象执行，如下所示：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "configure k8s HPA for Deployment"
  name: hpa
spec:
  appliesToWorkloads:
    - webservice
    - worker
  schematic:
    cue:
      template: |
        outputs: hpa: {
          apiVersion: "autoscaling/v2beta2"
          kind:       "HorizontalPodAutoscaler"
          metadata: name: context.name
          spec: {
            scaleTargetRef: {
              apiVersion: "apps/v1"
              kind:       "Deployment"
              name:       context.name
            }
            minReplicas: parameter.min
            maxReplicas: parameter.max
            metrics: [{
              type: "Resource"
              resource: {
                name: "cpu"
                target: {
                  type:               "Utilization"
                  averageUtilization: parameter.cpuUtil
                }
              }
            }]
          }
        }
        parameter: {
          min:     *1 | int
          max:     *10 | int
          cpuUtil: *50 | int
        }
```

应用同样有一个`sidecar`的运维能力

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "add sidecar to the app"
  name: sidecar
spec:
  appliesToWorkloads:
    - webservice
    - worker
  schematic:
    cue:
      template: |-
        patch: {
           // +patchKey=name
           spec: template: spec: containers: [parameter]
        }
        parameter: {
           name: string
           image: string
           command?: [...string]
        }
```

所有定义对象都被期望由平台团队声明和安装，与此同时业务用户将仅专注于`Application`资源。

请注意，KubeVela的业务用户不需要了解定义对象，他们可以学习如何使用具有可视化形式（或者参数的JSON schema）的给定功能。请[从定义生成表格部分](/docs/platform-engineers/openapi-v3-json-schema)，了解如何实现此目的。

### 约定 和 "标准合约"

在将`Application`资源应用于Kubernetes集群后，KubeVela运行时将遵循以下“标准合约”和约定来生成和管理底层资源实例。


| Label  | 描述 |
| :--: | :---------: | 
|`workload.oam.dev/type=<component definition name>` | 其对应 `ComponentDefinition` 的名称 |
|`trait.oam.dev/type=<trait definition name>` | 其对应 `TraitDefinition` 的名称 | 
|`app.oam.dev/name=<app name>` | 它所属的应用的名称 |
|`app.oam.dev/component=<component name>` | 它所属的组件的名称 |
|`trait.oam.dev/resource=<name of trait resource instance>` | 运维能力资源实例的名称 |
|`app.oam.dev/appRevision=<name of app revision>` | 它所属的应用revision的名称 |
