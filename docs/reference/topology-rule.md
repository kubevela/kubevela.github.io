---
title: Resource Topology
---

The resource topology graph of VelaUX can automatically show the resource tree of an application for any workloads including Helm charts and cloud resources.

![image](../resources/tree.png)

## Mechanism

By default, the connections in the resource graph rely on the [ownerReference mechanism](https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/), while it's also configurable for CRDs which don't have specific ownerReferences. The controller will search all child resources for one node according to these rules.

These rules can also reduce redundant resources for better performance. For example, one of the built-in rules has defined that a [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) will only have [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/) as its child, so when we draw the resource graph, it will only display resources whose type is ReplicaSet along with ownerReference info.

## Add more rules

The built-in rules is limited, you can add a customized rule by create a ConfigMap like this:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: clone-set-relation
  namespace: vela-system
  labels:
    "rules.oam.dev/resources": "true"
data:
  rules: |-
    - parentResourceType:
        group: apps.kruise.io
        kind: CloneSet
      childrenResourceType:
        - apiVersion: v1
          kind: Pod
```

1. The ConfigMap should have the special label `"rules.oam.dev/resources": "true"` the data key `rules` defined a list of relationship rules.
2. One relationship rule define what children type a parent can have.

In the example above, the parent type is `Cloneset` in group `apps.kruise.io`, his child resource type is `v1/Pod`
All customized rules specified in these configmaps would be merged with built-in rules and take effect in searching child resources.