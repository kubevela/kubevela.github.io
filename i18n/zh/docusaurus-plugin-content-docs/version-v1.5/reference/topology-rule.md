---
title: 配置资源类型关系规则
--- 

资源类型关系规则主要规定了：一个类型的 Kubernetes 资源可能包含哪些类型的子资源。它的主要作用是帮助 KubeVela 建立应用所纳管资源的拓扑关系。举例来说，系统中已经内置了这样的一条关系规则：[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) 类型的资源下面的子资源只可能是 [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)，而 ReplicaSet 的子资源只可能是 [Pod](https://kubernetes.io/docs/concepts/workloads/pods/)。
这样当创建了一个 Deployment 为工作负载的 KubeVela 应用后，在 VelaUX 的资源拓扑图页面查看该应用的拓扑关系视图，KubeVela 就会根据上面的资源类型关系规则，先列出和 Deployment 同一 namespace 的所有 ReplicaSet 并过滤掉 OwnerReference 不是该 Deployment 的结果，进一步经过一样的过程找出 ReplicaSet 下面的 Pod，从而建立起整个应用下面纳管资源的拓扑层级关系。

总体上这些资源类型关系规则主要会在以下场景中被用到：

- 在 VelaUX 的资源拓扑视图中用来展示资源之间的拓扑关系。下面就是一个资源拓扑图的例子：

![image](../resources/tree.png)
  
- 通过 cli 使用 `vela port-forward`, `vela logs`, `vela exec` 以及 `vela status --endpoint` 或者在 VelaUX 上查看应用下实例的日志或访问端口等功能时，用来发现应用下面的 pod 或 service。

## 添加关系规则

系统所内置的资源类型关系规则是有限的，用户可以通过在管控集群创建一个 Kubernetes `configmap` 来为系统增加新的关系规则。如下所示：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: clone-set-relation
  namespace: vela-system
  annotations:
   "rules.oam.dev/resource-format": "yaml"
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

我们看到，首先这个 configmap 必须包含一个特殊的标签 `"rules.oam.dev/resources": "true"`。只有包含一个这样标签的 configmap 才会被 KubeVela 识别为是一个关于资源类型关系规则的定义。同时在这个例子中我们还通过一个 `"rules.oam.dev/resource-format": "yaml"` 注解定义了下面 `data.rules` 字段所定义的具体规则是通过 YAML 的格式定义的，除了使用 YAML 格式，你还可以使用 JSON 格式来定义这些规则，如下所示：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: clone-set-relation
  namespace: vela-system
  annotations:
   "rules.oam.dev/resource-format": "json"
  labels:
    "rules.oam.dev/resources": "true"
data:
  rules: |-
   [
     {
       "parentResourceType": {
           "group": "apps.kruise.io",
           "kind": "CloneSet"
       },
       "childrenResourceType": [
           {
               "apiVersion": "v1",
               "kind": "Pod"
           }
       ]
     }
  ]
```

上面两个 configmap 作用完全等价。

在这个资源类型关系规则 configmap 的数据字段（`data.rules`） 中定义的必须是一个规则列表，单个规则包含了一个父资源类型和一组可能的子资源类型。 在这个例子中，我们定义了一个 `apps.kruise.io` 组下的 `CloneSet` 类型资源的子资源是 `v1/Pod`，这样在展示 CloneSet 的子资源时，就会定向去查找 Pod 类型资源。 

所有这些被 configmap 所定义的规则，会和内置规则合并。

## 集成在插件当中

通常一个 KubeVela [插件](../platform-engineers/addon/intro) 中可能包含了各种模块化能力 （Definition），同时安装插件时也会安装背后支撑这些模块化能力的 Kubernetes CRD operator。而这些 CRD 的所定义的资源类型和其他资源的关系通常是没有提前内置在系统中的，所以你可能就会遇到这些 CRD 下面的资源没有办法展示在资源拓扑图中，或者无法直接查看 CRD 下面 pod 的容器日志等问题。这时你就可以通过在插件中添加一个资源类型关系规则的 configmap ，在插件启用时为系统添加相应的规则。具体方法是在插件的应用模版文件中的 `outputs` 定义一个资源类型关系的 configmap。例如：

```cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		
	}
	... 
}

outputs: resourceTree: {
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: {
		name:      "resource-tree"
		namespace: "vela-system"
		labels: {
			"rules.oam.dev/resources":       "true"
			"rules.oam.dev/resource-format": "json"
		}
	}
	data: rules: json.Marshal(_rules)
}

_rules: {...}
```

具体请参考[文档](../platform-engineers/addon/addon-cue#auxiliary-resources) 。