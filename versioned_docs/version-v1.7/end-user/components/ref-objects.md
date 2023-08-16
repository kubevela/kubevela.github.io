---
title: Distribute Reference Objects
---

:::note
This section requires you to know the basics about how to deploy [multi-cluster application](../../case-studies/multi-cluster.md) with policy and workflow.
:::

You can reference and distribute existing Kubernetes objects with KubeVela in the following scenarios:

- Copying secrets from the hub cluster into managed clusters.
- Promote deployments from canary clusters into production clusters.
- Using Kubernetes apiserver as the control plane and storing all Kubernetes objects data in external databases. Then dispatch those data into real Kuberenetes managed clusters.

Besides, you can also refer to Kubernetes objects from remote URL links.

## Refer to Existing Kubernetes Objects in Component

### Refer to objects in cluster

To use existing Kubernetes objects in the component, you need to use the `ref-objects` typed component and declare which resources you want to refer to. For example, in the following example, the secret `image-credential-to-copy` in namespace `examples` will be taken as the source object for the component. Then you can use the topology policy to dispatch it into hangzhou clusters.

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

### Refer to objects from URL

If your source Kubernetes objects are from remote URLs, you can also refer to them in the component properties as follows. Your remote URL files could include multiple-resources as well.

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

## Details for the *ref-objects* typed component

The most simple way to specify resources is to directly use `resource: secret` or `resource: deployment` to describe the kind of resources. If no `name` or `labelSelector` is set, the application will try to find the resource with the same name as the component name in the application's namespace. You can also explicitly specify `name` and `namespace` for the target resource as well.

In addition to `name` and `namespace`, you can also specify the `cluster` field to let the application component refer to resources in managed clusters. You can also use the `labelSelector` to select resources in replace of finding resources by names.

In the following example, the application will select all deployments in the *hangzhou-1* cluster inside the *examples* namespace, which matches the desided labels. Then the application will copy these deployments into *hangzhou-2* cluster.

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

> In some cases, you might want to restrict the scope for the application to access resources. You can set the `--ref-objects-available-scope` to `namespace` or `cluster` in KubeVela controller's bootstrap parameter, to retrict the application to be only able to refer to the resources inside the same namespace or the same cluster.

## Override Configuration for Reference Objects

The [override policy](../../case-studies/multi-cluster.md#override-default-configurations-in-clusters) can be used to override properties defined in component and traits while the reference objects don't have those properties.

If you want to override configuration for the *ref-objects* typed component, you can use traits. The implicit main workload is the first referenced object and trait patch will be applied on it. The following example demonstrate how to set the replica number for the referenced deployment while deploying it in hangzhou clusters.

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

### Override Container Image

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

### Override Container Command

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

### Override Container Environment Variable

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

### Override Labels & Annotations

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

### Override by using JSON Patch & JSON Merge Patch

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

## Distribute Reference Objects with different configuration

The general idea is to using `override` policy to override traits. Then you can distribute reference objects with different traits for different clusters.

Assume we're distributing the following Deployment YAML to multi-clusters:

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

We can specify the following `topology` policies.

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

Then we can use `override` policy to override with different traits for the reference objects.

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

The workflow can be defined like:

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

As a result, we can combine them and trigger the final deploy by the following application:

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

With the help of KubeVela, you can reference and distribute any Kubernetes resources to multi clusters.