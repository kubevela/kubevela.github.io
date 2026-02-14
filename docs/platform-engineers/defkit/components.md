---
title: Component Definitions
---

In this section, we will introduce how to build ComponentDefinitions using the defkit Go SDK.

:::tip
Before reading this section, make sure you've read [Getting Started with defkit](./overview.md) and understand the [Definition Concept](../../getting-started/definition.md). For the CUE-based approach, see [Component Definition (CUE)](../components/custom-component.md).
:::

## Declare a Component

Use `NewComponent` to create a component definition with a name, description, workload type, and parameters:

```go title="webservice.go"
image := defkit.String("image").Required().Description("Container image")
replicas := defkit.Int("replicas").Default(1)

comp := defkit.NewComponent("webservice").
    Description("Describes long-running, scalable, containerized services").
    Workload("apps/v1", "Deployment").
    Params(image, replicas)
```

<details>
<summary>Generated CUE output</summary>

```cue title="webservice.cue"
webservice: {
	type: "component"
	annotations: {}
	labels: {}
	description: "Describes long-running, scalable, containerized services"
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
	}
}
template: {
	parameter: {
		// +usage=Container image
		image: string
		replicas: *1 | int
	}
}
```

</details>

Key points:
- **Name** -- The definition name used in Application YAML (`NewComponent("webservice")`)
- **Workload** -- The Kubernetes resource type (`.Workload("apps/v1", "Deployment")`)
- **Params** -- The configurable parameters exposed to end users (see [Parameter Types](./parameters.md))

The workload type is automatically inferred for common resources:

| apiVersion | Kind | Inferred Type |
|:-----------|:-----|:-------------|
| apps/v1 | Deployment | deployments.apps |
| apps/v1 | StatefulSet | statefulsets.apps |
| apps/v1 | DaemonSet | daemonsets.apps |
| batch/v1 | Job | jobs.batch |
| batch/v1 | CronJob | cronjobs.batch |

## Adding a Template

A template defines what Kubernetes resources the component creates. Use `NewResource` to build resources and `.Set()` to assign fields:

```go title="webservice.go"
comp := defkit.NewComponent("webservice").
    Description("Web service component").
    Workload("apps/v1", "Deployment").
    Params(defkit.String("name")).
    Template(func(tpl *defkit.Template) {
        tpl.Output(
            defkit.NewResource("apps/v1", "Deployment").
                Set("metadata.name", defkit.ParamRef("name")),
        )
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="webservice_template.cue"
webservice: {
	type: "component"
	annotations: {}
	labels: {}
	description: "Web service component"
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
	}
}
template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: {
			name: parameter.name
		}
	}
	parameter: {
		name?: string
	}
}
```

</details>

The `.Set()` method uses dot notation for nested paths and bracket syntax for array indices:
- `"metadata.name"` -- nested field
- `"spec.template.spec.containers[0].image"` -- array index

## Compose Multiple Resources

Use `tpl.Outputs("name", resource)` to add auxiliary Kubernetes resources alongside the primary output:

```go title="webservice.go"
image := defkit.String("image").Required().Description("Container image")
replicas := defkit.Int("replicas").Default(1)
port := defkit.Int("port").Default(80)

comp := defkit.NewComponent("webservice").
    Description("Web service component").
    Workload("apps/v1", "Deployment").
    Params(image, replicas, port).
    Template(func(tpl *defkit.Template) {
        vela := defkit.VelaCtx()
        tpl.Output(
            defkit.NewResource("apps/v1", "Deployment").
                Set("metadata.name", vela.Name()).
                Set("spec.replicas", replicas).
                Set("spec.template.spec.containers[0].image", image).
                Set("spec.template.spec.containers[0].ports[0].containerPort", port),
        )
        tpl.Outputs("service",
            defkit.NewResource("v1", "Service").
                Set("metadata.name", vela.Name()).
                Set("spec.ports[0].port", port),
        )
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="webservice_multi.cue"
webservice: {
	type: "component"
	annotations: {}
	labels: {}
	description: "Web service component"
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
	}
}
template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: {
			name: context.name
		}
		spec: {
			replicas: parameter.replicas
			template: {
				spec: {
					containers: [{
						image: parameter.image
						ports: [{
							containerPort: parameter.port
						}]
					}]
				}
			}
		}
	}
	outputs: {
		service: {
			apiVersion: "v1"
			kind:       "Service"
			metadata: {
				name: context.name
			}
			spec: {
				ports: [{
					port: parameter.port
				}]
			}
		}
	}
	parameter: {
		// +usage=Container image
		image: string
		replicas: *1 | int
		port: *80 | int
	}
}
```

</details>

This generates both:
- `output:` -- the primary Deployment resource
- `outputs: { service: ... }` -- the auxiliary Service resource

## Using VelaContext

`defkit.VelaCtx()` provides access to runtime context values populated by KubeVela. These generate CUE path references.

```go title="context.go"
vela := defkit.VelaCtx()

deploy := defkit.NewResource("apps/v1", "Deployment").
    Set("metadata.name", vela.Name()).
    Set("metadata.namespace", vela.Namespace())
```

### Available Context Variables

| Go Method | CUE Path | Description |
|:----------|:---------|:-----------|
| `vela.Name()` | `context.name` | Component name |
| `vela.Namespace()` | `context.namespace` | Application namespace |
| `vela.AppName()` | `context.appName` | Application name |
| `vela.AppRevision()` | `context.appRevision` | Application revision name |
| `vela.AppRevisionNum()` | `context.appRevisionNum` | Application revision number |
| `vela.Revision()` | `context.revision` | Component revision |
| `vela.ClusterVersion().Major()` | `context.clusterVersion.major` | K8s major version |
| `vela.ClusterVersion().Minor()` | `context.clusterVersion.minor` | K8s minor version |
| `vela.ClusterVersion().GitVersion()` | `context.clusterVersion.gitVersion` | K8s git version string |

## Conditional Fields

Use `.SetIf()` to set fields only when a condition is met:

```go title="conditional.go"
cpu := defkit.String("cpu").Optional()

comp := defkit.NewComponent("test").
    Workload("apps/v1", "Deployment").
    Params(cpu).
    Template(func(tpl *defkit.Template) {
        tpl.Output(
            defkit.NewResource("apps/v1", "Deployment").
                SetIf(cpu.IsSet(), "spec.resources.limits.cpu", cpu),
        )
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="setif.cue"
test: {
	type: "component"
	annotations: {}
	labels: {}
	description: ""
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
	}
}
template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		spec: {
			resources: {
				limits: {
					if parameter.cpu != _|_ {
						cpu: parameter.cpu
					}
				}
			}
		}
	}
	parameter: {
		cpu?: string
	}
}
```

</details>

### Conditional Blocks

For multiple conditional fields under the same condition, use `.If()` / `.EndIf()`:

```go title="conditional_block.go"
enabled := defkit.Bool("enabled")
cond := defkit.Eq(enabled, defkit.Lit(true))

resource := defkit.NewResource("apps/v1", "Deployment").
    If(cond).
        Set("spec.replicas", defkit.Lit(3)).
        Set("metadata.labels.ha", defkit.Lit("true")).
    EndIf()
```

### Conditional Outputs

Use `tpl.OutputsIf()` to create entire auxiliary resources conditionally:

```go title="conditional_output.go"
enabled := defkit.Bool("enabled")
cond := defkit.Eq(enabled, defkit.Lit(true))

tpl.OutputsIf(cond, "service",
    defkit.NewResource("v1", "Service").
        Set("metadata.name", defkit.VelaCtx().Name()),
)
```

## Health Policy and Custom Status

Define health checks and status messages directly on the component:

```go title="health.go"
comp := defkit.NewComponent("webservice").
    Workload("apps/v1", "Deployment").
    CustomStatus("message: \"Running\"").
    HealthPolicy("isHealth: true")
```

For composable health expressions, see [Health and Status](./health-and-status.md).

## Raw CUE Escape Hatch

For rare cases where the Go API cannot express the CUE pattern you need (~5% of cases), use `.RawCUE()`:

```go title="raw_cue.go"
comp := defkit.NewComponent("webservice").RawCUE(`"webservice": {
    type: "component"
    template: {
        output: { apiVersion: "apps/v1", kind: "Deployment" }
    }
}`)
```

:::caution
When using `.RawCUE()`, you bypass the Go builder API entirely. The raw string is used as-is for the CUE definition.
:::

## CUE Imports

Use `.WithImports()` to add CUE standard library imports. Common functions like `StrconvFormatInt` and `StringsToLower` automatically detect the needed import:

```go title="imports.go"
port := defkit.Int("port")

comp := defkit.NewComponent("test").
    Workload("apps/v1", "Deployment").
    Params(port).
    Template(func(tpl *defkit.Template) {
        tpl.Output(
            defkit.NewResource("apps/v1", "Deployment").
                Set("metadata.annotations.port", defkit.StrconvFormatInt(port, 10)),
        )
    })
```

This auto-detects the `strconv` import and includes it in the generated CUE:

```cue
import "strconv"
```

Available CUE function wrappers:
- `defkit.StrconvFormatInt(value, base)` -- converts int to string
- `defkit.StringsToLower(value)` -- converts string to lowercase

You can also add imports explicitly:

```go
comp.WithImports("strconv", "strings", "list")
```

## Generating Output

### CUE Output

```go
cue := comp.ToCue()
fmt.Println(cue)
```

### CUE with Explicit Imports

```go
cue := comp.ToCueWithImports("strconv", "strings")
```

### YAML Manifest

```go
yamlBytes, err := comp.ToYAML()
```

### Parameter Schema Only

```go
schema := comp.ToParameterSchema()
```

## Applying Component Definitions

```bash
# Validate all definitions in your module
vela def validate-module ./my-platform

# Apply all definitions from the module to the cluster
vela def apply-module ./my-platform

# Or apply only component definitions
vela def apply-module ./my-platform --types component

# List applied component definitions
vela def list -t component

# View reference documentation for the component
vela def show webservice
```

For the full CLI reference, see [Applying Definitions](./overview.md#applying-definitions-with-the-vela-cli).

## What's Next

- [Trait Definitions](./traits.md) -- Building traits with patch operations
- [Parameter Types](./parameters.md) -- Complete reference for parameter types
- [Templates and Resources](./templates-and-resources.md) -- Deep dive into the Resource builder and collections API
- [Health and Status](./health-and-status.md) -- Composable health expressions
