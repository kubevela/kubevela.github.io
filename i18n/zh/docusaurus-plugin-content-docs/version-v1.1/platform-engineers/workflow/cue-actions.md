---
title:  CUE 操作
---

这个文档介绍 step 定义过程中，可以使用的 CUE 操作类型。这些操作均由 `vela/op` 包提供。

> 可以阅读 [CUE 基础文档](../cue/basic.md) 来学习 CUE 基础语法。

## Apply

--------

在 Kubernetes 集群中创建或者更新资源。
### 操作参数

- value: 将被 apply 的资源的定义。操作成功执行后，会用集群中资源的状态重新渲染 `value`。
- patch: 对 `value` 的内容打补丁，支持策略性合并，比如可以通过注释 `// +patchKey` 实现数组的按主键合并。


```
#Apply: {
  value: {...}
  patch: {
    // patchKey=$key
    ...
  }
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
  patch: {
   spec: template: spec: {
      // patchKey=name
      containers: [{name: "sidecar"}]
   }
  }
}
```

## ConditionalWait

---

会让 workflow step 处于等待状态，直到条件被满足。

### 操作参数

- continue: 当该字段为 true 时，workflow step 才会恢复继续执行。
- 
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

## Load

---

通过组件名称从 Application 中获取组件对应的资源数据。

### 操作参数

- component: 指定资源名称。
- workload: 获取到的组件的 workload 资源定义。
- auxiliaries: 获取到的组件的辅助资源定义(key 为定义里面 outputs 对应的资源名)。


```
#Load: {
  component: string
  value: {
     workload: {...}
     auxiliaries: [string]: {...}
  }   
}
```

### 用法示例

```
import "vela/op"

// 该操作完成后，你可以使用 `load.value.workload` 以及 `load.value.traits` 来获取到组件相应的资源数据
load: op.#Load & {
  component: "component-name"
}
```

## Read

---

读取 Kubernetes 集群中的资源。

### 操作参数

- value: 需要用户描述读取资源的元数据，比如 kind、name 等，操作完成后，集群中资源的数据会被填充到 `value` 上。
- err: 如果读取操作发生错误，这里会以字符串的方式指示错误信息。


```
#Read: {
  value: {}
  err?: string
}
```

### 用法示例

```
// 操作完成后，你可以通过 configmap.value.data 使用 configmap 里面的数据
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

## ApplyComponent

---

在 Kubernetes 集群中创建或者更新组件对应的所有资源。

### 操作参数

- component: 指定需要 apply 的组件名称。
- workload: 操作完成后，从 Kubernetes 集群中获取到的组件对应的 workload 资源的状态数据。
- traits: 操作完成后，从 Kubernetes 集群中获取到的组件对应的辅助资源的状态数据。数据结构为 map 类型, 索引为定义中 outputs 涉及到的名称。


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

## ApplyRemaining

---
在 Kubernetes 集群中创建或者更新 Application 中所有组件对应的资源,并可以通过 `exceptions` 指明哪些组件或者组件中的某些资源跳过创建和更新。

### 操作参数

- exceptions: 指明该操作需要排除掉的组件。
- skipApplyWorkload: 是否跳过该组件 workload 资源的同步。
- skipAllTraits: 是否跳过该组件所有辅助资源的同步。


```
#ApplyRemaining: {
 exceptions?: [componentName=string]: {
      // skipApplyWorkload 表明是否需要跳过组件的部署
      skipApplyWorkload: *true | bool
      
      // skipAllTraits 表明是否需要跳过所有运维特征的部署
      skipAllTraits: *true| bool
  }
}  
```

### 用法示例

```
apply: op.#ApplyRemaining & {
  exceptions: {"applied-component-name": {}}
}
```

## Steps

---

用来封装一组操作。

### 操作参数

- steps 里面需要通过 tag 的方式指定执行顺序，数字越小执行越靠前。


### 用法示例

```
app: op.#Steps & {
  load: op.#Load & {
    component: "component-name"
  } @step(1)
  apply: op.#Apply & {
    value: load.value.workload
  } @step(2)
} 
```
