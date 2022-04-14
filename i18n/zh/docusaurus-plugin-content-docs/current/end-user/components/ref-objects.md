---
title: 分发引用的外部 Kubernetes 对象
---

在一些场景下，你可能会想要引用已有的 Kubernetes 对象并将它们分发到其他位置，比如
- 将管控集群中的密钥复制到子集群中。
- 将验证集群中的工作负载部署到生产集群中。
- 使用 Kubernetes 原生的 apiserver 作为控制面，将所有的 Kubernetes 对象存储在外部数据库中。然后通过引用这些资源，将它们下发到真正运行负载的子集群中。

> 这篇文档需要你先了解如何进行多集群应用的部署。你可以参考 [多集群应用交付](../../case-studies/multi-cluster) 章节.

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


