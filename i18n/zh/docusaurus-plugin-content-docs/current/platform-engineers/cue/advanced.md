---
title:  开发与调试
---

本节将介绍如何使用 [CUE](https://cuelang.org/) 通过 `ComponentDefinition` 来声明 app 组件。

> 在阅读本部分之前，请确保你已经学习了 KubeVela 中的 [Definition CRD](../definition-and-templates)。

## 声明 `ComponentDefinition`

这是一个基于 CUE 的 `ComponentDefinition` 示例，它提供了无状态工作负载类型的抽象：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: stateless
spec:
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
  schematic:
    cue:
      template: |
        parameter: {
          name:  string
          image: string
        }
        output: {
          apiVersion: "apps/v1"
          kind:       "Deployment"
          spec: {
            selector: matchLabels: {
              "app.oam.dev/component": parameter.name
            }
            template: {
              metadata: labels: {
                "app.oam.dev/component": parameter.name
              }
              spec: {
                containers: [{
                  name:  parameter.name
                  image: parameter.image
                }]
              }
            }
          }
        }
```
详细来说：
- 需要 `.spec.workload` 来指示该组件的工作负载类型。
- `.spec.schematic.cue.template` 是一个 CUE 模板，具体来说：
     * `output` 字段定义了抽象模板。
     * `parameter` 字段定义了模板参数，即在 `Application` 抽象中公开的可配置属性（KubeVela 将基于parameter字段自动生成Json schema）。

让我们声明另一个名为 `task` 的组件，即  run-to-completion 负载的抽象。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: task
  annotations:
    definition.oam.dev/description: "Describes jobs that run code or a script to completion."
spec:
  workload:
    definition:
      apiVersion: batch/v1
      kind: Job
  schematic:
    cue:
      template: |
        output: {
          apiVersion: "batch/v1"
          kind:       "Job"
          spec: {
            parallelism: parameter.count
            completions: parameter.count
            template: spec: {
              restartPolicy: parameter.restart
              containers: [{
                image: parameter.image
                if parameter["cmd"] != _|_ {
                  command: parameter.cmd
                }
              }]
            }
          }
        }
        parameter: {
          count:   *1 | int
          image:   string
          restart: *"Never" | string
          cmd?: [...string]
        }
```

将上面的 `ComponentDefinition` 对象保存到文件中，并通过 `$ kubectl apply -f stateless-def.yaml task-def.yaml` 将它们安装到你的 Kubernetes 集群。

## 声明一个 `Application`

`ComponentDefinition` 可以在 `Application` 抽象中实例化，如下所示：

  ```yaml
  apiVersion: core.oam.dev/v1alpha2
  kind: Application
  metadata:
    name: website
  spec:
    components:
      - name: hello
        type: stateless
        properties:
          image: crccheck/hello-world
          name: mysvc
      - name: countdown
        type: task
        properties:
          image: centos:7
          cmd:
            - "bin/bash"
            - "-c"
            - "for i in 9 8 7 6 5 4 3 2 1 ; do echo $i ; done"
  ```

### 背后含义
<details>

上述应用程序资源将根据 CUE 模板中的 `output` 和 `Application` 属性中的用户输入生成和管理目标集群中的以下 Kubernetes 资源。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  ... # skip tons of metadata info
spec:
  template:
    spec:
      containers:
        - name: mysvc
          image: crccheck/hello-world
    metadata:
      labels:
        app.oam.dev/component: mysvc
  selector:
    matchLabels:
      app.oam.dev/component: mysvc
---
apiVersion: batch/v1
kind: Job
metadata:
  name: countdown
  ... # skip tons of metadata info
spec:
  parallelism: 1
  completions: 1
  template:
    metadata:
      name: countdown
    spec:
      containers:
        - name: countdown
          image: 'centos:7'
          command:
            - bin/bash
            - '-c'
            - for i in 9 8 7 6 5 4 3 2 1 ; do echo $i ; done
      restartPolicy: Never
```  
</details>

## CUE `Context`

KubeVela 允许你通过 `context` 关键字引用应用程序的运行时信息。

最广泛使用的上下文是应用程序名称(`context.appName`) 组件名称(`context.name`)。

```cue
context: {
  appName: string
  name: string
}
```

例如，假设你要使用用户填写的组件名称作为工作负载实例中的容器名称：

```cue
parameter: {
    image: string
}
output: {
  ...
    spec: {
        containers: [{
            name:  context.name
            image: parameter.image
        }]
    }
  ...
}
```

> 请注意，在将资源应用于目标集群之前，会自动注入 `context` 信息。

### CUE `context` 包含的所有信息

| Context Variable  | Description |
| :--: | :---------: |
| `context.appRevision` | The revision of the application |
| `context.appName` | The name of the application |
| `context.name` | The name of the component of the application |
| `context.namespace` | The namespace of the application |
| `context.output` | The rendered workload API resource of the component, this usually used in trait |
| `context.outputs.<resourceName>` | The rendered trait API resource of the component, this usually used in trait |


## 构造

一个组件定义通常由多个 API 资源组成，例如，一个由 Deployment 和 Service 组成的 `webserver` 组件。 CUE 是一个很好的解决方案，可以在简化的原语中实现这一点。

> 当然，另一种在 KubeVela 中进行组合的方法是 [使用 Helm](../helm/component)。

## 怎么做

KubeVela 要求你在 `output` 部分定义工作负载类型的模板，并在 `outputs` 部分保留所有其他资源模板，格式如下：

```cue
outputs: <unique-name>: 
  <full template data>
```

> 此要求的原因是 KubeVela 需要知道它当前正在渲染工作负载，因此它可以执行一些“魔术”，例如在此期间修补注释/标签或其他数据。

下面是 `webserver` 定义的例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: webserver
  annotations:
    definition.oam.dev/description: "webserver is a combo of Deployment + Service"
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

                            if parameter["env"] != _|_ {
                                env: parameter.env
                            }

                            if context["config"] != _|_ {
                                env: context.config
                            }

                            ports: [{
                                containerPort: parameter.port
                            }]

                            if parameter["cpu"] != _|_ {
                                resources: {
                                    limits:
                                        cpu: parameter.cpu
                                    requests:
                                        cpu: parameter.cpu
                                }
                            }
                        }]
                }
                }
            }
        }
        // an extra template
        outputs: service: {
            apiVersion: "v1"
            kind:       "Service"
            spec: {
                selector: {
                    "app.oam.dev/component": context.name
                }
                ports: [
                    {
                        port:       parameter.port
                        targetPort: parameter.port
                    },
                ]
            }
        }
        parameter: {
            image: string
            cmd?: [...string]
            port: *80 | int
            env?: [...{
                name:   string
                value?: string
                valueFrom?: {
                    secretKeyRef: {
                        name: string
                        key:  string
                    }
                }
            }]
            cpu?: string
        }
```

用户现在可以用它声明一个 `Application`：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webserver-demo
  namespace: default
spec:
  components:
    - name: hello-world
      type: webserver
      properties:
        image: crccheck/hello-world
        port: 8000
        env:
        - name: "foo"
          value: "bar"
        cpu: "100m"
```

它将在目标集群中生成和管理以下 API 资源：

```shell
$ kubectl get deployment
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
hello-world-v1   1/1     1            1           15s

$ kubectl get svc
NAME                           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
hello-world-trait-7bdcff98f7   ClusterIP   <your ip>       <none>        8000/TCP   32s
```

## 使用 CLI 编辑管理 Definitions

在 Vela CLI 工具中，`vela def` 命令组为开发者提供了一系列便捷的 Definition 编写工具，使得 Definition 的编写将全部在 CUE 文件中进行，避免将 Template CUE 与 Kubernetes 的 YAML 格式进行混合，方便进行格式化与校验。

### init

`vela def init` 是一个用来帮助用户初始化新的 Definition 的脚手架命令。用户可以通过 `vela def init my-trait -t trait --desc "My trait description."` 来创建一个新的空白 TraitDefinition ，如下

```json
"my-trait": {
        annotations: {}
        attributes: {
                appliesToWorkloads: []
                conflictsWith: []
                definitionRef:   ""
                podDisruptive:   false
                workloadRefPath: ""
        }
        description: "My trait description."
        labels: {}
        type: "trait"
}
template: patch: {}
```

或者是采用 `vela def init my-comp --interactive` 来交互式地创建新的 Definition 。

```bash
$ vela def init my-comp --interactive
Please choose one definition type from the following values: component, trait, policy, workload, scope, workflow-step
> Definition type: component
> Definition description: My component definition.
Please enter the location the template YAML file to build definition. Leave it empty to generate default template.
> Definition template filename: 
Please enter the output location of the generated definition. Leave it empty to print definition to stdout.
> Definition output filename: my-component.cue
Definition written to my-component.cue
```

除此之外，如果用户创建 ComponentDefinition 的目的是一个 Deployment（或者是其他的 Kubernetes Object ），而这个 Deployment 已经有了 YAML 格式的模版，用户还可以通过 `--template-yaml` 参数来完成从 YAML 到 CUE 的自动转换。例如如下的 `my-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: hello-world
  template:
    metadata:
      labels:
        app.kubernetes.io/name: hello-world
    spec:
      containers:
      - name: hello-world
        image: somefive/hello-world
        ports: 
        - name: http
          containerPort: 80
          protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: hello-world-service
spec:
  selector:
    app: hello-world
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

运行 `vela def init my-comp -t component --desc "My component." --template-yaml ./my-deployment.yaml` 可以得到 CUE 格式的 ComponentDefinition

```json
"my-comp": {
        annotations: {}
        attributes: workload: definition: {
                apiVersion: "<change me> apps/v1"
                kind:       "<change me> Deployment"
        }
        description: "My component."
        labels: {}
        type: "component"
}
template: {
        output: {
                metadata: name: "hello-world"
                spec: {
                        replicas: 1
                        selector: matchLabels: "app.kubernetes.io/name": "hello-world"
                        template: {
                                metadata: labels: "app.kubernetes.io/name": "hello-world"
                                spec: containers: [{
                                        name:  "hello-world"
                                        image: "somefive/hello-world"
                                        ports: [{
                                                name:          "http"
                                                containerPort: 80
                                                protocol:      "TCP"
                                        }]
                                }]
                        }
                }
                apiVersion: "apps/v1"
                kind:       "Deployment"
        }
        outputs: "hello-world-service": {
                metadata: name: "hello-world-service"
                spec: {
                        ports: [{
                                name:       "http"
                                protocol:   "TCP"
                                port:       80
                                targetPort: 8080
                        }]
                        selector: app: "hello-world"
                        type: "LoadBalancer"
                }
                apiVersion: "v1"
                kind:       "Service"
        }
        parameter: {}

}
```

接下来，用户就可以在该文件的基础上进一步做进一步的修改了。比如将属性中对于 **workload.definition** 中的 *\<change me\>* 去掉。

### vet

在初始化 Definition 文件之后，可以运行 `vela def vet my-comp.cue` 来校验 Definition 是否在语法上有错误。比如如果少写了一个括号，该命令能够帮助用户识别出来。

```bash
$ vela def vet my-comp.cue
Validation succeed.
```

### render / apply

确认 Definition 撰写无误后，开发者可以运行 `vela def apply my-comp.cue --namespace my-namespace` 来将该 Definition 应用在 Kubernetes 的 my-namespace 命名空间中。如果想了解一下 CUE 格式的 Definition 文件会被渲染成什么样的 Kubernetes YAML 文件，可以使用 `vela def apply my-comp.cue --dry-run` 或者 `vela def render my-comp.cue -o my-comp.yaml` 来预先渲染一下 YAML 文件进行确认。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: My component.
  labels: {}
  name: my-comp
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: {
                metadata: name: "hello-world"
                spec: {
                        replicas: 1
                        selector: matchLabels: "app.kubernetes.io/name": "hello-world"
                        template: {
                                metadata: labels: "app.kubernetes.io/name": "hello-world"
                                spec: containers: [{
                                        name:  "hello-world"
                                        image: "somefive/hello-world"
                                        ports: [{
                                                name:          "http"
                                                containerPort: 80
                                                protocol:      "TCP"
                                        }]
                                }]
                        }
                }
                apiVersion: "apps/v11"
                kind:       "Deployment"
        }
        outputs: "hello-world-service": {
                metadata: name: "hello-world-service"
                spec: {
                        ports: [{
                                name:       "http"
                                protocol:   "TCP"
                                port:       80
                                targetPort: 8080
                        }]
                        selector: app: "hello-world"
                        type: "LoadBalancer"
                }
                apiVersion: "v1"
                kind:       "Service"
        }
        parameter: {}
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
```

```bash
$ vela def apply my-comp.cue -n my-namespace
ComponentDefinition my-comp created in namespace my-namespace.
```

### get / list / edit / del

在 apply 命令后，开发者可以采用原生的 kubectl 来对结果进行确认，但是正如我们上文提到的，YAML 格式的结果会相对复杂。使用 `vela def get` 命令可以自动将其转换成 CUE 格式，方便用户查看。

```bash
$ vela def get my-comp -t component
```

或者用户可以通过 `vela def list` 命令来查看当前系统中安装的所有 Definition（可以指定命名空间及类型）。

```bash
$ vela def list -n my-namespace -t component
NAME                    TYPE                    NAMESPACE       DESCRIPTION  
my-comp                 ComponentDefinition     my-namespace    My component.
```

同样的，在使用 `vela def edit` 命令来编辑 Definition 时，用户也只需要对转换过的 CUE 格式 Definition 进行修改，该命令会自动完成格式转换。用户也可以通过设定环境变量 `EDITOR` 来使用自己想要使用的编辑器。

```bash
$ EDITOR=vim vela def edit my-comp
```

类似的，用户可以运行 `vela def del` 来删除相应的 Definition。

```bash
$ vela def del my-comp -n my-namespace  
Are you sure to delete the following definition in namespace my-namespace?
ComponentDefinition my-comp: My component.
[yes|no] > yes
ComponentDefinition my-comp in namespace my-namespace deleted.
```

## 下一步是什么

请查看 [Learning CUE](./basic) 文档，了解我们为什么支持 CUE 作为一流的模板解决方案，以及有关有效使用 CUE 的更多详细信息。
