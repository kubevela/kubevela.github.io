---
title: Integration
---

defkit integrates with the KubeVela ecosystem through well-defined extension points. Each definition type maps to a Kubernetes CRD managed by the KubeVela controller.

## Definition Types

| Definition Type | API Group | Purpose |
|---|---|---|
| `ComponentDefinition` | `core.oam.dev/v1beta1` | Defines a workload type. Maps Go template to Kubernetes resources (Deployment, StatefulSet, Job, etc.). End users reference by name in Application YAML. |
| `TraitDefinition` | `core.oam.dev/v1beta1` | Patches or augments a workload. Uses CUE patch semantics to modify the primary output (e.g., inject env vars, set replica count, add sidecars). |
| `PolicyDefinition` | `core.oam.dev/v1alpha1` | Controls deployment topology and behavior. Used for multi-cluster override, garbage collection rules, and apply-once semantics. |
| `WorkflowStepDefinition` | `core.oam.dev/v1beta1` | Defines automation steps for the application workflow engine. Steps run sequentially or in parallel as part of Application deployment. |

## go.mod Setup

Add defkit as a dependency using the KubeVela module:

```shell
go get github.com/oam-dev/kubevela/pkg/definition/defkit
```

A typical `go.mod` for a definition module:

```go
module my-platform

go 1.21

require (
    github.com/oam-dev/kubevela v1.9.0
)
```

:::info
The repository uses a replace directive in `go.mod` pointing to a custom KubeVela fork when working from the `vela-go-definitions` reference implementation. Check the upstream module's `go.mod` for the exact version pin.
:::

## Package Structure

Organize definitions by type in separate packages. Each package registers its definitions via `init()`:

```shell
my-platform/
├── module.yaml
├── go.mod
├── cmd/
│   └── register/
│       └── main.go      # Entry point — blank-imports all packages
├── components/
│   └── webservice.go    # package components
├── traits/
│   └── env.go           # package traits
├── policies/
│   └── apply-once.go    # package policies
└── workflowsteps/
    └── deploy.go        # package workflowsteps
```

## The cmd/register/main.go Pattern

The entry point binary aggregates all definitions by blank-importing each package. Blank imports trigger the `init()` function in each package, which calls `defkit.Register()`. The `main()` function then calls `defkit.ToJSON()` to emit all registered definitions as JSON for the `vela def apply-module` command to consume.

```go title="cmd/register/main.go"
package main

import (
    "fmt"
    "github.com/oam-dev/kubevela/pkg/definition/defkit"

    // Blank imports trigger init() in each package,
    // registering all definitions automatically
    _ "my-platform/components"
    _ "my-platform/traits"
    _ "my-platform/policies"
    _ "my-platform/workflowsteps"
)

func main() {
    // Exports all registered definitions as JSON
    fmt.Println(defkit.ToJSON())
}
```

## Health Evaluation

defkit's Health DSL generates `status.customStatus` and `status.healthPolicy` CUE blocks. The controller determines component health from these. Use preset builders like `DeploymentHealth()` or provide a custom health policy expression.

## vela CLI Integration

The `vela def` subcommands handle compilation, validation, and deployment:

| Command | Purpose |
|---|---|
| `vela def validate-module ./my-platform` | Validate the Go module compiles and generates valid CUE |
| `vela def list-module ./my-platform` | List all definitions in the module |
| `vela def gen-module ./my-platform -o ./out` | Generate raw CUE files for inspection |
| `vela def apply-module ./my-platform --dry-run` | Preview what would be applied |
| `vela def apply-module ./my-platform --conflict overwrite` | Apply all definitions to the cluster |

`apply-module` compiles Go → CUE → YAML and applies to the cluster in one step.

## Related

- [Architecture](./architecture.md) — understand the full pipeline
- [Register & Output](./definition-register.md) — `defkit.Register()` and `defkit.ToJSON()` details
- [Quick Start](./quick-start.md) — end-to-end walkthrough
