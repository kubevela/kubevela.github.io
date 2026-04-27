---
title: Quick Start
---

From zero to a working KubeVela ComponentDefinition in 4 steps.

:::warning **Prerequisites**
- Go 1.23.8 or later
- CUE v0.14.1 or later
- A Kubernetes cluster with KubeVela v1.11.0 or later installed
- The `vela` CLI installed locally
:::

## Step 1: Initialize a definition module

Use the `vela` CLI to scaffold the Go module with the correct directory structure.

<details>
<summary>CLI command</summary>

```shell
vela def init-module --name my-platform \
  --components webservice,worker \
  --traits scaler
```

</details>

## Step 2: Write a definition in Go

Open the scaffolded file and use the defkit fluent API to define parameters and template.

<details>
<summary>Go source</summary>

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

</details>


:::tip
See [ComponentDefinition](./definition-component.md) for the full list of chain methods and parameter types.
:::

## Step 3: Validate and generate

Validate the module compiles and generates valid CUE. Optionally generate raw CUE files for inspection.

<details>
<summary>CLI commands</summary>

```shell
vela def validate-module ./my-platform
vela def list-module ./my-platform

# Generate raw CUE files (optional — for inspection)
vela def gen-module ./my-platform -o ./generated-cue
```

</details>

<details>
<summary>Generated CUE output</summary>

```cue title="CUE — generated"
webservice: {
  type: "component"
  annotations: {}
  labels: {}
  description: "Web service component"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind: "Deployment"
      }
      type: "deployments.apps"
    }
  }
}

template: {
  output: {
    apiVersion: "apps/v1"
    kind: "Deployment"
    metadata: {
      name: context.name
    }
    spec: {
      replicas: parameter.replicas
    }
  }
  parameter: {
    image: string
    replicas: *1 | int
  }
}
```

</details>

## Step 4: Apply to cluster

Deploy all definitions to your KubeVela cluster in one command.

<details>
<summary>CLI commands</summary>

```shell
# Dry-run first
vela def apply-module ./my-platform --dry-run

# Apply (overwrite if definitions already exist)
vela def apply-module ./my-platform --conflict overwrite
```

</details>

## Next Steps

- [ComponentDefinition](./definition-component.md) — full API reference for component builders
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [Architecture](./architecture.md) — understand the Go → CUE → Kubernetes pipeline
