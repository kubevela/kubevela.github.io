---
title: Trait Definitions
---

In this section, we will introduce how to build TraitDefinitions using the defkit Go SDK.

:::tip
Before reading this section, make sure you've read [Getting Started with defkit](./overview.md). For the CUE-based approach, see [Trait Definition (CUE)](../traits/customize-trait.md).
:::

## Declare a Trait

Use `NewTrait` to create a trait definition:

```go title="scaler.go"
replicas := defkit.Int("replicas").Default(1).Description("Number of replicas")

trait := defkit.NewTrait("scaler").
    Description("Manually scale K8s pod for your workload.").
    AppliesTo("deployments.apps", "statefulsets.apps").
    PodDisruptive(false).
    Params(replicas)
```

<details>
<summary>Generated CUE output</summary>

```cue title="scaler.cue"
scaler: {
	type: "trait"
	annotations: {}
	description: "Manually scale K8s pod for your workload."
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps", "statefulsets.apps"]
	}
}
template: parameter: {
	// +usage=Number of replicas
	replicas: *1 | int
}
```

</details>

### Trait Configuration Methods

| Method | Description |
|:-------|:-----------|
| `.AppliesTo(workloads...)` | Which workload types this trait can be applied to |
| `.ConflictsWith(traits...)` | Traits that conflict with this one |
| `.PodDisruptive(bool)` | Whether applying this trait restarts pods |
| `.Stage(stage)` | `"PreDispatch"` or `"PostDispatch"` |
| `.Labels(map)` | Metadata labels (e.g., `{"ui-hidden": "true"}`) |

Example with all options:

```go title="hpa.go"
trait := defkit.NewTrait("hpa").
    Description("HPA scaler trait.").
    AppliesTo("deployments.apps").
    ConflictsWith("scaler", "cpuscaler").
    Stage("PostDispatch").
    PodDisruptive(false).
    Labels(map[string]string{"ui-hidden": "true"})
```

## Patch Traits

Most traits modify the workload resource by patching it. Use `tpl.Patch()` inside the template:

```go title="scaler.go"
replicas := defkit.Int("replicas").Default(1)

trait := defkit.NewTrait("scaler").
    Description("Manually scale K8s pod.").
    AppliesTo("deployments.apps", "statefulsets.apps").
    PodDisruptive(false).
    Params(replicas).
    Template(func(tpl *defkit.Template) {
        tpl.PatchStrategy("retainKeys").
            Patch().Set("spec.replicas", replicas)
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="scaler_patch.cue"
scaler: {
	type: "trait"
	annotations: {}
	description: "Manually scale K8s pod."
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps", "statefulsets.apps"]
	}
}
template: {
	// +patchStrategy=retainKeys
	patch: spec: replicas: parameter.replicas
	parameter: replicas: *1 | int
}
```

</details>

## Advanced Patch Operations

### SpreadIf -- Spread a Map Conditionally

Spread all key-value pairs from a map parameter into a field:

```go title="label_trait.go"
labels := defkit.Object("labels")

trait := defkit.NewTrait("label").
    Description("Add labels").
    AppliesTo("deployments.apps").
    Params(labels).
    Template(func(tpl *defkit.Template) {
        tpl.Patch().
            SpreadIf(labels.IsSet(), "spec.template.metadata.labels", labels)
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="label_spread.cue"
label: {
	type: "trait"
	annotations: {}
	description: "Add labels"
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps"]
	}
}
template: patch: spec: template: metadata: labels: parameter: labels?: {...}
```

</details>

### ForEach -- Iterate a Map

Iterate over a map parameter and apply each key-value pair:

```go title="label_foreach.go"
labels := defkit.Object("labels")

trait := defkit.NewTrait("label-foreach").
    Description("Add labels via ForEach").
    AppliesTo("deployments.apps").
    Params(labels).
    Template(func(tpl *defkit.Template) {
        tpl.Patch().ForEach(labels, "spec.template.metadata.labels")
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="label_foreach.cue"
"label-foreach": {
	type: "trait"
	annotations: {}
	description: "Add labels via ForEach"
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps"]
	}
}
template: {
	patch: spec: template: metadata: labels: {
		for k, v in parameter.labels {
			(k): v
		}
	}
	parameter: labels?: {...}
}
```

</details>

### If/EndIf -- Conditional Patch Block

Apply patches only when a condition is met:

```go title="conditional.go"
enabled := defkit.Bool("enabled")
replicas := defkit.Int("replicas")

trait := defkit.NewTrait("conditional").
    Description("Conditional scaling").
    AppliesTo("deployments.apps").
    Params(enabled, replicas).
    Template(func(tpl *defkit.Template) {
        cond := defkit.Eq(enabled, defkit.Lit(true))
        tpl.Patch().
            If(cond).
            Set("spec.replicas", replicas).
            EndIf()
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="conditional.cue"
conditional: {
	type: "trait"
	annotations: {}
	description: "Conditional scaling"
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps"]
	}
}
template: {
	patch: spec: {
		if parameter.enabled == true {
			replicas: parameter.replicas
		}
	}
	parameter: {
		enabled?:  bool
		replicas?: int
	}
}
```

</details>

### PatchKey -- Patch Array Elements by Key

Add or modify array elements matched by a key field (e.g., sidecar injection):

```go title="sidecar.go"
containerName := defkit.String("containerName")
image := defkit.String("image")

trait := defkit.NewTrait("sidecar").
    Description("Add sidecar container").
    AppliesTo("deployments.apps").
    Params(containerName, image).
    Template(func(tpl *defkit.Template) {
        container := defkit.NewArrayElement().
            Set("name", containerName).
            Set("image", image)
        tpl.Patch().PatchKey("spec.template.spec.containers", "name", container)
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="sidecar.cue"
sidecar: {
	type: "trait"
	annotations: {}
	description: "Add sidecar container"
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["deployments.apps"]
	}
}
template: {
	patch: spec: template: spec: {
		// +patchKey=name
		containers: [{
			name:  parameter.containerName
			image: parameter.image
		}]
	}
	parameter: {
		containerName?: string
		image?:         string
	}
}
```

</details>

### Passthrough -- Forward All Parameters

Forward the entire parameter object as the patch:

```go title="json_patch.go"
trait := defkit.NewTrait("json-patch").
    Description("Apply JSON patch").
    AppliesTo("*").
    Params(defkit.OpenStruct()).
    Template(func(tpl *defkit.Template) {
        tpl.Patch().Passthrough()
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="json_patch.cue"
"json-patch": {
	type: "trait"
	annotations: {}
	description: "Apply JSON patch"
	attributes: {
		podDisruptive: false
		appliesToWorkloads: ["*"]
	}
}
template: {
	patch: parameter
	parameter: {...}
}
```

</details>

## Resource-Producing Traits

Traits can also create new resources (e.g., a Service) rather than patching the workload:

```go title="expose.go"
trait := defkit.NewTrait("expose").
    Description("Expose workload via Service").
    AppliesTo("deployments.apps").
    Stage("PostDispatch").
    Params(
        defkit.Int("port").Default(80).Description("Service port"),
        defkit.String("type").Default("ClusterIP").Description("Service type"),
    ).
    Template(func(tpl *defkit.Template) {
        service := defkit.NewResource("v1", "Service").
            Set("metadata.name", defkit.VelaCtx().Name()).
            Set("spec.type", defkit.ParamRef("type")).
            Set("spec.ports[0].port", defkit.ParamRef("port"))
        tpl.Outputs("service", service)
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="expose.cue"
expose: {
	type: "trait"
	annotations: {}
	description: "Expose workload via Service"
	attributes: {
		podDisruptive: false
		stage:         "PostDispatch"
		appliesToWorkloads: ["deployments.apps"]
	}
}
template: {
	outputs: service: {
		apiVersion: "v1"
		kind:       "Service"
		metadata: name: context.name
		spec: {
			type: parameter.type
			ports: [{
				port: parameter.port
			}]
		}
	}
	parameter: {
		// +usage=Service port
		port: *80 | int
		// +usage=Service type
		type: *"ClusterIP" | string
	}
}
```

</details>

## Reading Component Context

Traits can inspect the component's output resource using `ContextOutput()`:

```go title="context.go"
// Reference the component's output
ref := defkit.ContextOutput()

// Access nested fields
templateRef := defkit.ContextOutput().Field("spec.template")

// Check if a path exists (for conditional patches)
hasTemplate := defkit.ContextOutput().HasPath("spec.template")

patch := defkit.NewPatchResource()
patch.If(hasTemplate).
    Set("spec.template.metadata.labels.app", defkit.Lit("test")).
    EndIf()
```

## Raw CUE

For complex patch logic that cannot be expressed with the Go builder API, use `.RawCUE()`:

```go title="raw_trait.go"
trait := defkit.NewTrait("scaler").RawCUE(`scaler: {
    type: "trait"
    description: "Raw CUE trait"
}
template: {
    patch: spec: replicas: parameter.replicas
    parameter: replicas: *1 | int
}`)
```

You can also supply just the template block while keeping the Go builder for metadata:

```go title="raw_template.go"
trait := defkit.NewTrait("custom-patch").
    Description("Custom patch trait").
    AppliesTo("deployments.apps").
    RawCUE(`
#PatchParams: {
    containerName: *"" | string
    command: *null | [...string]
}
patch: spec: template: spec: containers: [{name: parameter.containerName}]
parameter: #PatchParams
`)
```

:::caution
When using `.RawCUE()`, the raw string is used as-is for the CUE definition. If you provide a complete definition (with the top-level name and `template:` block), it replaces the builder output entirely. If you provide only the template body, it is wrapped with the builder-generated metadata.
:::

## Generating Output

```go title="generate.go"
// CUE definition
cue := trait.ToCue()

// Kubernetes YAML manifest
yamlBytes, err := trait.ToYAML()
```

## Applying Trait Definitions

```bash
# Validate all definitions in your module
vela def validate-module ./my-platform

# Apply all definitions (or just traits)
vela def apply-module ./my-platform
vela def apply-module ./my-platform --types trait

# List applied trait definitions
vela def list -t trait

# View reference documentation for the trait
vela def show scaler
```

For the full CLI reference, see [Applying Definitions](./overview.md#applying-definitions-with-the-vela-cli).

## What's Next

- [Policy Definitions](./policies.md) -- Building policy definitions
- [Parameter Types](./parameters.md) -- Complete parameter type reference
- [Health and Status](./health-and-status.md) -- Adding health checks to traits
