---
title:  状态回写
---

本文档将为你讲解，如何通过 CUE 模版在定义对象时实现状态回写。

## 健康检查

不管是组件定义中，还是运维特征定义中，健康检查对应的配置项都是 `spec.status.healthPolicy`。如果没有定义，它的值默认是 `true`。

在 CUE 里的关键词是 `isHealth`，CUE 表达式结果必须是 `bool` 类型。
KubeVela 运行时会一直检查 CUE 表达式，直至其状态显示为健康。每次控制器都会获取所有的 Kubernetes 资源，并将他们填充到 context 字段中。

所以 context 字段会包含如下信息:

```cue
context:{
  name: <component name>
  appName: <app name>
  output: <Kubernetes workload resource>
  outputs: {
    <resource1>: <Kubernetes trait resource1>
    <resource2>: <Kubernetes trait resource2>
  }
}
```
`Trait` 对象，没有 `context.output` 这个字段，其它字段相同。

我们看看健康检查的例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
spec:
  status:
    healthPolicy: |
      isHealth: (context.output.status.readyReplicas > 0) && (context.output.status.readyReplicas == context.output.status.replicas)
   ...
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
spec:
  status:
    healthPolicy: |
      isHealth: len(context.outputs.service.spec.clusterIP) > 0
   ...
```

健康检查的结果将会记录到 `Application` 对象中。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  components:
  - name: myweb
    type: worker    
    properties:
      cmd:
      - sleep
      - "1000"
      enemies: alien
      image: busybox
      lives: "3"
    traits:
    - type: ingress
      properties:
        domain: www.example.com
        http:
          /: 80
status:
  ...
  services:
  - healthy: true
    message: "type: busybox,\t enemies:alien"
    name: myweb
    traits:
    - healthy: true
      message: 'Visiting URL: www.example.com, IP: 47.111.233.220'
      type: ingress
  status: running
```

## 自定义状态

不管是组件定义中，还是运维特征定义中，自定义状态对应的配置项都是 `spec.status.customStatus`。

在 CUE 中的关键词是 `message`。同时，CUE 表达式的结果必须是 `string` 类型。

自定义状态和健康检查的原理一致。`Application` 对象的 CRD 控制器都会检查 CUE 表达式，直至显示健康通过。

context 字段包含如下信息:

```cue
context:{
  name: <component name>
  appName: <app name>
  output: <Kubernetes workload resource>
  outputs: {
    <resource1>: <Kubernetes trait resource1>
    <resource2>: <Kubernetes trait resource2>
  }
}
```

`Trait` 对象不会有 `context.output` 这个字段, 其它字段一致.

查看示例：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
spec:
  status:
    customStatus: |-
      message: "type: " + context.output.spec.template.spec.containers[0].image + ",\t enemies:" + context.outputs.gameconfig.data.enemies
   ...
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
spec:
  status:
    customStatus: |-
      message: "type: "+ context.outputs.service.spec.type +",\t clusterIP:"+ context.outputs.service.spec.clusterIP+",\t ports:"+ "\(context.outputs.service.spec.ports[0].port)"+",\t domain"+context.outputs.ingress.spec.rules[0].host
   ...
```
