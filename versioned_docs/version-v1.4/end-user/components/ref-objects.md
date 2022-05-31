---
title: Multi-cluster Distribution
---

> This section requires you to know the basics about how to deploy multi-cluster application with policy and workflow. You can refer to [Multi-cluster Delivery](../../case-studies/multi-cluster) for container images, they're working in the same way.

You can reference and distribute existing Kubernetes objects with KubeVela in the following scenarios:

- Copying secrets from the hub cluster into managed clusters.
- Promote deployments from canary clusters into production clusters.
- Using Kubernetes apiserver as the control plane and storing all Kubernetes objects data in external databases. Then dispatch those data into real Kuberenetes managed clusters.



### Refer to Existing Kubernetes Objects in Component

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

### Details for the *ref-objects* typed component

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

### Working with Trait

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