---
title:  编辑管理模块定义
---

:::tip
开始之前，请确保你已经阅读了[模块定义](../../getting-started/definition)相关概念。
:::

在 KubeVela CLI 工具中，`vela def` 命令组为开发者提供了一系列便捷的模块定义 X-Definition 编写工具，使得扩展模块的编写可以全部在 CUE 文件中进行，避免将 Template CUE 与 Kubernetes 的 YAML 格式进行混合，方便进行格式化与校验。

## init

`vela def init` 是一个用来帮助用户初始化新的 Definition 的脚手架命令。用户可以通过 如下命令来创建一个新的空白 TraitDefinition。

```bash
vela def init my-trait -t trait --desc "My trait description."
```

它生成的文件为：

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

你也可以采用交互式的方式创建：

```bash
vela def init my-comp --interactive
```

<details>
<summary>交互过程</summary>

```bash
Please choose one definition type from the following values: component, trait, policy, workload, scope, workflow-step
> Definition type: component
> Definition description: My component definition.
Please enter the location the template YAML file to build definition. Leave it empty to generate default template.
> Definition template filename: 
Please enter the output location of the generated definition. Leave it empty to print definition to stdout.
> Definition output filename: my-component.cue
Definition written to my-component.cue
```
</details>

除此之外，如果用户创建 ComponentDefinition 的目的是一个 Deployment（或者是其他的 Kubernetes Object ），而这个 Deployment 已经有了 YAML 格式的模版，用户还可以通过 `--template-yaml` 参数来完成从 YAML 到 CUE 的自动转换。例如如下的 `my-deployment.yaml`

```yaml
# my-deployment.yaml
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

运行如下命令可以得到 CUE 格式的 ComponentDefinition

```
vela def init my-comp -t component --desc "My component." --template-yaml ./my-deployment.yaml
```

得到的结果如下：

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

接下来，用户就可以在该文件的基础上进一步做进一步的修改了。比如将属性中对于 **workload.definition** 中的 `<change me>` 去掉。

## vet

在初始化 Definition 文件之后，可以运行 `vela def vet my-comp.cue` 来校验 Definition 是否在语法上有错误。

```bash
vela def vet my-comp.cue
```

比如如果少写了一个括号，该命令能够帮助用户识别出来。

## apply

确认 Definition 撰写无误后，开发者就可以将模块部署到控制面集群中了。

```bash
vela def apply my-comp.cue -n my-namespace
```

将该 Definition 将部署到 Kubernetes 的 `my-namespace` 命名空间中。默认情况下，如果不指定 namespace，就会部署到 `vela-system` 命名空间。

:::tip
如果模块定义被部署到 `vela-system` 意味着这个模块全局可用，而指定到其他命名空间的模块只有在该命名空间可用，这个功能可以用于多租户场景。
:::


## dry-run

如果想了解一下 CUE 格式的 Definition 文件会被渲染成什么样的 Kubernetes YAML 文件，可以使用 `--dry-run`来预先渲染成 Kubernetes API YAML 进行确认。

```
vela def apply my-comp.cue --dry-run
```

<details>
<summary>expected output</summary>

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

</details>


## get

在 apply 命令后，开发者可以采用原生的 `kubectl get` 从 Kubernetes 集群中查看对结果进行确认，但是正如我们上文提到的，YAML 格式的结果会相对复杂，并且嵌套在 YAML 中的 CUE 字符串会比较难编辑。使用 `vela def get` 命令可以自动将其转换成 CUE 格式，方便用户查看。

```bash
vela def get my-comp
```

## list

用户可以通过列表查询查看当前系统中安装的所有 Definition。

```
vela def list
```

也可以指定类型筛选：

- 按组件筛选
  ```
  vela def list -t component
  ```
- 按运维特征筛选
  ```
  vela def list -t trait
  ```  
- 按工作流步骤筛选
  ```
  vela def list -t workflow-step
  ```  
- 按策略筛选
  ```
  vela def list -t policy
  ```  

## edit

你可以使用 `vela def edit` 命令来编辑 Definition 时，用户也只需要对转换过的 CUE 格式 Definition 进行修改，该命令会自动完成格式转换。用户也可以通过设定环境变量 `EDITOR` 来使用自己想要使用的编辑器。

```bash
$ EDITOR=vim vela def edit my-comp
```

## delete

用户可以运行 `vela def del` 来删除相应的 Definition。

```bash
$ vela def del my-comp -n my-namespace  
Are you sure to delete the following definition in namespace my-namespace?
ComponentDefinition my-comp: My component.
[yes|no] > yes
ComponentDefinition my-comp in namespace my-namespace deleted.
```

下图简单展示了如何使用`vela def`命令来操作管理 Definition。

![def-demo](../../resources/veladef.gif)

## 调试模块定义

当我们希望通过实际的应用调试模块定义的时候，我们可以使用 `vela dry-run --definitions` 命令（`-d` 是缩写）指定本地的模块定义文件执行应用渲染。

Dry-run 命令可以帮助你清晰的查看实际运行到 Kubernetes 的资源是什么。换句话说，你可以在本地看到 KubeVela 控制器运行的结果。

举例来说，我们使用 dry-run 运行如下应用：

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app
spec:
  components:
    - name: express-server
      type: my-comp
```

命令如下：

```
vela dry-run -f app.yaml -d my-comp.cue
```

:::caution
注意，在 CLI 1.6.2 之前，你的模块定义需要先转换成 Kubernetes API 的 YAML 格式才能用 dry-run。

```
vela dry-run -f app.yaml -d my-comp.yaml
```
:::

<details>
<summary>期望输出</summary>

```
---
# Application(vela-app) -- Component(express-server)
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: my-comp
  name: hello-world
  namespace: default
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
      - image: somefive/hello-world
        name: hello-world
        ports:
        - containerPort: 80
          name: http
          protocol: TCP

---
## From the auxiliary workload
apiVersion: v1
kind: Service
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: TRAIT
    trait.oam.dev/resource: hello-world-service
    trait.oam.dev/type: AuxiliaryWorkload
  name: hello-world-service
  namespace: default
spec:
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 8080
  selector:
    app: hello-world
  type: LoadBalancer

---
```

</details>


## 下一步

* 了解如何使用 CUE [自定义组件](../components/custom-component)。
* 了解如何使用 CUE [自定义运维特征](../traits/customize-trait)。