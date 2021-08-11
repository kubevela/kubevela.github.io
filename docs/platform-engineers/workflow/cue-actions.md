---
title:  CUE Actions
---

This doc will illustrate the CUE actions provided in `vela/op` stdlib package.

## #Apply
Create or update resource in kubernetes cluster.
### Action Parameter
- value: the resource structure to be created or updated. And after successful execution, `value` will be updated with resource status.
```
#Apply: {
  value: {}
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
}
```
## ConditionalWait
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
Get component from application by component name.
### Action Parameter
- component: the component name.
- workload: the workload resource of the componnet.
- traits: the trait resources of the componnet.
```
#Load: {
  component: string
  workload: {...}
  traits: [string]: {...}
}
```
### Usage
```
import "vela/op"

// You can use load.workload & load.traits after this action.
load: op.#Load & {
  component: "componet-name"
}
```
## Read
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
// You can use configmap.data after this action.
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
## ApplyEnvBindComponent
## Steps
