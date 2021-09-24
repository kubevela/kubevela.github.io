---
title: Step Operations
---

This documentation will introduce the CUE operations provided in `vela/op` stdlib package that can be used in each workflow step.

> To learn the syntax of CUE, read [CUE Basic](../cue/basic)

## Apply

---

Create or update resource in Kubernetes cluster.

### Action Parameter

- value: the resource structure to be created or updated. And after successful execution, `value` will be updated with resource status.
- patch: the content support `Strategic Merge Patch`,let you can define the strategy of list merge through comments.


```
#Apply: {
  value: {...}
  patch: {
    //patchKey=$key
    ...
  }
}
```

### Usage

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
      //patchKey=name
      containers: [{name: "sidecar"}]
   }
  }
}
```

## ConditionalWait

---

Step will be blocked until the condition is met.
### Action Parameter

- continue: Step will be blocked until the value becomes `true`.

```
#ConditionalWait: {
  continue: bool
}
```

### Usage

```
import "vela/op"

apply: op.#Apply

wait: op.#ConditionalWait: {
  continue: apply.value.status.phase=="running"
}
```

## Load

---

Get all components in application.

### Action Parameter
No parameters.


```
#Load: {}
```

### Usage

```
import "vela/op"

// You can use `load.value.[componentName] after this action.
load: op.#Load & {}
```

## Read

---

Get resource in Kubernetes cluster. 

### Action Parameter

- value: the resource metadata to be get. And after successful execution, `value` will be updated with resource definition in cluster.
- err: if an error occurs, the `err` will contain the error message.


```
#Read: {
  value: {}
  err?: string
}
```

### Usage

```
// You can use configmap.value.data after this action.
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

## ApplyApplication

---

Create or update resources corresponding to the application in Kubernetes cluster.

### Action Parameter

No parameters.

```
#ApplyApplication: {}
```

### Usage

```
apply: op.#ApplyApplication & {}
```

## ApplyComponent

---

Create or update resources corresponding to the component in Kubernetes cluster. Note that need to use `Load` first to apply the resources.

### Action Parameter

- value: the load value of the resource.
- patch: the value to patch resource.


```
#ApplyComponent: {
  value: {...}
  patch: {...}
}
```

### Usage

```
load: op.#Load & {}

apply: op.#ApplyComponent & {
  value: load.value[parameter.component]
}
```

## ApplyRemaining

---

Create or update the resources corresponding to all components in the application in the Kubernetes cluster, and specify which components do not need to apply through `exceptions`, or skip some resources of the exceptional component.

### Action Parameter

- exceptions: indicates the name of the exceptional component.


```
#ApplyRemaining: {
 exceptions?: [...string]
}  
```

### Usage

```
apply: op.#ApplyRemaining & {
  exceptions: ["applied-component-name"]
}
```

## Slack

---

Send messages to Slack.

### Action Parameter

- url: The webhook address of Slack.
- message: The messages that you want to send, please refer to [Slack messaging](https://api.slack.com/reference/messaging/payload) 。

```
#Slack: {
  url: string
  message: {...}
}
```

### Usage

```
apply: op.#Slack & {
  url: webhook url
  message:
    text: Hello KubeVela
}
```

## DingTalk

---

Send messages to DingTalk.

### Action Parameter

- url: The webhook address of DingTalk.
- message: The messages that you want to send, please refer to [DingTalk messaging](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw) 。

```
#DingTalk: {
  url: string
  message: {...}
}
```

### Usage

```
apply: op.#DingTalk & {
  url: webhook url
  message:
    msgtype: text
    text:
      context: Hello KubeVela
}
```

## Steps

---

Used to encapsulate a set of operations.

- In steps, you need to specify the execution order by tag.


### Usage

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

## DoVar

---

used to save or read user-defined data in the context of workflow

### Action Parameter

- method: The value is `get` or `put`, which indicates whether the action reads or saves data from workflow
- path: Path to save or read data
- value: Data content (in the format of cue). When the method is `get`, it indicates the read data, otherwise it indicates the data to be saved

### Usage

```
put: op.ws.#DoVar & {
  method: "Put"
  path: "foo.score"
  value: 100
}

// The user can get the data saved above through get.value (100)
get: op.ws.#DoVar & {
  method: "Get"
  path: "foo.score"
}

```