---
title: 内置运维特征列表
---

本文档将**按字典序**展示所有内置运维特征的参数列表。

> 本文档由[脚本](../../contributor/cli-ref-doc)自动生成，请勿手动修改，上次更新于 2022-11-16T14:46:36+08:00。

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
 matchLabels |  | map[string]:string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]:string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
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
 matchLabels |  | map[string]:string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]:string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
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
 matchLabels |  | map[string]:string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]:string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
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
 matchLabels |  | map[string]:string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 matchLabels |  | map[string]:string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
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
 operator |  | string | false | In 
 values |  | []string | false |  


##### matchFields (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
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
 operator |  | string | false | In 
 values |  | []string | false |  


##### matchFields (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | true |  
 operator |  | string | false | In 
 values |  | []string | false |  


#### tolerations (affinity)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 key |  | string | false |  
 operator |  | string | false | Equal 
 value |  | string | false |  
 effect |  | string | false |  
 tolerationSeconds | 指定 toleration 的时间周期。 | int | false |  


## Annotations

### 描述

Add annotations on your workload. if it generates pod, add same annotations for generated pods。

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
 -- | Composition type。 | parameter: cannot use value {containerName:*"" &#124; string,command:*null &#124; [],args:*null &#124; [],addArgs:*null &#124; [],delArgs:*null &#124; []} (type struct) as string | false |  


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
 -- | Composition type。 | parameter: cannot use value {containerName:*"" &#124; string,image:string,imagePullPolicy:*"" &#124; "IfNotPresent" &#124; "Always" &#124; "Never"} (type struct) as string | false |  


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

### 参数说明 (env)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 -- | Composition type。 | parameter: cannot use value {containerName:*"" &#124; string,replace:*false &#124; bool,env:{},unset:*[] &#124; []} (type struct) as string | false |  


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
 port | 指定要暴露的端口。 | []int | true |  
 annotations | Specify the annotaions of the exposed service。 | map[string]:string | true |  
 type | 指定要创建的服务类型，可选值："ClusterIP","NodePort","LoadBalancer","ExternalName"。 | string | false | ClusterIP 


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
 http | 定义一组网关路径到 Pod 服务端口的映射关系。 | map[string]:int | true |  
 class | 所使用的 kubernetes ingress class。 | string | false | nginx 
 classInSpec | 在 kubernetes ingress 的 '.spec.ingressClassName' 定义 ingress class 而不是在 'kubernetes.io/ingress.class' 注解中定义。 | bool | false | false 
 secretName | Specify the secret name you want to quote to use tls。 | string | false |  
 gatewayHost | 指定 Ingress 网关的主机名，当为空时，会自动生成主机名。 | string | false |  


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
 imagePullPolicy | 镜像拉取策略。 | string | false | IfNotPresent 
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


### 参数说明 (json-patch)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 operations |  | [[]operations](#operations-json-patch) | true |  


#### operations (json-patch)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 \- |  | {} | true |  


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
 scheme |  | string | false | HTTP 
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
 scheme |  | string | false | HTTP 
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


## Resource

### 描述

为 pod 添加资源请求和限制，它遵循路径“spec.template”中的 pod 规范。

### 适用于组件类型

基于以下资源的组件：
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



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
 scope | 指定权限的范围，默认为 namespace 范围。 | string | false | namespace 


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
 envMappings | 环境变量到密钥的映射。 | map[string]:#KeySecret | true |  


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
 matchLabels |  | map[string]:string | false |  
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
 data |  | map[string]:_ | false |  
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
 mountPath |  | string | false |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 readOnly |  | bool | false | false 
 stringData |  | map[string]:_ | false |  
 data |  | map[string]:_ | false |  
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
 medium |  | string | false | empty 


