---
title: 引用资源做多集群分发
---

:::tip
开始这部分之前需要你先了解使用如何进行多集群应用的部署。你可以参考 [多集群应用交付](../../case-studies/multi-cluster.md) 章节了解相关基础细节.

⚠️ 重要： 自 KubeVela v1.10 起，在 ref-objects 中引用 Kubernetes 资源时，必须显式指定非默认组（core.oam.dev 和空组）资源的 group 字段。例如，属于 apps 组的 Deployment 资源，需要显式声明 group 字段。
:::

你可以使用 KubeVela 引用已有的 Kubernetes 对象并将它们分发到其他位置来完成以下场景：

- 将管控集群中的密钥复制到子集群中。
- 将验证集群中的工作负载部署到生产集群中。
- 使用 Kubernetes 原生的 apiserver 作为控制面，将所有的 Kubernetes 对象存储在外部数据库中。然后通过引用这些资源，将它们下发到真正运行负载的子集群中。

## 在组件中引用已有的 Kubernetes 对象

为了在组件中使用已有的 Kubernetes 对象，你需要使用 `ref-objects` 类型的组件，并在参数中声明你想要引用的资源。例如，在下面的例子中，命名空间 `examples` 中的密钥 `image-credential-to-copy` 会被作为组件的源数据，然后你可以使用 Topology 策略来将它复制分发到杭州集群中。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ref-objects-example
  namespace: examples
spec:
  components:
    - name: image-pull-secrets
      type: ref-objects
      properties:
        objects:
          - resource: secret
            name: image-credential-to-copy
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
```

### 通过 URL 地址引用对象

通常我们可以看到社区已经存在的 YAML 地址，你可以通过引用对象类型安装这些 YAML。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-app
  namespace: default
spec:
  components:
  - name: busybox
    type: ref-objects
    properties:
      urls: ["https://gist.githubusercontent.com/Somefive/b189219a9222eaa70b8908cf4379402b/raw/e603987b3e0989e01e50f69ebb1e8bb436461326/example-busybox-deployment.yaml"]
```

## *ref-objects* 类型组件的细节

声明需要引用资源最直接的方法是使用 `resource: secret` 或 `resource: deployment` 这样的方式来确定引用资源的类型。如果 `name` 和 `labelSelector` 都没有被设置，那么应用将会在它的命名空间下尝试寻找与和组件名称一致的资源。你也可以显式地指定 `name` 和 `namespace` 来确定需要引用的资源。

除了 `name` 和 `namespace`，你还可以使用 `cluster` 字段让应用组件去引用子集群中的资源。你也可以使用 `labelSelector` 来筛选资源，而不是直接用 `name` 去确定目标资源。

在下面的样例中，应用会选择在 *hangzhou-1* 集群的 *examples* 命名空间中，所有符合声明标签要求的 Deployment。然后应用会将这些 Deployments 复制到 *hangzhou-2* 集群中。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ref-objects-duplicate-deployments
  namespace: examples
spec:
  components:
    - name: duplicate-deployment
      type: ref-objects
      properties:
        objects:
          - resource: deployment
            group: apps
            cluster: hangzhou-1
            # select all deployment in the `examples` namespace in cluster `hangzhou-1` that matches the labelSelector
            labelSelector:
              need-duplicate: "true"
  policies:
    - name: topology-hangzhou-2
      type: topology
      properties:
        clusters: ["hangzhou-2"]
```

> 在一些场景下，你可能想要限制应用能够引用资源的范围，你可以通过在 KubeVela 控制器中设置 `--ref-objects-available-scope` 为 `namespace` 或者 `cluster` 来限制只在同命名空间或者同一集群内引用资源。

## 在 ref-objects 类型组件内使用运维特征

*ref-objects* 类型的组件同样也可以使用运维特征。其主体工作负载会被隐式地设置为引用资源列表中的第一个资源。所有作用在工作负载上的运维特征都会指向该资源。 如下所示的例子展示了如何为引用的 Deployment 设置副本数，并下发到 hangzhou 集群中。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ref-objects-multiple-resources
  namespace: examples
spec:
  components:
    - name: nginx-ref-multiple-resources
      type: ref-objects
      properties:
        objects:
          - resource: deployment
            group: apps
          - resource: service
      traits:
        - type: scaler
          properties:
            replicas: 3
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
```

到此你已经完成了交付 Kubernetes 原生资源的学习！

## Working with Trait

The *ref-objects* typed component can also be used together with traits. The implicit main workload is the first referenced object and trait patch will be applied on it. The following example demonstrate how to set the replica number for the referenced deployment while deploying it in hangzhou clusters.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ref-objects-multiple-resources
  namespace: examples
spec:
  components:
    - name: nginx-ref-multiple-resources
      type: ref-objects
      properties:
        objects:
          - resource: deployment
            group: apps
          - resource: service
      traits:
        - type: scaler
          properties:
            replicas: 3
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
```

There are several commonly used trait that could be used together with the ref-objects, particularly for Deployment.

### Container Image

The `container-image` trait can be used to change the default image settings declared in the original deployment.

By default, the `container-image` will replace the original image in the main container (the container uses the name of the component).
```yaml
traits:
- type: container-image
  properties:
    image: busybox-1.34.0
```

You can modify other containers by setting the `containerName` field.
```yaml
traits:
- type: container-image
  properties:
    image: busybox-1.34.0
    containerName: sidecar-nginx
```

You can also modify the ImagePullPolicy as well.
```yaml
traits:
- type: container-image
  properties:
    image: busybox-1.34.0
    containerName: sidecar-nginx
    imagePullPolicy: IfNotPresent
```

Multiple container patch is also available.
```yaml
traits:
- type: container-image
  properties:
    containers:
      - containerName: busybox
        image: busybox-1.34.0
        imagePullPolicy: IfNotPresent
      - containerName: sidecar-nginx
        image: nginx-1.20
```

### Command

The `command` trait can be used to modify the original running command in deployment's pods.
```yaml
traits:
- type: command
  properties:
    command: ["sleep", "8640000"]
```

The above configuration can be used to patch the main container (the container that uses the name of the component). If you would like to modify another container, you could use the field `containerName`.
```yaml
traits:
- type: command
  properties:
    command: ["sleep", "8640000"]
    containerName: sidecar-nginx
```

If you want to replace the existing args in the container, instead of the command, use the `args` parameter.
```yaml
traits:
- type: command
  properties:
    args: ["86400"]
```

If you want to append/delete args to the existing args, use the `addArgs`/`delArgs` parameter. This can be useful if you have lots of args to be managed.
```yaml
traits:
- type: command
  properties:
    addArgs: ["86400"]
```
```yaml
traits:
- type: command
  properties:
    delArgs: ["86400"]
```

You can also configure commands in multiple containers.
```yaml
traits:
- type: command
  properties:
    containers:
      - containerName: busybox
        command: ["sleep", "8640000"]
      - containerName: sidecar-nginx
        args: ["-q"]
```

### Environment Variable

With the trait `env`, you can easily manipulate the declared environment variables.

For example, the following usage shows how to set multiple environment variables in the main container (the container uses the component's name). If any environment variable does not exist, it will be added. If exists, it will be updated.
```yaml
traits:
- type: env
  properties:
    env:
      key_first: value_first
      key_second: value_second
```

You can remove existing environment variables by setting the `unset` field.
```yaml
traits:
- type: env
  properties:
    unset: ["key_existing_first", "key_existing_second"]
```

If you would like to clear all the existing environment variables first, and then add new variables, use `replace: true`.
```yaml
traits:
- type: env
  properties:
    env:
      key_first: value_first
      key_second: value_second
    replace: true
```

If you want to modify the environment variable in other containers, use the `containerName` field.
```yaml
traits:
- type: env
  properties:
    env:
      key_first: value_first
      key_second: value_second
    containerName: sidecar-nginx
```

You can set environment variables in multiple containers as well.
```yaml
traits:
- type: env
  properties:
    containers:
      - containerName: busybox
        env:
          key_for_busybox_first: value_first
          key_for_busybox_second: value_second
      - containerName: sidecar-nginx
        env:
          key_for_nginx_first: value_first
          key_for_nginx_second: value_second
```

### Labels & Annotations

To add/update/remove labels or annotations for the workload (like Kubernetes Deployment), use the `labels` or `annotations` trait.

```yaml
traits:
  # the `labels` trait will add/delete label key/value pair to the
  # labels of the workload and the template inside the spec of the workload (if exists)
  # 1. if original labels contains the key, value will be overridden
  # 2. if original labels do not contain the key, value will be added
  # 3. if original labels contains the key and the value is null, the key will be removed
  - type: labels
    properties:
      added-label-key: added-label-value
      label-key: modified-label-value
      to-delete-label-key: null
```

```yaml
traits:
  # the `annotations` trait will add/delete annotation key/value pair to the
  # labels of the workload and the template inside the spec of the workload (if exists)
  # 1. if original annotations contains the key, value will be overridden
  # 2. if original annotations do not contain the key, value will be added
  # 3. if original annotations contains the key and the value is null, the key will be removed
  - type: annotations
    properties:
      added-annotation-key: added-annotation-value
      annotation-key: modified-annotation-value
      to-delete-annotation-key: null
```

### JSON Patch & JSON Merge Patch

Except for the above trait, a more powerful but more complex way to modify the original resources is to use the `json-patch` or `json-merge-patch` trait. They follow the [RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902) and [RFC 7386](https://datatracker.ietf.org/doc/html/rfc7386) respectively. Usage examples are shown below.

```yaml
 traits:
# the json patch can be used to add, replace and delete fields
# the following part will
# 1. add `deploy-label-key` to deployment labels
# 2. set deployment replicas to 3
# 3. set `pod-label-key` to `pod-label-modified-value` in pod labels
# 4. delete `to-delete-label-key` in pod labels
# 5. add sidecar container for pod
- type: json-patch
  properties:
    operations:
      - op: add
        path: "/spec/replicas"
        value: 3
      - op: replace
        path: "/spec/template/metadata/labels/pod-label-key"
        value: pod-label-modified-value
      - op: remove
        path: "/spec/template/metadata/labels/to-delete-label-key"
      - op: add
        path: "/spec/template/spec/containers/1"
        value:
          name: busybox-sidecar
          image: busybox:1.34
          command: ["sleep", "864000"]
```

```yaml
traits:
# the json merge patch can be used to add, replace and delete fields
# the following part will
# 1. add `deploy-label-key` to deployment labels
# 2. set deployment replicas to 3
# 3. set `pod-label-key` to `pod-label-modified-value` in pod labels
# 4. delete `to-delete-label-key` in pod labels
# 5. reset `containers` for pod
- type: json-merge-patch
  properties:
    metadata:
      labels:
        deploy-label-key: deploy-label-added-value
    spec:
      replicas: 3
      template:
        metadata:
          labels:
            pod-label-key: pod-label-modified-value
            to-delete-label-key: null
        spec:
          containers:
            - name: busybox-new
              image: busybox:1.34
              command: ["sleep", "864000"]
```

## 引用对象的多集群差异化部署

通过 `override` 策略与负责差异化配置的运维特征相结合，可以完成引用对象的多集群差异化部署。

我们以一个 Kubernetes Deployment YAML 为例：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: demo
  name: demo
  namespace: demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: demo
  template:
    metadata:
      labels:
        app: demo
    spec:
      containers:
      - image: oamdev/testapp:v1
        name: demo
```

通过指定 `topology` 策略来描述部署的集群。

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: cluster-beijing
  namespace: demo
type: topology
properties:
  clusters: ["<clusterid1>"]
---
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: cluster-hangzhou
  namespace: demo
type: topology
properties:
  clusters: ["<clusterid2>"]
```

然后我们通过 `override` 策略来差异化配置运维特征，即给不同的环境配置不同的运维特征。通过这些运维特征去修改引用对象的参数。

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: override-replic-beijing
  namespace: demo
type: override
properties:
  components:
  - name: "demo"
    traits:
    - type: scaler
      properties:
        replicas: 3
---
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: override-replic-hangzhou
  namespace: demo
type: override
properties:
  components:
  - name: "demo"
    traits:
    - type: scaler
      properties:
        replicas: 5
```

然后，定义一个使用差异化配置做多集群部署的工作流：

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: Workflow
metadata:
  name: deploy-demo
  namespace: demo
steps:
  - type: deploy
    name: deploy-bejing
    properties:
      policies: ["override-replic-beijing", "cluster-beijing"]
  - type: deploy
    name: deploy-hangzhou
    properties:
      policies: ["override-replic-hangzhou", "cluster-hangzhou"]
```

最终，我们将这些对象组合起来，并且通过部署一个执行计划（Application） 来触发部署：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: demo
  namespace: demo
  annotations:
    app.oam.dev/publishVersion: version1
spec:
  components:
    - name: demo
      type: ref-objects
      properties:
        objects:
          - apiVersion: apps/v1
            kind: Deployment
            name: demo
  workflow:
    ref: deploy-demo
```

通过 KubeVela，你可以引用任意的 Kubernetes 资源，然后做多集群分发和差异化配置。