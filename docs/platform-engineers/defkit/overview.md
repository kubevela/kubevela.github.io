---
title: Getting Started with defkit
---

In this section, we will introduce how to use the **defkit Go SDK** to author KubeVela X-Definitions in Go. Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition.md).

:::tip
If you prefer to author definitions using CUE directly, see [Manage Definition with CUE](../cue/basic.md).
:::

## What is defkit?

defkit is a Go SDK that lets platform engineers author KubeVela X-Definitions (ComponentDefinition, TraitDefinition, PolicyDefinition, WorkflowStepDefinition) using native Go code. The Go code compiles to CUE transparently -- you never need to write or see CUE.

**Benefits:**
- **Type safety** -- Catch errors at compile time, not at deploy time
- **IDE support** -- Full autocompletion, inline docs, and refactoring in any Go IDE
- **Testable** -- Unit test your definitions with standard Go testing and Gomega matchers
- **Distributable** -- Share definitions as standard Go packages via `go get`

## When to Use Go vs CUE

| Scenario | Recommendation |
|:---------|:--------------|
| Team already proficient in Go | Use defkit |
| Simple definitions with few parameters | CUE is fine |
| Complex template logic with conditionals | defkit provides clearer structure |
| Need unit testing without a cluster | defkit with Gomega matchers |
| Quick one-off definitions | CUE is simpler to start |

Both approaches produce the same CUE output that the KubeVela controller consumes. You can mix Go-authored and CUE-authored definitions in the same cluster.

## Prerequisites

- **Go 1.23+**
- **KubeVela 1.10+**
- **vela CLI** installed

## Your First Definition

Here is a minimal component definition that creates a Deployment workload with an `image` parameter:

```go title="webservice.go"
package main

import (
    "fmt"

    "github.com/oam-dev/kubevela/pkg/definition/defkit"
)

func main() {
    comp := defkit.NewComponent("webservice").
        Description("Web service component").
        Workload("apps/v1", "Deployment").
        Params(
            defkit.String("image").Required().Description("Container image"),
            defkit.Int("replicas").Default(1),
        )

    fmt.Println(comp.ToCue())
}
```

This generates the following CUE definition:

<details>
<summary>Generated CUE output</summary>

```cue title="webservice.cue"
webservice: {
    annotations: {}
    attributes: workload: definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
    }
    description: "Web service component"
    labels: {}
    type: "component"
}

template: {
    output: {}
    outputs: {}
    parameter: {
        // +usage=Container image
        image: string
        replicas: *1 | int
    }
}
```

</details>

The key things to note:
- `NewComponent("webservice")` sets the definition name
- `.Workload("apps/v1", "Deployment")` declares the workload type
- `String("image").Required()` generates `image: string` (no `?`, meaning required)
- `Int("replicas").Default(1)` generates `replicas: *1 | int` (optional with default)

## Adding a Template

To define what Kubernetes resources the component creates, add a template:

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

In the template:
- `defkit.VelaCtx().Name()` references the component name at runtime (generates `context.name` in CUE)
- `tpl.Output(...)` sets the primary Kubernetes resource
- `tpl.Outputs("service", ...)` adds auxiliary resources
- `.Set("path", value)` sets fields using dot notation and bracket syntax for array indices

## Export as YAML

To generate the Kubernetes YAML manifest directly:

```go title="export.go"
yamlBytes, err := comp.ToYAML()
if err != nil {
    log.Fatal(err)
}
fmt.Println(string(yamlBytes))
```

<details>
<summary>Generated YAML output</summary>

```yaml title="webservice.yaml"
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: webservice
  annotations:
    definition.oam.dev/description: "Web service component"
spec:
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
  schematic:
    cue:
      template: |
        ...
```

</details>

## Creating a Definition Module

The `vela def init-module` command scaffolds a complete Go module with the proper directory structure, `go.mod`, registration entry point, and optional definition files:

```bash
# Initialize a new module with scaffolded component and trait definitions
vela def init-module --name my-platform --components webservice,worker --traits scaler

# Initialize with a custom Go module path
vela def init-module ./my-defs --name my-defs --go-module github.com/myorg/my-defs

# Initialize with example definitions included
vela def init-module --name my-platform --with-examples
```

This creates the following structure:

```
my-platform/
├── module.yaml              # Module metadata (name, description, version)
├── go.mod
├── go.sum
├── README.md
├── cmd/register/main.go     # Registry entry point
├── components/
│   ├── webservice.go        # Scaffolded component definition
│   └── worker.go
├── traits/
│   └── scaler.go            # Scaffolded trait definition
├── policies/
└── workflowsteps/
```

You then edit the scaffolded Go files to define your templates, parameters, and health checks using the defkit API.

## Applying Definitions with the vela CLI

The vela CLI provides dedicated module commands for working with Go definition modules. These handle compilation, validation, and deployment in a single step -- no manual `go run` or CUE file management needed.

### Validate the Module

```bash
# Validate all definitions compile and generate valid CUE
vela def validate-module ./my-platform
```

This checks that all Go definition files can be parsed, all definitions generate valid CUE, and module metadata is valid.

### List Definitions in a Module

```bash
# Preview what definitions are in the module
vela def list-module ./my-platform

# List only component definitions
vela def list-module ./my-platform --types component
```

### Apply the Module to the Cluster

```bash
# Apply all definitions from the module
vela def apply-module ./my-platform

# Dry-run to preview what would be applied
vela def apply-module ./my-platform --dry-run

# Apply to a specific namespace
vela def apply-module ./my-platform --namespace my-platform

# Apply only component and trait definitions
vela def apply-module ./my-platform --types component,trait

# Apply with a name prefix to avoid conflicts
vela def apply-module ./my-platform --prefix myorg-

# Overwrite existing definitions
vela def apply-module ./my-platform --conflict overwrite
```

The `--conflict` flag controls what happens when a definition already exists:
- `fail` (default) -- Stop if any definition already exists
- `skip` -- Skip definitions that already exist
- `overwrite` -- Overwrite existing definitions
- `rename` -- Rename conflicting definitions with a suffix

### Apply from a Remote Go Module

```bash
# Apply definitions from a published Go module
vela def apply-module github.com/myorg/definitions@v1.0.0
```

### Generate CUE Files

If you need the raw CUE files (e.g., for inspection or to use with `vela def apply`):

```bash
# Generate CUE files organized by type
vela def gen-module ./my-platform -o ./generated-cue

# Generate only component definitions
vela def gen-module ./my-platform -o ./output --types component
```

This writes CUE files into subdirectories (`components/`, `traits/`, `policies/`, `workflowsteps/`).

### Verify and Inspect Applied Definitions

After applying, you can use the standard `vela def` commands to inspect:

```bash
# List applied definitions
vela def list -t component

# Get a specific definition
vela def get webservice

# View generated reference documentation
vela def show webservice

# Delete a definition
vela def del webservice -t component
```

## What's Next

- [Component Definitions](./components.md) -- Full guide to building components with templates, conditionals, and collections
- [Parameter Types](./parameters.md) -- Reference for all parameter types (`String`, `Int`, `Bool`, `Struct`, `Enum`, etc.)
- [Trait Definitions](./traits.md) -- Building traits with patch operations
- [Testing Definitions](./testing.md) -- Unit testing with Gomega matchers
