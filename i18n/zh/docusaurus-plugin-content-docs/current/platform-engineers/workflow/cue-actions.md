---
title:  CUE 操作
---

这个文档介绍step定义过程中,可以使用cue操作类型.这些操作均由`vela/op`包提供

## #Apply
在kubernetes集群中创建或者更新资源
### 操作参数
- value: 被操作的对象结构. 操作成功执行后，会用集群中资源的状态重新渲染`value`
```
#Apply: {
  value: {}
}
```
### 用法示例
```
import "vela/op"
stepName: op.#Apply & {
  value: {
    kind: "Deployment"
    apiVersion: "apps/v1"
    metadata: name: "test-app"
    spec: { 
      replicas: 2
      ...
    }
  }
}
```
## #ConditionalWait
会让workflow step处于等待状态，直到条件被满足
### 操作参数
- continue: 当该字段为true时，workflow step才会恢复继续执行
```
#ConditionalWait: {
  continue: bool
}
```
### 用法示例
```
import "vela/op"

apply: op.#Apply

wait: op.#ConditionalWait: {
  continue: apply.value.status.phase=="running"
}
```
## #Load
通过组件名称从application中获取组件对应的资源数据
### Action Parameter
- component: 指定资源名称.
- workload: 获取到的组件的workload资源.
- traits: 获取到的组件的traits资源(key为trait定义里面outputs对应的资源名).
```
#Load: {
  component: string
  workload: {...}
  traits: [string]: {...}
}
```
### 用法示例
```
import "vela/op"

// 该操作完成后,你就可以使用通过load.workload以及load.traits使用获取到的组件资源数据.
load: op.#Load & {
  component: "componet-name"
}
```
## #Read
读取kubernetes集群中的资源
### 操作参数
- value: 需要用户描述读取资源的元数据，比如kind、name等，操作完成后，集群中资源的数据会被填充到`value`上
- err: 如果读取操作发生错误，这里会以字符串的方式指示错误信息.
```
#Read: {
  value: {}
  err?: string
}
```
### 用法示例
```
// 操作完成后，你可以通过configmap.value.data使用读取到的configmap数据
configmap: op.#Read & {
   value: {
      kind: "ConfigMap"
      apiVersion: "v1"
      metadata: {
        name: "configmap-name"
        namespace: "configmap-ns"
      }
   }
}
```
## #ApplyComponent
在kubernetes集群中创建或者更新组件对应的所有资源
### 操作参数
- component: 指定组建名称.
- workload: 操作完成后,kubernetes集群中组件对应的workload的资源状态数据.
- traits: 操作完成后,kubernetes集群中组件对应的traits的资源状态数据.
```
#ApplyComponent: {
   componnet: string
   workload: {...}
   traits: [string]: {...}
}
```
### 用法示例
```
apply: op.#ApplyComponent & {
  component: "component-name"
}
```
## #ApplyRemaining
在kubernets集群中创建或者更新application所有组件对应的资源
### 操作参数
- exceptions: 指明操作排除掉的组件
- skipApplyWorkload: 是否跳过该组件workload资源的同步
- skipAllTraits: 是否跳过该组件所有trait资源的同步
- skipApplyTraits: 需要跳过的该组件trait资源对应的名称(定义中outputs涉及到名字)
```
#ApplyRemaining: {
 exceptions?: [componentName=string]: {
      // skipApplyWorkload indicates whether to skip apply the workload resource
      skipApplyWorkload: *true | bool
      
      // skipAllTraits indicates to skip apply all resources of the traits.
      // If this is true, skipApplyTraits will be ignored
      skipAllTraits: *true| bool

      // skipApplyTraits specifies the names of the traits to skip apply
      skipApplyTraits: [...string]
  }
}  
```
### 用法示例
```
apply: op.#ApplyRemaining & {
  exceptions: {"applied-component-name": {}}
}
```
## #Steps
用来封装一组操作
### 操作参数
- steps里面需要通过tag的方式指定执行顺序,数字越小执行越靠前
### 用法示例
```
app: op.#Steps & {
  load: op.#Load & {
    component: "component-name"
  } @step(1)
  apply: op.#Apply & {
    value: load.workload
  } @step(2)
}
```
