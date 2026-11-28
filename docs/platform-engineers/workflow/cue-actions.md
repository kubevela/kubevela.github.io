---
title: Application Workflow Operations
---

The reference for `vela/op`, the legacy package of workflow operations, is in [Built-in Workflow Operations](/workflow/next/guides/authoring/cue-actions) in the Workflow docs, with the packages a step can import. vela-core adds the operations on this page, which work on the Application a workflow belongs to, so only an Application's workflow can use them.

vela-core also adds packages that a WorkflowRun cannot import: `vela/oam` (load, render and apply the Application's components), `vela/multicluster`, `vela/query`, `vela/terraform` and `vela/helm`. See [Packages a step can import](/workflow/next/guides/authoring/cue-actions#packages-a-step-can-import).

## Application Operations

### Load

Load all the components and its traits in the application.

**Parameters**

```cue
#Load: {
	// +usage=If specify `app`, use specified application to load its component resources otherwise use current application
	app?: string
	// +usage=The value of the components will be filled in this field after the action is executed, you can use value[componentName] to refer a specified component
	value?: {...}
}
```

**Example**

```cue
import "vela/op"

// Use load.value[componentName] to refer to a component.
load: op.#Load & {}

mycomp: load.value["my-comp"]
```

### ApplyComponent

Create or update resources corresponding to the component in Kubernetes cluster. Note that need to use `Load` first to apply the resources.

**Parameters**

```cue
#ApplyComponent: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The env to use
	env: *"" | string
	// +usage=The namespace to apply
	namespace: *"" | string
	// +usage=Whether to wait healthy of the applied component
	waitHealthy: *true | bool
	// +usage=The value of the component resource
	value: {...}
	// +usage=The patcher that will be applied to the resource, you can define the strategy of list merge through comments. Reference doc here: https://kubevela.io/docs/platform-engineers/traits/patch-trait#patch-in-workflow-step
	patch?: {...}
}
```

**Example**

```cue
import "vela/op"

load: op.#Load & {}

apply: op.#ApplyComponent & {
	value: load.value["my-comp"]
}
```

### ApplyApplication

Create or update resources corresponding to the application in Kubernetes cluster.

**Parameters**

```cue
#ApplyApplication: {}
```

**Example**

```cue
import "vela/op"

apply: op.#ApplyApplication & {}
```
