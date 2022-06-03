---
title: 配置拓扑树资源关系规则
---

VelaUX 的资源拓扑图能够展现一个应用所管理的全部资源的拓扑图情况。如下所示：

![image](../resources/tree.png)

## 原理

Vela 系统内置了一些资源映射规则，这些规则规定了一个类型的资源可能包含了哪些子资源，在展示资源拓扑树的时候，系统会根据这些规则搜寻子资源。
举例来说，系统规定了一个 [Deployment's](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) 类型的资源的资源只可能是 [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)，所以在展示一个 Deployment 的所有子资源时，Vela 会在这个 Deployment 的 namespace 下列出所有的 ReplicaSet 并过滤掉那些 `ownerReference` 不是指向该 Deployment 的结果。


## 添加关系规则
但系统所内置的规则是有限的，用户也可以通过配置如下的一个 configmap 来为系统增加新的规则。

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

 我们看到，首先这个 configmap 必须包含一个特殊的标签 `"rules.oam.dev/resources": "true"`，在数据字段中 `rules` 定义了一个规则列表，单个规则包含了一个父资源类型和一组子资源类型。
 在上面的例子中，我们定义了一个 `apps.kruise.io` 组下的 `CloneSet` 类型资源的子资源是 `v1/Pod`，这样在展示 CloneSet 的子资源时，就会定向去查找 Pod 类型资源。
 所有这些被 configmap 所定义的规则，会和内置规则合并，从而在展示资源拓扑图的时候生效。