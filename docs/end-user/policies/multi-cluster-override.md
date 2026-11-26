---
title: Override Configuration per Cluster
---

An `override` policy changes a component's configuration for some clusters: a different image, more replicas, an extra trait. It builds on [Deploy to Multiple Clusters](./multi-cluster.md), and the examples use the clusters and labels set up there.

:::caution
A `deploy` step needs at least one `topology` policy. With only `override` policies it deploys nothing, and reports no error.
:::

An override has no destination of its own. It changes what the `topology` policies in the same `deploy` step send. If you don't need a topology, write the configuration in the component instead.

## Change a component in some clusters

This Application deploys the default nginx to the `local` cluster, then deploys it to the hangzhou clusters with the `nginx:1.20` image and 3 replicas:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: deploy-with-override
  namespace: examples
spec:
  components:
    - name: nginx-with-override
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
    - name: override-nginx-legacy-image
      type: override
      properties:
        components:
          - name: nginx-with-override
            properties:
              image: nginx:1.20
    - name: override-high-availability
      type: override
      properties:
        components:
          - type: webservice
            traits:
              - type: scaler
                properties:
                  replicas: 3
  workflow:
    steps:
      - type: deploy
        name: deploy-local
        properties:
          policies: ["topology-local"]
      - type: deploy
        name: deploy-hangzhou
        properties:
          policies: ["topology-hangzhou-clusters", "override-nginx-legacy-image", "override-high-availability"]
```

The two overrides pick their components differently:

* `override-nginx-legacy-image` names one component (`name: nginx-with-override`) and changes its `image`.
* `override-high-availability` matches every component of `type: webservice` and adds a `scaler` trait to each.

## Add and select components

An override can also add components that only some clusters get, and `selector` picks which components a `deploy` step sends at all.

This Application deploys `nginx:1.20` to the `local` cluster, then deploys two webservices, `nginx` and `nginx:stable`, to the hangzhou clusters:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: advance-override
  namespace: examples
spec:
  components:
    - name: nginx-advance-override-legacy
      type: webservice
      properties:
        image: nginx:1.20
    - name: nginx-advance-override-latest
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
    - name: override-nginx-legacy
      type: override
      properties:
        selector: ["nginx-advance-override-legacy"]
    - name: override-nginx-latest
      type: override
      properties:
        selector: ["nginx-advance-override-latest", "nginx-advance-override-stable"]
        components:
          - name: nginx-advance-override-stable
            type: webservice
            properties:
              image: nginx:stable
  workflow:
    steps:
      - type: deploy
        name: deploy-local
        properties:
          policies: ["topology-local", "override-nginx-legacy"]
      - type: deploy
        name: deploy-hangzhou
        properties:
          policies: ["topology-hangzhou-clusters", "override-nginx-latest"]
```

`override-nginx-latest` adds the `nginx-advance-override-stable` component, which isn't in `spec.components`, and its `selector` keeps only the latest and stable components for the hangzhou deploy.

## Next steps

* Share `override` policies between Applications: [Reuse Policies and Workflows](./multi-cluster-reuse.md).
* All the fields of the `override` and `topology` policies: [Built-in Policy Type](./references.md).
