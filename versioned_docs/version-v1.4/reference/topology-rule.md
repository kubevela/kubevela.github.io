---
title: Config resource relationship Rule
---

The topology graph of VelaUX can show the resource tree of an application. As shown in this picture.

![image](../resources/tree.png)

## Mechanism

There have been some built-in rules in system to specify the relationship between two types of resource. System will search all children resources by these rules.

For example, the built-in rules has defined the [Deployment's](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) children resource only can be [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/), so when show the children resource of one deployment Vela will only care about the replicaSet.
Vela will list all replicaSet in the same namespace with deployment and filter out those ownerReference isn't this deployment.


## Add relationship rules

The built-in rules is limited, you can add a customized rule by create a configmap like this:

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

First, this configmap should  have the special label `"rules.oam.dev/resources": "true"` the data key `rules` defined a list of relationship rules.
One relationship rule define what children type a parent can have.
In this example above, the parent type is `Cloneset` in group `apps.kruise.io`, his children resource type is `v1/Pod`
All customize rules specified in these configmaps would be merged with built-in rules and take effect in searching children resources.