---
title: Reuse Policies and Workflows
---

When several Applications deploy to the same clusters in the same way, write the policies and the workflow once, as standalone `Policy` and `Workflow` objects, and refer to them from each Application. It builds on [Deploy to Multiple Clusters](./multi-cluster.md) and [Override Configuration per Cluster](./multi-cluster-override.md).

:::caution
An Application can only refer to a Policy in its own namespace. A Workflow is looked up in the Application's namespace first, then in the system definition namespace (`vela-system` unless `--system-definition-namespace` sets another).
:::

## Write the shared objects

A topology, an override and a workflow that deploys with both after a manual approval:

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: topology-hangzhou-clusters
  namespace: examples
type: topology
properties:
  clusterLabelSelector:
    region: hangzhou
---
apiVersion: core.oam.dev/v1alpha1
kind: Policy
metadata:
  name: override-high-availability-webservice
  namespace: examples
type: override
properties:
  components:
    - type: webservice
      traits:
        - type: scaler
          properties:
            replicas: 3
---
apiVersion: core.oam.dev/v1alpha1
kind: Workflow
metadata:
  name: make-release-in-hangzhou
  namespace: examples
steps:
  - type: deploy
    name: deploy-hangzhou
    properties:
      auto: false
      policies: ["override-high-availability-webservice", "topology-hangzhou-clusters"]
```

## Refer to them from an Application

Set `workflow.ref` to the Workflow's name. The `deploy` step's `policies` find the standalone Policy objects by name:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: external-policies-and-workflow
  namespace: examples
spec:
  components:
    - name: nginx-external-policies-and-workflow
      type: webservice
      properties:
        image: nginx
  workflow:
    ref: make-release-in-hangzhou
```

## Replace a shared policy in one Application

A policy name is looked up in the Application first, and in the standalone Policy objects only if the Application has none by that name. So a policy in the Application with the same name as a shared one replaces it, silently: nothing tells you the shared one was skipped.

You can use that on purpose. This Application reuses the shared topology and workflow, but runs 5 replicas instead of 3 by declaring its own `override-high-availability-webservice`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: nginx-stable-ultra
  namespace: examples
spec:
  components:
    - name: nginx-stable-ultra
      type: webservice
      properties:
        image: nginx:stable
  policies:
    - name: override-high-availability-webservice
      type: override
      properties:
        components:
          - type: webservice
            traits:
              - type: scaler
                properties:
                  replicas: 5
  workflow:
    ref: make-release-in-hangzhou
```

## Control when a shared change rolls out

An Application's revision includes the standalone Policy and Workflow objects it uses. To decide when a change to them reaches each Application, set the `app.oam.dev/publishVersion` annotation: the Application keeps running with the objects it was published with until you set a new value. See [Application Version Control](../version-control.md).
