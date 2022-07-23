---
title: 内置策略列表
---

本文档将**按字典序**展示所有内置策略的参数列表。

> 本文档由[脚本](../../contributor/cli-ref-doc)自动生成，请勿手动修改，上次更新于 2022-07-23T15:27:57+08:00。

## Apply-Once

### 描述

只交付部署资源，不保证终态一致、允许配置漂移。适用于与其他控制器协作的轻量级交付场景。

### 示例 (apply-once)

It's generally used in [one time delivery only without continuous management](../policies/apply-once) scenario.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: apply-once-app
spec:
  components:
    - name: hello-world
      type: webservice
      properties:
        image: oamdev/hello-world
      traits:
        - type: scaler
          properties:
            replicas: 1
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
```

### 参数说明 (apply-once)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 enable | 当设置为 true 时，表示只交付部署、不保证终态一致、允许配置漂移。 | bool | true | false 
 rules | 指定交付一次的资源规则。 | [[]rules](#rules-apply-once) | false |  


#### rules (apply-once)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 selector | 指定资源筛选目标规则。 | [selector](#selector-apply-once) | false |  
 strategy | Specify the strategy for configuring the resource level configuration drift behaviour。 | [strategy](#strategy-apply-once) | true |  


##### selector (apply-once)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 componentNames | 按组件名称选择目标资源。 | []string | false |  
 componentTypes | 按组件类型选择目标资源。 | []string | false |  
 oamTypes | 按 OAM 概念，组件(COMPONENT) 或 运维特征(TRAIT) 筛选。 | []string | false |  
 traitTypes | 按 trait 类型选择目标资源。 | []string | false |  
 resourceTypes | 按资源类型选择。 | []string | false |  
 resourceNames | 按资源名称选择。 | []string | false |  


##### strategy (apply-once)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 path | 指定资源的路径。 | []string | true |  


## Garbage-Collect

### 描述

为应用配置资源回收策略。 如配置资源不回收。

### 示例 (garbage-collect)

It's used in [garbage collection](../policies/gc) scenario. It can be used to configure the collection policy, e.g. don't delete the legacy resources when updating.

```yaml
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
        - type: ingress-1-20
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
  policies:
    - name: keep-legacy-resource
      type: garbage-collect
      properties:
        keepLegacyResource: true
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: garbage-collect-app
spec:
  components:
    - name: hello-world-new
      type: webservice
      properties:
        image: oamdev/hello-world
      traits:
        - type: expose
          properties:
            port: [8000]
  policies:
    - name: garbage-collect
      type: garbage-collect
      properties:
        rules:
          - selector:
              traitTypes:
                - expose
            strategy: onAppDelete
```

### 参数说明 (garbage-collect)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 keepLegacyResource | 如果为 true，过时的版本化 resource tracker 将不会自动回收。 过时的资源将被保留，直到手动删除 resource tracker。 | bool | true | false 
 rules | 在资源级别控制垃圾回收策略的规则列表，如果一个资源由多个规则控制，将使用第一个规则。 | [[]rules](#rules-garbage-collect) | false |  


#### rules (garbage-collect)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 selector | 指定资源筛选目标规则。 | [[]selector](#selector-garbage-collect) | true |  
 strategy | 目标资源循环利用的策略。 可用值：never、onAppDelete、onAppUpdate。 | string | true | onAppUpdate 


##### selector (garbage-collect)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 componentNames | 按组件名称选择目标资源。 | []string | false |  
 componentTypes | 按组件类型选择目标资源。 | []string | false |  
 oamTypes | 按 OAM 概念，组件(COMPONENT) 或 运维特征(TRAIT) 筛选。 | []string | false |  
 traitTypes | 按 trait 类型选择目标资源。 | []string | false |  
 resourceTypes | 按资源类型选择。 | []string | false |  
 resourceNames | 按资源名称选择。 | []string | false |  


## Health

### 描述

Apply periodical health checking to the application。

### 参数说明 (health)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 probeTimeout | Specify health checking timeout(seconds), default 10s。 | int | true | 10 
 probeInterval | Specify health checking interval(seconds), default 30s。 | int | true | 30 


## Override

### 描述

描述部署资源时要覆盖的配置，需要配合工作流的 `deploy` 步骤一起使用才能生效。

### 示例 (override)

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

### 参数说明 (override)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 components | 要覆盖的组件配置列表。 | [[]components](#components-override) | true |  
 selector | 要使用的组件名称列表。 如果未设置，将使用所有组件。 | []string | false |  


#### components (override)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 name | 要覆盖的组件的名称。 如果未设置，它将匹配具有指定类型的所有组件。 可以与通配符 * 一起使用以进行模糊匹配。。 | string | false |  
 type | 要覆盖的组件的类型。 如果未设置，将匹配所有组件类型。 | string | false |  
 properties | 要覆盖的配置属性，未填写配置会与原先的配置合并。 | map[string]:(null\|bool\|string\|bytes\|{...}\|[...]\|number) | false |  
 traits | 要覆盖的 trait 配置列表。 | [[]traits](#traits-override) | false |  


##### traits (override)

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 type | 要做参数覆盖的 trait 类型。 | string | true |  
 properties | 要覆盖的配置属性，未填写配置会与原先的配置合并。 | map[string]:(null\|bool\|string\|bytes\|{...}\|[...]\|number) | false |  
 disable | 如果为 true，该 trait 将被删除，默认 false。 | bool | true | false 


## Topology

### 描述

描述组件应该部署到的集群环境。

### 示例 (topology)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: basic-topology
  namespace: examples
spec:
  components:
    - name: nginx-basic
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusters: ["hangzhou-1", "hangzhou-2"]
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: label-selector-topology
  namespace: examples
spec:
  components:
    - name: nginx-label-selector
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: local-ns-topology
  namespace: examples
spec:
  components:
    - name: nginx-local-ns
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
```

### 参数说明 (topology)


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------ | ------ | ------ | ------------ | --------- 
 cluster | 要选择的集群的名称。 | []string | false |  
 clusterLabelSelector | 根据集群标签选择。 | map[string]:string | false |  
 clusterSelector | Deprecated: Use clusterLabelSelector instead。 | map[string]:string | false |  
 namespace | 要在选定集群中部署的目标命名空间。 如果未设置，组件将继承原始命名空间。 | string | false |  


