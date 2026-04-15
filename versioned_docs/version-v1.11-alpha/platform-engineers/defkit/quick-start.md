---
title: Quick Start
---

From zero to a working KubeVela ComponentDefinition in 4 steps.

## Prerequisites

- Go 1.21 or later
- A running KubeVela cluster with the `vela` CLI installed

## Step 1: Initialize a definition module

Use the `vela` CLI to scaffold the Go module with the correct directory structure.

```shell
vela def init-module --name my-platform \
  --components webservice,worker \
  --traits scaler
```

## Step 2: Write a definition in Go

Open the scaffolded file and use the defkit fluent API to define parameters and template.

```go title="Go — defkit"
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func Webservice() *defkit.ComponentDefinition {
    image    := defkit.String("image")
    replicas := defkit.Int("replicas").Default(1)

    return defkit.NewComponent("webservice").
        Description("Web service component").
        Workload("apps/v1", "Deployment").
        Params(image, replicas).
        Template(webserviceTemplate)
}

func webserviceTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    tpl.Output(
        defkit.NewResource("apps/v1", "Deployment").
            Set("metadata.name", vela.Name()).
            Set("spec.replicas",
                defkit.Reference("replicas")),
    )
}

func init() { defkit.Register(Webservice()) }
```

```cue title="CUE — generated"
webservice: {
  type: "component"
  description: "Web service component"
  attributes: workload: definition: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
  }
}
template: {
  output: {
    apiVersion: "apps/v1"
    kind: "Deployment"
    metadata: name: context.name
    spec: replicas: parameter.replicas
  }
  parameter: {
    // +usage=Container image
    image:    string
    replicas: *1 | int
  }
}
```

:::tip
See [ComponentDefinition](./definition-component.md) for the full list of chain methods and parameter types.
:::

## Step 3: Validate and generate

Validate the module compiles and generates valid CUE. Optionally generate raw CUE files for inspection.

```shell
vela def validate-module ./my-platform
vela def list-module ./my-platform

# Generate raw CUE files (optional — for inspection)
vela def gen-module ./my-platform -o ./generated-cue
```

## Step 4: Apply to cluster

Deploy all definitions to your KubeVela cluster in one command.

```shell
# Dry-run first
vela def apply-module ./my-platform --dry-run

# Apply (overwrite if definitions already exist)
vela def apply-module ./my-platform --conflict overwrite
```

## Next Steps

- [ComponentDefinition](./definition-component.md) — full API reference for component builders
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [Architecture](./architecture.md) — understand the Go → CUE → Kubernetes pipeline
