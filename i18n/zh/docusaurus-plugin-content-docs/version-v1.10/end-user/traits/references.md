---
title: 内置运维特征列表
---

本文档将**按字典序**展示所有内置运维特征的参数列表。

> 本文档由[脚本](../../contributor/cli-ref-doc.md)自动生成，请勿手动修改，上次更新于 2025-10-18T11:52:31-07:00。

## Affinity

### 描述

为 pod 添加 affinity 和 toleration，它遵循路径“spec.template”中的 pod 规范。

> 目前这个运维特征默认在 VelaUX 处隐藏，你可以在 CLI 侧使用。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (affinity)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
        labels:
          label-key: label-value
          to-delete-label-key: to-delete-label-value
      traits:
        - type: affinity
          properties:
            podAffinity:
              preferred:
                - weight: 1
                  podAffinityTerm:
                    labelSelector:
                      matchExpressions:
                        - key: "secrity"
                          values: ["S1"]
                    namespaces: ["default"]
                    topologyKey: "kubernetes.io/hostname"
```

### 参数说明 (affinity)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 podAffinity | 指定 pod 的亲和性调度规则。 | [podAffinity](#podaffinity-affinity) | false |  
 podAntiAffinity | 指定 pod 的反亲和性调度规则。 | [podAntiAffinity](#podantiaffinity-affinity) | false |  
 nodeAffinity | 指定 pod 的节点亲和性调度规则。 | [nodeAffinity](#nodeaffinity-affinity) | false |  
 tolerations | Specify tolerant taint。 | [[]tolerations](#tolerations-affinity) | false |  


#### podAffinity (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 required | 指定 `requiredDuringSchedulingIgnoredDuringExecution` 字段，只有规则被满足时才执行调度。 | [[]required](#required-affinity) | false |  
 preferred | 指定 `preferredDuringSchedulingIgnoredDuringExecution` 字段，调度器会尝试寻找满足对应规则的节点。如果找不到匹配的节点，调度器仍然会调度该 Pod。 | [[]preferred](#preferred-affinity) | false |  


##### required (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 labelSelector |  | [labelSelector](#labelselector-affinity) | false |  
 namespaces |  | []string | false |  
 topologyKey |  | string | true |  
 namespaceSelector |  | [namespaceSelector](#namespaceselector-affinity) | false |  


##### labelSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### preferred (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 weight | 指定对应 podAffinityTerm 的权重。 | int | true |  
 podAffinityTerm | 指定一组 pod。 | [podAffinityTerm](#podaffinityterm-affinity) | true |  


##### podAffinityTerm (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 labelSelector |  | [labelSelector](#labelselector-affinity) | false |  
 namespaces |  | []string | false |  
 topologyKey |  | string | true |  
 namespaceSelector |  | [namespaceSelector](#namespaceselector-affinity) | false |  


##### labelSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


#### podAntiAffinity (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 required | 指定 `requiredDuringSchedulingIgnoredDuringExecution` 字段，只有规则被满足时才执行调度。 | [[]required](#required-affinity) | false |  
 preferred | 指定 `preferredDuringSchedulingIgnoredDuringExecution` 字段，调度器会尝试寻找满足对应规则的节点。如果找不到匹配的节点，调度器仍然会调度该 Pod。 | [[]preferred](#preferred-affinity) | false |  


##### required (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 labelSelector |  | [labelSelector](#labelselector-affinity) | false |  
 namespaces |  | []string | false |  
 topologyKey |  | string | true |  
 namespaceSelector |  | [namespaceSelector](#namespaceselector-affinity) | false |  


##### labelSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### preferred (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 weight | 指定对应 podAffinityTerm 的权重。 | int | true |  
 podAffinityTerm | 指定一组 pod。 | [podAffinityTerm](#podaffinityterm-affinity) | true |  


##### podAffinityTerm (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 labelSelector |  | [labelSelector](#labelselector-affinity) | false |  
 namespaces |  | []string | false |  
 topologyKey |  | string | true |  
 namespaceSelector |  | [namespaceSelector](#namespaceselector-affinity) | false |  


##### labelSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


#### nodeAffinity (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 required | 指定 `requiredDuringSchedulingIgnoredDuringExecution` 字段，只有规则被满足时才执行调度。 | [required](#required-affinity) | false |  
 preferred | 指定 `preferredDuringSchedulingIgnoredDuringExecution` 字段，调度器会尝试寻找满足对应规则的节点。如果找不到匹配的节点，调度器仍然会调度该 Pod。 | [[]preferred](#preferred-affinity) | false |  


##### required (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 nodeSelectorTerms | 指定一组节点选择器。 | [[]nodeSelectorTerms](#nodeselectorterms-affinity) | true |  


##### nodeSelectorTerms (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  
 matchFields |  | [[]matchFields](#matchfields-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" or "Gt" or "Lt" | false | In 
 values |  | []string | false |  


##### matchFields (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" or "Gt" or "Lt" | false | In 
 values |  | []string | false |  


##### preferred (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 weight | Specify weight associated with matching the corresponding nodeSelector。 | int | true |  
 preference | Specify a node selector。 | [preference](#preference-affinity) | true |  


##### preference (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  
 matchFields |  | [[]matchFields](#matchfields-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" or "Gt" or "Lt" | false | In 
 values |  | []string | false |  


##### matchFields (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" or "Gt" or "Lt" | false | In 
 values |  | []string | false |  


#### tolerations (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | false |  
 operator |  | "Equal" or "Exists" | false | Equal 
 value |  | string | false |  
 effect |  | "NoSchedule" or "PreferNoSchedule" or "NoExecute" | false |  
 tolerationSeconds | 指定 toleration 的时间周期。 | int | false |  


## Annotations

### 描述

Add annotations on your workload. If it generates pod or job, add same annotations for generated pods。

### 适用于组件类型

所有组件类型。


### 示例 (annotations)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: labels
          properties:
            "release": "stable"
        - type: annotations
          properties:
            "description": "web application"
```

### 参数说明 (annotations)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 \- |  | map[string]:(null&#124;string) | true |  


## Command

### 描述

为 pod 添加命令，它遵循路径“spec.template”中的 pod 规范。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (command)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: sidecar
          properties:
            name: sidecar-nginx
            image: nginx
        - type: command
          properties:
            # you can use command to control multiple containers by filling `containers`
            # NOTE: in containers, you must set the container name for each container
            containers:
              - containerName: busybox
                command: ["sleep", "8640000"]
              - containerName: sidecar-nginx
                args: ["-q"]
```

### 参数说明 (command)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
  |  | [PatchParams](#patchparams-command) or [type-option-2](#type-option-2-command) | false |  


#### PatchParams (command)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 command | Specify the command to use in the target container, if not set, it will not be changed。 | null | true |  
 args | Specify the args to use in the target container, if set, it will override existing args。 | null | true |  
 addArgs | Specify the args to add in the target container, existing args will be kept, cannot be used with `args`。 | null | true |  
 delArgs | Specify the existing args to delete in the target container, cannot be used with `args`。 | null | true |  


#### type-option-2 (command)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containers | Specify the commands for multiple containers。 | [[]containers](#containers-command) | true |  


##### containers (command)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 command | Specify the command to use in the target container, if not set, it will not be changed。 | null | true |  
 args | Specify the args to use in the target container, if set, it will override existing args。 | null | true |  
 addArgs | Specify the args to add in the target container, existing args will be kept, cannot be used with `args`。 | null | true |  
 delArgs | Specify the existing args to delete in the target container, cannot be used with `args`。 | null | true |  


## Container-Image

### 描述

Set the image of the container。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (container-image)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: sidecar
          properties:
            name: sidecar-nginx
            image: nginx
        - type: container-image
          properties:
            # you can use container-image to control multiple containers by filling `containers`
            # NOTE: in containers, you must set the container name for each container
            containers:
              - containerName: busybox
                image: busybox-1.34.0
                imagePullPolicy: IfNotPresent
              - containerName: sidecar-nginx
                image: nginx-1.20
```

### 参数说明 (container-image)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
  |  | [PatchParams](#patchparams-container-image) or [type-option-2](#type-option-2-container-image) | false |  


#### PatchParams (container-image)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 image | Specify the image of the container。 | string | true |  
 imagePullPolicy | Specify the image pull policy of the container。 | "" or "IfNotPresent" or "Always" or "Never" | false | empty 


#### type-option-2 (container-image)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containers | Specify the container image for multiple containers。 | [[]containers](#containers-container-image) | true |  


##### containers (container-image)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 image | Specify the image of the container。 | string | true |  
 imagePullPolicy | Specify the image pull policy of the container。 | "" or "IfNotPresent" or "Always" or "Never" | false | empty 


## Container-Ports

### 描述

Expose on the host and bind the external port to host to enable web traffic for your component。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (container-ports)

It's used to define Pod networks directly. hostPort routes the container's port directly to the port on the scheduled node, so that you can access the Pod through the host's IP plus hostPort.
Don't specify a hostPort for a Pod unless it is absolutely necessary(run `DaemonSet` service). When you bind a Pod to a hostPort, it limits the number of places the Pod can be scheduled, because each <hostIP, hostPort, protocol> combination must be unique. If you don't specify the hostIP and protocol explicitly, Kubernetes will use 0.0.0.0 as the default hostIP and TCP as the default protocol.
If you explicitly need to expose a Pod's port on the node, consider using `expose` or `gateway` trait, or exposeType and ports parameter of `webservice` component before resorting to `container-ports` trait.
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        cpu: "0.5"
        exposeType: ClusterIP
        image: busybox
        memory: 1024Mi
        ports:
          - expose: false
            port: 80
            protocol: TCP
          - expose: false
            port: 801
            protocol: TCP
      traits:
        - type: container-ports
          properties:
            # you can use container-ports to control multiple containers by filling `containers`
            # NOTE: in containers, you must set the container name for each container
            containers:
              - containerName: busybox
                ports:
                  - containerPort: 80
                    protocol: TCP
                    hostPort: 8080
```

### 参数说明 (container-ports)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
  |  | [PatchParams](#patchparams-container-ports) or [type-option-2](#type-option-2-container-ports) | false |  


#### PatchParams (container-ports)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 ports | Specify ports you want customer traffic sent to。 | [[]ports](#ports-container-ports) | true |  


##### ports (container-ports)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerPort | 要暴露的 IP 端口号。 | int | true |  
 protocol | 端口协议类型 UDP， TCP， 或者 SCTP。 | "TCP" or "UDP" or "SCTP" | false | TCP 
 hostPort | Number of port to expose on the host。 | int | false |  
 hostIP | What host IP to bind the external port to。 | string | false |  


#### type-option-2 (container-ports)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containers | Specify the container ports for multiple containers。 | [[]containers](#containers-container-ports) | true |  


##### containers (container-ports)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 ports | Specify ports you want customer traffic sent to。 | [[]ports](#ports-container-ports) | true |  


##### ports (container-ports)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerPort | 要暴露的 IP 端口号。 | int | true |  
 protocol | 端口协议类型 UDP， TCP， 或者 SCTP。 | "TCP" or "UDP" or "SCTP" | false | TCP 
 hostPort | Number of port to expose on the host。 | int | false |  
 hostIP | What host IP to bind the external port to。 | string | false |  


## Cpuscaler

### 描述

Automatically scale the component based on CPU usage。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps



### 示例 (cpuscaler)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: nginx
      traits:
        - type: cpuscaler
          properties:
            min: 1
            max: 10
            cpuUtil: 60
```

### 参数说明 (cpuscaler)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 min | 能够将工作负载缩容到的最小副本个数。 | int | false | 1 
 max | 能够将工作负载扩容到的最大副本个数。 | int | false | 10 
 cpuUtil | 每个容器的平均 CPU 利用率 例如, 50 意味者 CPU 利用率为 50%。 | int | false | 50 
 targetAPIVersion | Specify the apiVersion of scale target。 | string | false | apps/v1 
 targetKind | Specify the kind of scale target。 | string | false | Deployment 


## Env

### 描述

Add env on K8s pod for your workload which follows the pod spec in path 'spec.template'。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (env)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: sidecar
          properties:
            name: sidecar-nginx
            image: nginx
        - type: env
          properties:
            # you can use env to control multiple containers by filling `containers`
            # NOTE: in containers, you must set the container name for each container
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

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: sidecar
          properties:
            name: sidecar-nginx
            image: nginx
        - type: env
          properties:
            # you can use env to control one container, if containerName not specified, it will patch on the first index container 
            containerName: busybox
            env:
              key_for_busybox_first: value_first
              key_for_busybox_second: value_second
```

### 参数说明 (env)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
  |  | [PatchParams](#patchparams-env) or [type-option-2](#type-option-2-env) | false |  


#### PatchParams (env)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 replace | Specify if replacing the whole environment settings for the container。 | bool | false | false 
 env | Specify the  environment variables to merge, if key already existing, override its value。 | map[string]string | true |  
 unset | Specify which existing environment variables to unset。 | []string | true |  


#### type-option-2 (env)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containers | Specify the environment variables for multiple containers。 | [[]containers](#containers-env) | true |  


##### containers (env)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 replace | Specify if replacing the whole environment settings for the container。 | bool | false | false 
 env | Specify the  environment variables to merge, if key already existing, override its value。 | map[string]string | true |  
 unset | Specify which existing environment variables to unset。 | []string | true |  


## Expose

### 描述

为组件暴露端口，以便能够通过 web 进行访问。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps



### 示例 (expose)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test-app
spec:
  components:
    - name: hello-world
      type: webservice
      properties:
        image: crccheck/hello-world
      traits:
        - type: expose
          properties:
            port: [8000]
```

### 参数说明 (expose)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | Deprecated, the old way to specify the exposion ports。 | []int | false |  
 ports | Specify portsyou want customer traffic sent to。 | [[]ports](#ports-expose) | false |  
 annotations | 指定暴露的服务的注解。 | map[string]string | true |  
 matchLabels |  | map[string]string | false |  
 type | 指定要创建的服务类型，可选值："ClusterIP","NodePort","LoadBalancer","ExternalName"。 | "ClusterIP" or "NodePort" or "LoadBalancer" or "ExternalName" | false | ClusterIP 


#### ports (expose)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 要暴露的 IP 端口号。 | int | true |  
 name | 端口名称。 | string | false |  
 protocol | 端口协议类型 UDP， TCP， 或者 SCTP。 | "TCP" or "UDP" or "SCTP" | false | TCP 
 nodePort | exposed node port. Only Valid when exposeType is NodePort。 | int | false |  


## Gateway

### 描述

为组件启用公网访问，使用 K8s v1.20+ 的 Ingress API。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps



### 示例 (gateway)

```yaml
# vela-app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

### 参数说明 (gateway)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 domain | 暴露服务所绑定的域名。 | string | false |  
 http | 定义一组网关路径到 Pod 服务端口的映射关系。 | map[string]int | true |  
 class | 所使用的 kubernetes ingress class。 | string | false | nginx 
 classInSpec | 在 kubernetes ingress 的 '.spec.ingressClassName' 定义 ingress class 而不是在 'kubernetes.io/ingress.class' 注解中定义。 | bool | false | false 
 secretName | Specify the secret name you want to quote to use tls。 | string | false |  
 gatewayHost | 指定 Ingress 网关的主机名，当为空时，会自动生成主机名。 | string | false |  
 name | Specify a unique name for this gateway, required to support multiple gateway traits on a component。 | string | false |  
 pathType | Specify a pathType for the ingress rules, defaults to "ImplementationSpecific"。 | "ImplementationSpecific" or "Prefix" or "Exact" | false | ImplementationSpecific 
 annotations | Specify the annotations to be added to the ingress。 | map[string]string | false |  
 labels | Specify the labels to be added to the ingress。 | map[string]string | false |  
 existingServiceName | If specified, use an existing Service rather than creating one。 | string | false |  


## Hostalias

### 描述

Add host aliases on K8s pod for your workload which follows the pod spec in path 'spec.template'。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (hostalias)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-hostalias
spec:
  components:
    - name: busybox-runner
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
      traits:
        - type: hostalias
          properties:
            hostAliases:
              - ip: 127.0.0.1
                hostnames:
                  - localname
                  - locals
```

### 参数说明 (hostalias)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 hostAliases | 定义容器内的 hostAliases。 | [[]hostAliases](#hostaliases-hostalias) | true |  


#### hostAliases (hostalias)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 ip |  | string | true |  
 hostnames |  | []string | true |  


## Hpa

### 描述

Configure k8s HPA for Deployment or Statefulsets。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps



### 示例 (hpa)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: helloworld
spec:
  components:
    - name: helloworld
      type: webservice
      properties:
        cpu: "0.5"
        exposeType: ClusterIP
        image: oamdev/hello-world
        memory: 1024Mi
        ports:
          - expose: true
            port: 80
            protocol: TCP
      traits:
        - type: scaler
          properties:
            replicas: 1
        - type: hpa
          properties:
            targetAPIVersion: apps/v1
            targetKind: Deployment
            max: 10
            min: 1
            cpu:
              type: Utilization
              value: 80
            mem:
              type: AverageValue
              value: 90
            podCustomMetrics:
              # here are custom metric names and values. Please replace them to be your metrics
              - name: pod_net_received_rate
                value: "77"
              - name: pod_net_transmitted_rate
                value: "88"
              - name: pod_net_received_packets_rate
                value: "95"
              - name: pod_net_transmitted_packets_rate
                value: "99"
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
        rules:
          - strategy:
              path: ["spec.replicas"]
            selector:
              resourceTypes: ["Deployment","StatefulSet"]
```

### 参数说明 (hpa)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 min | 能够将工作负载缩容到的最小副本个数。 | int | false | 1 
 max | 能够将工作负载扩容到的最大副本个数。 | int | false | 10 
 targetAPIVersion | Specify the apiVersion of scale target。 | string | false | apps/v1 
 targetKind | Specify the kind of scale target。 | string | false | Deployment 
 cpu |  | [cpu](#cpu-hpa) | true |  
 mem |  | [mem](#mem-hpa) | false |  
 podCustomMetrics | Specify custom metrics of pod type。 | [[]podCustomMetrics](#podcustommetrics-hpa) | false |  


#### cpu (hpa)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type | Specify resource metrics in terms of percentage("Utilization") or direct value("AverageValue")。 | "Utilization" or "AverageValue" | false | Utilization 
 value | Specify the value of CPU utilization or averageValue。 | int | false | 50 


#### mem (hpa)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type | Specify resource metrics in terms of percentage("Utilization") or direct value("AverageValue")。 | "Utilization" or "AverageValue" | false | Utilization 
 value | Specify  the value of MEM utilization or averageValue。 | int | false | 50 


#### podCustomMetrics (hpa)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Specify name of custom metrics。 | string | true |  
 value | Specify target value of custom metrics。 | string | true |  


## Init-Container

### 描述

为 pod 添加初始化容器，并使用共享卷。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (init-container)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: init-container
          properties:
            name: init-busybox
            image: busybox
            cmd: ["echo", "hello"]
            initMountPath: /data
            appMountPath: /data-initialized
```

### 参数说明 (init-container)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 指定初始化容器的名称。 | string | true |  
 image | 指定初始化容器的镜像。 | string | true |  
 imagePullPolicy | 镜像拉取策略。 | "IfNotPresent" or "Always" or "Never" | false | IfNotPresent 
 cmd | 指定初始化容器的命令。 | []string | false |  
 args | 指定初始化容器的参数。 | []string | false |  
 env | 指定初始化容器的环境变量。 | [[]env](#env-init-container) | false |  
 mountName | 指定共享卷的挂载名。 | string | false | workdir 
 appMountPath | 指定共享卷在应用容器的挂载路径。 | string | true |  
 initMountPath | 指定共享卷初始化容器的挂载路径。 | string | true |  
 extraVolumeMounts | 指定初始化容器的额外挂载卷。 | [[]extraVolumeMounts](#extravolumemounts-init-container) | true |  


#### env (init-container)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量名称。 | string | true |  
 value | 环境变量的值。 | string | false |  
 valueFrom | 从哪个资源中读取环境变量的定义。 | [valueFrom](#valuefrom-init-container) | false |  


##### valueFrom (init-container)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretKeyRef | secret 键的引用。 | [secretKeyRef](#secretkeyref-init-container) | false |  
 configMapKeyRef | configmap 键的引用。 | [configMapKeyRef](#configmapkeyref-init-container) | false |  


##### secretKeyRef (init-container)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Secret 名称。 | string | true |  
 key | 选择 Secret 中存在的 key。 | string | true |  


##### configMapKeyRef (init-container)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量的名称。 | string | true |  
 key | configmap 中的键名。 | string | true |  


#### extraVolumeMounts (init-container)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 挂载的卷名。 | string | true |  
 mountPath | 初始化容器中的挂载路径。 | string | true |  


## Json-Merge-Patch

### 描述

使用 JSON Merge Patch 策略，遵循 RFC 7396。

> 目前这个运维特征默认在 VelaUX 处隐藏，你可以在 CLI 侧使用。

### 适用于组件类型

所有组件类型。


### 示例 (json-merge-patch)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
        labels:
          pod-label-key: pod-label-value
          to-delete-label-key: to-delete-label-value
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

### 参数说明 (json-merge-patch)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 \- |  | {} | true |  


## Json-Patch

### 描述

使用 JSON Patch 策略，遵循 RFC 6902。

> 目前这个运维特征默认在 VelaUX 处隐藏，你可以在 CLI 侧使用。

### 适用于组件类型

所有组件类型。


### 示例 (json-patch)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
        labels:
          pod-label-key: pod-label-value
          to-delete-label-key: to-delete-label-value
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

### 参数说明 (json-patch)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 operations |  | [[]operations](#operations-json-patch) | true |  


#### operations (json-patch)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 \- |  | {} | true |  


## K8s-Update-Strategy

### 描述

Set k8s update strategy for Deployment/DaemonSet/StatefulSet。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps



### 示例 (k8s-update-strategy)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-update-strategy
spec:
  components:
    - name: helloworld
      type: webservice
      properties:
        cpu: "0.5"
        exposeType: ClusterIP
        image: oamdev/hello-world:latest
        memory: 1024Mi
        ports:
          - expose: true
            port: 80
            protocol: TCP
      traits:
        - type: scaler
          properties:
            replicas: 5
        - type: k8s-update-strategy
          properties:
            targetAPIVersion: apps/v1
            targetKind: Deployment
            strategy:
              type: RollingUpdate
              rollingStrategy:
                maxSurge: 20%
                maxUnavailable: 30%
---
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-node-exporter
spec:
  components:
    - name: node-exporter
      type: daemon
      properties:
        image: prom/node-exporter
        imagePullPolicy: IfNotPresent
        volumeMounts:
          hostPath:
            - mountPath: /host/sys
              mountPropagation: HostToContainer
              name: sys
              path: /sys
              readOnly: true
            - mountPath: /host/root
              mountPropagation: HostToContainer
              name: root
              path: /
              readOnly: true
      traits:
        - properties:
            args:
              - --path.sysfs=/host/sys
              - --path.rootfs=/host/root
              - --no-collector.wifi
              - --no-collector.hwmon
              - --collector.filesystem.ignored-mount-points=^/(dev|proc|sys|var/lib/docker/.+|var/lib/kubelet/pods/.+)($|/)
              - --collector.netclass.ignored-devices=^(veth.*)$
          type: command
        - properties:
            annotations:
              prometheus.io/path: /metrics
              prometheus.io/port: "8080"
              prometheus.io/scrape: "true"
            port:
              - 9100
          type: expose
        - properties:
            cpu: 0.1
            memory: 250Mi
          type: resource
        - type: k8s-update-strategy
          properties:
            targetAPIVersion: apps/v1
            targetKind: DaemonSet
            strategy:
              type: RollingUpdate
              rollingStrategy:
                maxSurge: 20%
                maxUnavailable: 30%




```

### 参数说明 (k8s-update-strategy)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 targetAPIVersion | Specify the apiVersion of target。 | string | false | apps/v1 
 targetKind | Specify the kind of target。 | "Deployment" or "StatefulSet" or "DaemonSet" | false | Deployment 
 strategy | Specify the strategy of update。 | [strategy](#strategy-k8s-update-strategy) | true |  


#### strategy (k8s-update-strategy)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type | Specify the strategy type。 | "RollingUpdate" or "Recreate" or "OnDelete" | false | RollingUpdate 
 rollingStrategy | Specify the parameters of rollong update strategy。 | [rollingStrategy](#rollingstrategy-k8s-update-strategy) | false |  


##### rollingStrategy (k8s-update-strategy)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 maxSurge |  | string | false | 25% 
 maxUnavailable |  | string | false | 25% 
 partition |  | int | false | 0 


## Labels

### 描述

Add labels on your workload. if it generates pod, add same label for generated pods。

### 适用于组件类型

所有组件类型。


### 示例 (labels)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: labels
          properties:
            "release": "stable"
        - type: annotations
          properties:
            "description": "web application"
```

### 参数说明 (labels)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 \- |  | map[string]:(null&#124;string) | true |  


## Lifecycle

### 描述

为 pod 添加生命周期钩子，它遵循路径“spec.template”中的 pod 规范。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (lifecycle)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-lifecycle
spec:
  components:
    - name: busybox-runner
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
      traits:
        - type: lifecycle
          properties:
            postStart:
              exec:
                command:
                  - echo
                  - 'hello world'
            preStop:
              httpGet:
                host: "www.aliyun.com"
                scheme: "HTTPS"
                port: 443
```

### 参数说明 (lifecycle)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 postStart |  | [postStart](#poststart-lifecycle) | false |  
 preStop |  | [preStop](#prestop-lifecycle) | false |  


#### postStart (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec |  | [exec](#exec-lifecycle) | false |  
 httpGet |  | [httpGet](#httpget-lifecycle) | false |  
 tcpSocket |  | [tcpSocket](#tcpsocket-lifecycle) | false |  


##### exec (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command |  | []string | true |  


##### httpGet (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path |  | string | false |  
 port |  | int | true |  
 host |  | string | false |  
 scheme |  | "HTTP" or "HTTPS" | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-lifecycle) | false |  


##### httpHeaders (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port |  | int | true |  
 host |  | string | false |  


#### preStop (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec |  | [exec](#exec-lifecycle) | false |  
 httpGet |  | [httpGet](#httpget-lifecycle) | false |  
 tcpSocket |  | [tcpSocket](#tcpsocket-lifecycle) | false |  


##### exec (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command |  | []string | true |  


##### httpGet (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path |  | string | false |  
 port |  | int | true |  
 host |  | string | false |  
 scheme |  | "HTTP" or "HTTPS" | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-lifecycle) | false |  


##### httpHeaders (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (lifecycle)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port |  | int | true |  
 host |  | string | false |  


## Nocalhost

### 描述

使用 nocalhost 作为开发环境的配置。

> 目前这个运维特征默认在 VelaUX 处隐藏，你可以在 CLI 侧使用。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (nocalhost)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bookinfo
spec:
  components:
    - name: productpage
      type: webservice
      properties:
        image: nocalhost-docker.pkg.coding.net/nocalhost/bookinfo/productpage:latest
        port: 9080
      traits:
        - type: nocalhost
          properties:
            port: 9080
            gitUrl: https://github.com/nocalhost/bookinfo-productpage.git
            image: nocalhost-docker.pkg.coding.net/nocalhost/dev-images/python:3.7.7-slim-productpage-with-pydevd
            shell: "bash"
            workDir: "/opt/work"
            resources:
              limits:
                memory: 1Gi
                cpu: "1"
              requests:
                memory: 512Mi
                cpu: "0.5"
            debug:
              remoteDebugPort: 9009
            hotReload: true
            sync:
              type: send
              filePattern:
                - ./
              ignoreFilePattern:
                - .git
                - .idea
            command:
              run:
                - sh
                - run.sh
              debug:
                - sh
                - debug.sh
            env:
              - name: "foo"
                value: "bar"
            portForward:
              - 39080:9080
```

### 参数说明 (nocalhost)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port |  | int | true |  
 serviceType |  | string | false | deployment 
 gitUrl |  | string | false |  
 image |  | string | true |  
 shell |  | string | false | bash 
 workDir |  | string | false | /home/nocalhost-dev 
 storageClass |  | string | false |  
 command |  | [command](#command-nocalhost) | true |  
 debug |  | [debug](#debug-nocalhost) | false |  
 hotReload |  | bool | false | true 
 sync |  | [sync](#sync-nocalhost) | true |  
 env |  | [[]env](#env-nocalhost) | false |  
 portForward |  | []string | false |  
 persistentVolumeDirs |  | [[]persistentVolumeDirs](#persistentvolumedirs-nocalhost) | false |  
 resources |  | [resources](#resources-nocalhost) | true |  


#### command (nocalhost)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 run |  | []string | true |  
 debug |  | []string | true |  


#### debug (nocalhost)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 remoteDebugPort |  | int | false |  


#### sync (nocalhost)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type |  | string | false | send 
 filePattern |  | []string | true |  
 ignoreFilePattern |  | []string | true |  


#### env (nocalhost)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


#### persistentVolumeDirs (nocalhost)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path |  | string | true |  
 capacity |  | string | true |  


#### resources (nocalhost)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 limits |  | [limits](#limits-nocalhost) | true |  
 requests |  | [requests](#requests-nocalhost) | true |  


##### limits (nocalhost)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 memory |  | string | false | 2Gi 
 cpu |  | string | false | 2 


##### requests (nocalhost)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 memory |  | string | false | 512Mi 
 cpu |  | string | false | 0.5 


## Podsecuritycontext

### 描述

Adds security context to the pod spec in path 'spec.template.spec.securityContext'。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (podsecuritycontext)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podtato-head
spec:
  components:
    - name: podtato-head-frontend
      type: webservice
      properties:
        image: ghcr.io/podtato-head/podtato-server:v0.3.1
        ports:
          - port: 8080
            expose: true
        cpu: "0.1"
        memory: "32Mi"
      traits:
        - type: podsecuritycontext
          properties:
            # runs pod as non-root user
            runAsNonRoot: true
            # runs the pod as user with uid 65532
            runAsUser: 65532
```

### 参数说明 (podsecuritycontext)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 appArmorProfile | Specify the AppArmor profile for the pod。 | [appArmorProfile](#apparmorprofile-podsecuritycontext) | false |  
 fsGroup |  | int | false |  
 runAsGroup |  | int | false |  
 runAsUser | Specify the UID to run the entrypoint of the container process。 | int | false |  
 runAsNonRoot | Specify if the container runs as a non-root user。 | bool | false | true 
 seccompProfile | Specify the seccomp profile for the pod。 | [seccompProfile](#seccompprofile-podsecuritycontext) | false |  


#### appArmorProfile (podsecuritycontext)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type |  | "RuntimeDefault" or "Unconfined" or "Localhost" | true |  
 localhostProfile |  | string | false |  


#### seccompProfile (podsecuritycontext)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type |  | "RuntimeDefault" or "Unconfined" or "Localhost" | true |  
 localhostProfile |  | string | false |  


## Resource

### 描述

为 pod 添加资源请求和限制，它遵循路径“spec.template”中的 pod 规范。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch
- cronjobs.batch



### 示例 (resource)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: resource-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        ports:
          - port: 8000
      traits:
        - type: resource
          properties:
            cpu: 2
            memory: 2Gi
            requests:
              cpu: 2
              memory: 2Gi
            limits:
              cpu: 4
              memory: 4Gi
```

### 参数说明 (resource)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 cpu | 指定 cpu 请求和限制的大小。 | number | false | 1 
 memory | 指定内存请求和限制的大小。 | string | false | 2048Mi 
 requests | 指定请求的资源。 | [requests](#requests-resource) | false |  
 limits | 指定限制的资源。 | [limits](#limits-resource) | false |  


#### requests (resource)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 cpu | 指定 cpu 请求的大小。 | number | false | 1 
 memory | 指定内存请求的大小。 | string | false | 2048Mi 


#### limits (resource)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 cpu | 指定 cpu 限制的大小。 | number | false | 1 
 memory | 指定内存限制的大小。 | string | false | 2048Mi 


## Scaler

### 描述

调整 pod 的副本数，它遵循路径“spec.template”中的 pod 规范。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps



### 示例 (scaler)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: nginx
      traits:
        - type: scaler
          properties:
            replicas: 2
        - type: sidecar
          properties:
            name: "sidecar-test"
            image: "fluentd"
    - name: backend
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
```

### 参数说明 (scaler)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 replicas | 工作负载的 Pod 个数。 | int | false | 1 


## Securitycontext

### 描述

Adds security context to the container spec in path 'spec.template.spec.containers.[].securityContext'。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (securitycontext)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podtato-head
spec:
  components:
    - name: podtato-head-frontend
      type: webservice
      properties:
        image: ghcr.io/podtato-head/podtato-server:v0.3.1
        ports:
          - port: 8080
            expose: true
        cpu: "0.1"
        memory: "32Mi"
      traits:
        - type: securitycontext
          properties:
            # drops all capabilities
            dropCapabilities:
              - ALL
            # runs container as non-root user
            runAsNonRoot: true
            # ensures that the container runs unprivileged
            privileged: false
            # runs container in read-only mode
            readOnlyRootFilesystem: false
```

### 参数说明 (securitycontext)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
  |  | [PatchParams](#patchparams-securitycontext) or [type-option-2](#type-option-2-securitycontext) | false |  


#### PatchParams (securitycontext)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 addCapabilities |  | []string | false |  
 allowPrivilegeEscalation |  | bool | false | false 
 dropCapabilities |  | []string | false |  
 privileged |  | bool | false | false 
 readOnlyRootFilesystem |  | bool | false | false 
 runAsNonRoot |  | bool | false | true 
 runAsUser |  | int | false |  
 runAsGroup |  | int | false |  


#### type-option-2 (securitycontext)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containers | Specify the container image for multiple containers。 | [[]containers](#containers-securitycontext) | true |  


##### containers (securitycontext)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 addCapabilities |  | []string | false |  
 allowPrivilegeEscalation |  | bool | false | false 
 dropCapabilities |  | []string | false |  
 privileged |  | bool | false | false 
 readOnlyRootFilesystem |  | bool | false | false 
 runAsNonRoot |  | bool | false | true 
 runAsUser |  | int | false |  
 runAsGroup |  | int | false |  


## Service-Account

### 描述

为 pod 指定 serviceAccount，它遵循路径“spec.template”中的 pod 规范。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (service-account)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-doc
  namespace: vela-system
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/vela-cli:v1.5.0-beta.1
        cmd: ["/bin/vela","show"]
        ports:
          - port: 18081
            expose: true
      traits:
        - type: service-account
          properties:
            name: kubevela-vela-core
```

### 参数说明 (service-account)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 指定 ServiceAccount 名称。 | string | true |  
 create | 指定是否创建新的 ServiceAccount。 | bool | false | false 
 privileges | 指定 ServiceAccount 的权限，若不为空，则会创建 RoleBinding 及 ClusterRoleBindings。 | [[]privileges](#privileges-service-account) | false |  


#### privileges (service-account)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 verbs | 指定资源允许的动作。 | []string | true |  
 apiGroups | 指定资源的 apiGroups。 | []string | false |  
 resources | 指定允许的资源。 | []string | false |  
 resourceNames | 指定允许的资源名称。 | []string | false |  
 nonResourceURLs | 指定允许的资源 URL。 | []string | false |  
 scope | 指定权限的范围，默认为 namespace 范围。 | "namespace" or "cluster" | false | namespace 


## Service-Binding

### 描述

绑定云资源的密钥到组件环境变量中，该定义已废弃，请使用 'storage' 定义。

> 目前这个运维特征默认在 VelaUX 处隐藏，你可以在 CLI 侧使用。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (service-binding)

1. Prepare a Kubernetes Secret

The secret can be manually created, or generated by other component or external system.

For example, we have a secret `db-conn-example` whose data is as below:

```yaml
endpoint: https://xxx.com
password: 123
username: myname
```

2. Bind the Secret into your component by `service-binding` trait

For example, we have a webservice component who needs to consume a database. The database connection string should be set
to Pod environments: `endpoint`, `username` and `DB_PASSWORD`.

We can set the properties for envMappings as below. For each environment, `secret` represents the secret name, and `key`
represents the key of the secret.

Here is the complete properties for the trait.

```yaml
traits:
- type: service-binding
  properties:
    envMappings:
      DB_PASSWORD:
        secret: db-conn-example
        key: password            
      endpoint:
        secret: db-conn-example
        key: endpoint
      username:
        secret: db-conn-example
        key: username
```

In particular, if the environment name, like `endpoint`, is same to the `key` of the secret, we can omit the `key`.
So we can simplify the properties as below.

```yaml
traits:
- type: service-binding
  properties:
    envMappings:
      DB_PASSWORD:
        secret: db-conn-example
        key: password            
      endpoint:
        secret: db-conn-example
      username:
        secret: db-conn-example
```

We can finally prepare an Application for the business component `binding-test-comp` to consume the secret, which is a
representative of a database cloud resource.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: binding-test-comp
      type: webservice
      properties:
        image: zzxwill/flask-web-application:v0.3.1-crossplane
        ports: 80
      traits:
        - type: service-binding
          properties:
            envMappings:
              # environments refer to db-conn secret
              DB_PASSWORD:
                secret: db-conn-example
                key: password            
              endpoint:
                secret: db-conn-example
              username:
                secret: db-conn-example
```

Deploy this YAML and the Secret `db-conn-example` will be binding into environment of workload.

### 参数说明 (service-binding)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 envMappings | 环境变量到密钥的映射。 | map[string]KeySecret(#keysecret-service-binding) | true |  


#### KeySecret (service-binding)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | false |  
 secret |  | string | true |  


## Sidecar

### 描述

为 pod 添加 sidecar 容器，它遵循路径“spec.template”中的 pod 规范。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (sidecar)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app-with-sidecar
spec:
  components:
    - name: log-gen-worker
      type: worker
      properties:
        image: busybox
        cmd:
          - /bin/sh
          - -c
          - >
            i=0;
            while true;
            do
              echo "$i: $(date)" >> /var/log/date.log;
              i=$((i+1));
              sleep 1;
            done
        volumes:
          - name: varlog
            mountPath: /var/log
            type: emptyDir
      traits:
        - type: sidecar
          properties:
            name: count-log
            image: busybox
            cmd: [ /bin/sh, -c, 'tail -n+1 -f /var/log/date.log']
            volumes:
              - name: varlog
                path: /var/log
```

### 参数说明 (sidecar)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 容器名称。 | string | true |  
 image | 容器镜像。 | string | true |  
 cmd | 容器的执行命令。 | []string | false |  
 args | 指定 sidecar 中的参数。 | []string | false |  
 env | 指定 sidecar 中的环境变量。 | [[]env](#env-sidecar) | false |  
 volumes | 挂载卷。 | [[]volumes](#volumes-sidecar) | false |  
 livenessProbe | 判断容器是否存活的探针。 | [livenessProbe](#livenessprobe-sidecar) | false |  
 readinessProbe | 判断容器是否就绪，能够接受用户流量的探针。 | [readinessProbe](#readinessprobe-sidecar) | false |  


#### env (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量名称。 | string | true |  
 value | 环境变量的值。 | string | false |  
 valueFrom | 从哪个资源中读取环境变量的定义。 | [valueFrom](#valuefrom-sidecar) | false |  


##### valueFrom (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 secretKeyRef | secret 键的引用。 | [secretKeyRef](#secretkeyref-sidecar) | false |  
 configMapKeyRef | configmap 键的引用。 | [configMapKeyRef](#configmapkeyref-sidecar) | false |  
 fieldRef | 指定要用于环境变量的字段。 | [fieldRef](#fieldref-sidecar) | false |  


##### secretKeyRef (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | Secret 名称。 | string | true |  
 key | 选择 Secret 中存在的 key。 | string | true |  


##### configMapKeyRef (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 环境变量的名称。 | string | true |  
 key | configmap 中的键名。 | string | true |  


##### fieldRef (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 fieldPath | 指定要用于环境变量的字段路径。 | string | true |  


#### volumes (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 path |  | string | true |  


#### livenessProbe (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-sidecar) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-sidecar) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-sidecar) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-sidecar) | false |  


##### httpHeaders (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


#### readinessProbe (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 exec | 通过在容器中执行一条命令判断是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [exec](#exec-sidecar) | false |  
 httpGet | 通过发送 httpGet 请求判断容器是否就绪。 请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [httpGet](#httpget-sidecar) | false |  
 tcpSocket | 通过 tcpSocket 是否开启判断容器是否就绪。请注意就绪性检查必须并且也只能定义 httpGet，tcpSocket 或者 exec 中的一个。 | [tcpSocket](#tcpsocket-sidecar) | false |  
 initialDelaySeconds | 定义容器启动多少秒之后开始第一次检查。 | int | false | 0 
 periodSeconds | 定义每次检查之间的时间间隔。 | int | false | 10 
 timeoutSeconds | 定义检查的超时时间。 | int | false | 1 
 successThreshold | 定义检查成功多少次之后判断容器已经就绪。 | int | false | 1 
 failureThreshold | 定义检查失败多少次之后判断容器已经不健康。 | int | false | 3 


##### exec (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | true |  
 port | 定义服务端点的端口号。 | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-sidecar) | false |  


##### httpHeaders (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (sidecar)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | 指定健康检查的 TCP socket。 | int | true |  


## Startup-Probe

### 描述

Add startup probe hooks for the specified container of K8s pod for your workload which follows the pod spec in path 'spec.template'。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (startup-probe)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-startup-probe
spec:
  components:
    - name: busybox-runner
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
      traits:
      - type: sidecar
        properties:
          name: nginx
          image: nginx
      # This startup-probe is blocking the startup of the main container 
      # as the URL has a typo '.comm' vs '.com'
      - type: startup-probe
        properties:
          containerName: "busybox-runner"
          httpGet:
            host: "www.guidewire.comm"
            scheme: "HTTPS"
            port: 443
          periodSeconds: 4
          failureThreshold: 4  
      # This startup probe targets the nginx sidecar
      - type: startup-probe
        properties:
          containerName: nginx
          httpGet:
            host: "www.guidewire.com"
            scheme: "HTTPS"
            port: 443
          periodSeconds: 5
          failureThreshold: 5           
```

### 参数说明 (startup-probe)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
  |  | [StartupProbeParams](#startupprobeparams-startup-probe) or [type-option-2](#type-option-2-startup-probe) | false |  


#### StartupProbeParams (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 initialDelaySeconds | Number of seconds after the container has started before liveness probes are initiated. Minimum value is 0。 | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. Minimum value is 1。 | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. Minimum value is 1。 | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed.  Minimum value is 1。 | int | false | 1 
 failureThreshold | Minimum consecutive failures for the probe to be considered failed after having succeeded. Minimum value is 1。 | int | false | 3 
 terminationGracePeriodSeconds | Optional duration in seconds the pod needs to terminate gracefully upon probe failure. Set this value longer than the expected cleanup time for your process。 | int | false |  
 exec | Instructions for assessing container startup status by executing a command. Either this attribute or the httpGet attribute or the grpc attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with the httpGet attribute and the tcpSocket attribute and the gRPC attribute。 | [exec](#exec-startup-probe) | false |  
 httpGet | Instructions for assessing container startup status by executing an HTTP GET request. Either this attribute or the exec attribute or the grpc attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the tcpSocket attribute and the gRPC attribute。 | [httpGet](#httpget-startup-probe) | false |  
 grpc | Instructions for assessing container startup status by probing a gRPC service. Either this attribute or the exec attribute or the grpc attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the httpGet attribute and the tcpSocket attribute。 | [grpc](#grpc-startup-probe) | false |  
 tcpSocket | Instructions for assessing container startup status by probing a TCP socket. Either this attribute or the exec attribute or the tcpSocket attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the httpGet attribute and the gRPC attribute。 | [tcpSocket](#tcpsocket-startup-probe) | false |  


##### exec (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | false |  
 port | The port numer to access on the host or container。 | int | true |  
 host | The hostname to connect to, defaults to the pod IP. You probably want to set "Host" in httpHeaders instead。 | string | false |  
 scheme | The Scheme to use for connecting to the host。 | "HTTP" or "HTTPS" | false | HTTP 
 httpHeaders | Custom headers to set in the request. HTTP allows repeated headers。 | [[]httpHeaders](#httpheaders-startup-probe) | false |  


##### httpHeaders (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | The header field name。 | string | true |  
 value | The header field value。 | string | true |  


##### grpc (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | The port number of the gRPC service。 | int | true |  
 service | The name of the service to place in the gRPC HealthCheckRequest。 | string | false |  


##### tcpSocket (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | Number or name of the port to access on the container。 | int | true |  
 host | Host name to connect to, defaults to the pod IP。 | string | false |  


#### type-option-2 (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 probes | Specify the startup probe for multiple containers。 | [[]probes](#probes-startup-probe) | true |  


##### probes (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 containerName | Specify the name of the target container, if not set, use the component name。 | string | false | empty 
 initialDelaySeconds | Number of seconds after the container has started before liveness probes are initiated. Minimum value is 0。 | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. Minimum value is 1。 | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. Minimum value is 1。 | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed.  Minimum value is 1。 | int | false | 1 
 failureThreshold | Minimum consecutive failures for the probe to be considered failed after having succeeded. Minimum value is 1。 | int | false | 3 
 terminationGracePeriodSeconds | Optional duration in seconds the pod needs to terminate gracefully upon probe failure. Set this value longer than the expected cleanup time for your process。 | int | false |  
 exec | Instructions for assessing container startup status by executing a command. Either this attribute or the httpGet attribute or the grpc attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with the httpGet attribute and the tcpSocket attribute and the gRPC attribute。 | [exec](#exec-startup-probe) | false |  
 httpGet | Instructions for assessing container startup status by executing an HTTP GET request. Either this attribute or the exec attribute or the grpc attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the tcpSocket attribute and the gRPC attribute。 | [httpGet](#httpget-startup-probe) | false |  
 grpc | Instructions for assessing container startup status by probing a gRPC service. Either this attribute or the exec attribute or the grpc attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the httpGet attribute and the tcpSocket attribute。 | [grpc](#grpc-startup-probe) | false |  
 tcpSocket | Instructions for assessing container startup status by probing a TCP socket. Either this attribute or the exec attribute or the tcpSocket attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the httpGet attribute and the gRPC attribute。 | [tcpSocket](#tcpsocket-startup-probe) | false |  


##### exec (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 command | 容器中执行的命令，命令返回 0 则为正常，否则则为失败。 | []string | true |  


##### httpGet (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 定义服务端点请求的路径。 | string | false |  
 port | The port numer to access on the host or container。 | int | true |  
 host | The hostname to connect to, defaults to the pod IP. You probably want to set "Host" in httpHeaders instead。 | string | false |  
 scheme | The Scheme to use for connecting to the host。 | "HTTP" or "HTTPS" | false | HTTP 
 httpHeaders | Custom headers to set in the request. HTTP allows repeated headers。 | [[]httpHeaders](#httpheaders-startup-probe) | false |  


##### httpHeaders (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | The header field name。 | string | true |  
 value | The header field value。 | string | true |  


##### grpc (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | The port number of the gRPC service。 | int | true |  
 service | The name of the service to place in the gRPC HealthCheckRequest。 | string | false |  


##### tcpSocket (startup-probe)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 port | Number or name of the port to access on the container。 | int | true |  
 host | Host name to connect to, defaults to the pod IP。 | string | false |  


## Storage

### 描述

Add storages on K8s pod for your workload which follows the pod spec in path 'spec.template'。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (storage)

```yaml
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: storage-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
      traits:
        - type: storage
          properties:
            # PVC type storage
            pvc:
              - name: test1
                mountPath: /test/mount/pvc
            # EmptyDir type storage
            emptyDir:
              - name: test1
                mountPath: /test/mount/emptydir
            # ConfigMap type storage
            configMap:
              - name: test1
                mountPath: /test/mount/cm
                # Mount ConfigMap to Env
                mountToEnv:
                  envName: TEST_ENV
                  configMapKey: key1
                data:
                  key1: value1
                  key2: value2
            # Secret type storage
            secret:
              - name: test1
                mountPath: /test/mount/secret
                # Mount Secret to Env
                mountToEnv:
                  envName: TEST_SECRET
                  secretKey: key1
                data:
                  key1: dmFsdWUx
                  key2: dmFsdWUy
```

### 参数说明 (storage)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 pvc | 声明 pvc 类型存储。 | [[]pvc](#pvc-storage) | false |  
 configMap | 声明 ConfigMap 类型存储。 | [[]configMap](#configmap-storage) | false |  
 secret | 声明 Secret 类型存储。 | [[]secret](#secret-storage) | false |  
 emptyDir | 声明 EmptyDir 类型存储。 | [[]emptyDir](#emptydir-storage) | false |  
 hostPath | Declare host path type storage。 | [[]hostPath](#hostpath-storage) | false |  


#### pvc (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountOnly |  | bool | false | false 
 mountPath |  | string | true |  
 subPath |  | string | false |  
 volumeMode |  | string | false | Filesystem 
 volumeName |  | string | false |  
 accessModes |  | []string | true |  
 storageClassName |  | string | false |  
 resources |  | [resources](#resources-storage) | false |  
 dataSourceRef |  | [dataSourceRef](#datasourceref-storage) | false |  
 dataSource |  | [dataSource](#datasource-storage) | false |  
 selector |  | [selector](#selector-storage) | false |  


##### resources (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 requests |  | [requests](#requests-storage) | true |  
 limits |  | [limits](#limits-storage) | false |  


##### requests (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 storage |  | string | true |  


##### limits (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 storage |  | string | true |  


##### dataSourceRef (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 kind |  | string | true |  
 apiGroup |  | string | true |  


##### dataSource (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 kind |  | string | true |  
 apiGroup |  | string | true |  


##### selector (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [matchExpressions](#matchexpressions-storage) | false |  


##### matchExpressions (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 values |  | []string | true |  
 operator |  | string | true |  


#### configMap (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountOnly |  | bool | false | false 
 mountToEnv |  | [mountToEnv](#mounttoenv-storage) | false |  
 mountToEnvs |  | [[]mountToEnvs](#mounttoenvs-storage) | false |  
 mountPath |  | string | false |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 readOnly |  | bool | false | false 
 data |  | map[string]_ | false |  
 items |  | [[]items](#items-storage) | false |  


##### mountToEnv (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 envName |  | string | true |  
 configMapKey |  | string | true |  


##### mountToEnvs (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 envName |  | string | true |  
 configMapKey |  | string | true |  


##### items (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


#### secret (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountOnly |  | bool | false | false 
 mountToEnv |  | [mountToEnv](#mounttoenv-storage) | false |  
 mountToEnvs |  | [[]mountToEnvs](#mounttoenvs-storage) | false |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 readOnly |  | bool | false | false 
 stringData |  | map[string]_ | false |  
 data |  | map[string]_ | false |  
 items |  | [[]items](#items-storage) | false |  


##### mountToEnv (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 envName |  | string | true |  
 secretKey |  | string | true |  


##### mountToEnvs (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 envName |  | string | true |  
 secretKey |  | string | true |  


##### items (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


#### emptyDir (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 medium |  | "" or "Memory" | false | empty 


#### hostPath (storage)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name |  | string | true |  
 path |  | string | true |  
 mountPath |  | string | true |  
 type |  | "Directory" or "DirectoryOrCreate" or "FileOrCreate" or "File" or "Socket" or "CharDevice" or "BlockDevice" | false | Directory 


## Topologyspreadconstraints

### 描述

Add topology spread constraints hooks for every container of K8s pod for your workload which follows the pod spec in path 'spec.template'。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### 示例 (topologyspreadconstraints)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-topologyspreadconstraints
spec:
  components:
    - name: busybox-runner
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
      traits:
      - type: topologyspreadconstraints
        properties:
          constraints: 
          - topologyKey: zone
            labelSelector:
              matchLabels: 
                zone: us-east-1a
            maxSkew: 1
            whenUnsatisfiable: DoNotSchedule
            minDomains: 1
            nodeAffinityPolicy: Ignore
            nodeTaintsPolicy: Ignore
          - topologyKey: node
            labelSelector:
              matchExpressions:
                - key: foo 
                  operator: In
                  values: 
                  - abc
            maxSkew: 1
            whenUnsatisfiable: ScheduleAnyway 
            minDomains: 1
            nodeAffinityPolicy: Ignore
            nodeTaintsPolicy: Ignore
```

### 参数说明 (topologyspreadconstraints)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 constraints |  | [[]constraints](#constraints-topologyspreadconstraints) | true |  


#### constraints (topologyspreadconstraints)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 maxSkew | Describe the degree to which Pods may be unevenly distributed。 | int | true |  
 topologyKey | Specify the key of node labels。 | string | true |  
 whenUnsatisfiable | Indicate how to deal with a Pod if it doesn't satisfy the spread constraint。 | "DoNotSchedule" or "ScheduleAnyway" | false | DoNotSchedule 
 labelSelector | labelSelector to find matching Pods。 | [labelSelector](#labelselector-topologyspreadconstraints) | true |  
 minDomains | Indicate a minimum number of eligible domains。 | int | false |  
 matchLabelKeys | A list of pod label keys to select the pods over which spreading will be calculated。 | []string | false |  
 nodeAffinityPolicy | Indicate how we will treat Pod's nodeAffinity/nodeSelector when calculating pod topology spread skew。 | "Honor" or "Ignore" | false | Honor 
 nodeTaintsPolicy | Indicate how we will treat node taints when calculating pod topology spread skew。 | "Honor" or "Ignore" | false | Honor 


##### labelSelector (topologyspreadconstraints)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-topologyspreadconstraints) | false |  


##### matchExpressions (topologyspreadconstraints)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


