---
title:  CUE Actions
---

This doc will illustrate the CUE actions provided in `vela/op` stdlib package.

> To learn the syntax of CUE, read [CUE Basic](../cue/basic.md)

## Apply
---
Create or update resource in kubernetes cluster.
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
Get component from application by component name.
### Action Parameter
- component: the component name.
- workload: the workload resource of the componnet.
- auxiliaries: the auxiliary resources of the componnet.
```
#Load: {
  component: string
  value: {
     workload: {...}
     auxiliaries: [string]: {...}
  }   
}
```
### Usage
```
import "vela/op"

// You can use load.workload & load.traits after this action.
load: op.#Load & {
  component: "component-name"
}
```

## Read
---
Get resource in kubernetes cluster. 
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

## ApplyComponent
---
Create or update resources corresponding to the component in kubernetes cluster.
### Action Parameter
- component: the component name.
- workload: the workload resource of the componnet. Value will be filled  after successful execution.
- traits: the trait resources of the componnet. Value will be filled after successful execution.
```
#ApplyComponent: {
   componnet: string
   workload: {...}
   traits: [string]: {...}
}
```
### Usage
```
apply: op.#ApplyComponent & {
  component: "componet-name"
}
```

## ApplyRemaining
---
Create or update the resources corresponding to all components in the application in the kubernetes cluster, and specify which components do not need to apply through `exceptions`, or skip some resources of the exceptional component
### Action Parameter
- exceptions: indicates the name of the exceptional component.
- skipApplyWorkload:  indicates whether to skip apply the workload resource.
- skipAllTraits: indicates to skip apply all resources of the traits.
- skipApplyTraits: specifies the names of the traits to skip apply.
```
#ApplyRemaining: {
 exceptions?: [componentName=string]: {
      skipApplyWorkload: *true | bool
      
      // If this is true, skipApplyTraits will be ignored
      skipAllTraits: *true| bool

      skipApplyTraits: [...string]
  }
}  
```
### Usage
```
apply: op.#ApplyRemaining & {
  exceptions: {"applied-compo apply: op.#ApplyRemaining & {
  exceptions: {"applied-component-name": {}}
}
nent-name": {}}
}
```

## Steps
---
Used to encapsulate a set of operations
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
