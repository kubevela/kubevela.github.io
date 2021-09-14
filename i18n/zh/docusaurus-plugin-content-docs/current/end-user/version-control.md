---
title:  版本管理
---

## 组件版本

你可以通过字段 `spec.components[*].externalRevision` 在 Application 中指定即将生成的组件实例版本名称。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v1
      properties:
        image: stefanprodan/podinfo:4.0.3
```

如果没有主动指定版本名称，会根据规则 `<component-name>-<revision-number>` 自动生成。

应用创建以后，你就可以看到系统中生成了 ControllerRevision 对象来记录组件版本。

* 获取组件实例的版本记录

```shell
$ kubectl get controllerrevision -l controller.oam.dev/component=express-server
NAME                CONTROLLER                       REVISION   AGE
express-server-v1   application.core.oam.dev/myapp   1          2m40s
express-server-v2   application.core.oam.dev/myapp   2          2m12s
```

你可以在[灰度发布](./traits/rollout)功能中进一步利用组件实例版本化以后的功能。

## 在应用中指定组件类型和运维功能的版本

当系统中的组件类型和运维功能变化时，也会产生对应的版本号。

* 查看组件类型的版本变化

```shell
$  kubectl get definitionrevision -l="componentdefinition.oam.dev/name=webservice" -n vela-system
NAME            REVISION   HASH               TYPE
webservice-v1   1          3f6886d9832021ba   Component
webservice-v2   2          b3b9978e7164d973   Component
```

* 查看运维能力的版本变化

```shell
$ kubectl get definitionrevision -l="trait.oam.dev/name=rollout" -n vela-system
NAME         REVISION   HASH               TYPE
rollout-v1   1          e441f026c1884b14   Trait
```

你可以在应用中指定使用的组件类型、运维能力的版本，加上后缀 `@version` 即可。在下面的例子里，你可以指定 `webservice@v1` 表示一直使用 `webservice`这个组件的 v1 版本。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
  - name: server
    type: webservice@v1
    properties:
      image: stefanprodan/podinfo:4.0.3
```

通过这种方式，系统管理员对组件类型和运维功能的变更就不会影响到你的应用，否则每次应用的更新都会使用最新的组件类型和运维功能。

## 应用版本

除了工作流字段，应用中的每个字段更新都会生成一个对应的版本快照。

* 查看版本快照

```shell
$ kubectl get apprev -l app.oam.dev/name=myapp
NAME       AGE
myapp-v1   54m
myapp-v2   53m
myapp-v3   18s
```

你可以在版本快照中获得应用所关联的所有信息，包括应用的字段以及对应的组件类型、运维能力等。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ApplicationRevision
metadata:
  labels:
    app.oam.dev/app-revision-hash: a74b4a514ba2fc08
    app.oam.dev/name: myapp
  name: myapp-v3
  namespace: default
  ...
spec:
  application:
    apiVersion: core.oam.dev/v1beta1
    kind: Application
    metadata:
      name: myapp
      namespace: default
      ...
    spec:
      components:
      - name: express-server
        properties:
          image: stefanprodan/podinfo:5.0.3
        type: webservice@v1
     ...
  componentDefinitions:
    webservice:
      apiVersion: core.oam.dev/v1beta1
      kind: ComponentDefinition
      metadata:
        name: webservice
        namespace: vela-system
        ...
      spec:
        schematic:
          cue:
            ...
  traitDefinitions:
    ...
```

## 应用版本对比

部署前版本对比（Live-diff）功能可以让你不用真的对运行时集群进行操作，在本地预览即将部署的版本和线上版本的差异性，并进行确认。

预览所提供的信息，会包括应用部署计划的新增、修改和移除等信息，同时也包括其中的组件和运维特征的相关信息。

假设你的新应用部署计划如下，包含镜像的变化：

```yaml
# new-app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
    - name: express-server
      type: webservice@v1
      properties:
        image: crccheck/hello-world # 变更镜像
```

然后运行 `版本对比` 功能，使用如下命令：

```shell
vela live-diff -f new-app.yaml -r vela-app-v1
```

* 通过 `-r` 或 `--revision` 参数，指定要比较的版本名称。
* 通过 `-c` 或 `--context` 指定对比差异的上下文行数。

通过 `vela live-diff -h` 查看更多参数用法。

<details><summary> 点击查看对比结果 </summary>

```bash
---
# Application (myapp) has been modified(*)
---
  apiVersion: core.oam.dev/v1beta1
  kind: Application
  metadata:
-   annotations:
-     kubectl.kubernetes.io/last-applied-configuration: |
-       {"apiVersion":"core.oam.dev/v1beta1","kind":"Application","metadata":{"annotations":{},"name":"myapp","namespace":"default"},"spec":{"components":[{"externalRevision":"express-server-v1","name":"express-server","properties":{"image":"stefanprodan/podinfo:4.0.3"},"type":"webservice"}]}}
    creationTimestamp: null
-   finalizers:
-   - app.oam.dev/resource-tracker-finalizer
    name: myapp
    namespace: default
  spec:
    components:
-   - externalRevision: express-server-v1
-     name: express-server
+   - name: express-server
      properties:
-       image: stefanprodan/podinfo:4.0.3
-     type: webservice
+       image: crccheck/hello-world
+     type: webservice@v1
  status:
    rollout:
      batchRollingState: ""
      currentBatch: 0
      lastTargetAppRevision: ""
      rollingState: ""
      upgradedReadyReplicas: 0
      upgradedReplicas: 0

---
## Component (express-server) has been modified(*)
---
  apiVersion: apps/v1
  kind: Deployment
  metadata:
-   annotations:
-     kubectl.kubernetes.io/last-applied-configuration: |
-       {"apiVersion":"core.oam.dev/v1beta1","kind":"Application","metadata":{"annotations":{},"name":"myapp","namespace":"default"},"spec":{"components":[{"externalRevision":"express-server-v1","name":"express-server","properties":{"image":"stefanprodan/podinfo:4.0.3"},"type":"webservice"}]}}
+   annotations: {}
    labels:
      app.oam.dev/appRevision: ""
      app.oam.dev/component: express-server
      app.oam.dev/name: myapp
      app.oam.dev/resourceType: WORKLOAD
-     workload.oam.dev/type: webservice
+     workload.oam.dev/type: webservice-v1
    name: express-server
    namespace: default
  spec:
    selector:
      matchLabels:
        app.oam.dev/component: express-server
    template:
      metadata:
        labels:
          app.oam.dev/component: express-server
          app.oam.dev/revision: KUBEVELA_COMPONENT_REVISION_PLACEHOLDER
      spec:
        containers:
-       - image: stefanprodan/podinfo:4.0.3
+       - image: crccheck/hello-world
          name: express-server
          ports:
          - containerPort: 80
```

</details>

未来，我们也计划将应用版本快照集成到 CLI/Dashboard 等工具中，以此实现快照恢复等更多功能。
