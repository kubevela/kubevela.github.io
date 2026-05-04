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

<details>
<summary>go get command</summary>

```shell
go get github.com/oam-dev/kubevela/pkg/definition/defkit
```

</details>

<details>
<summary>Example go.mod</summary>

```go
module my-platform

go 1.23.8

require (
    github.com/oam-dev/kubevela v1.11.0
)
```

</details>

## Package Structure

Organize definitions by type in separate packages. Each package registers its definitions via `init()`:

<details>
<summary>Module directory layout</summary>

```shell
my-platform/
├── module.yaml              # Module metadata (name, description, version)
├── go.mod
├── go.sum
├── cmd/register/main.go     # Registry entry point — imports all packages
├── components/
│   ├── webservice.go        # ComponentDefinition — Deployment workload
│   ├── worker.go            # ComponentDefinition — background worker
│   └── statefulset.go       # ComponentDefinition — StatefulSet workload
├── traits/
│   ├── env.go               # TraitDefinition — environment variables
│   ├── scaler.go            # TraitDefinition — replica scaling
│   └── hpa.go               # TraitDefinition — HPA autoscaling
├── policies/
│   ├── override.go          # PolicyDefinition — parameter override
│   └── garbage-collect.go   # PolicyDefinition — GC policies
└── workflowsteps/
    ├── deploy.go             # WorkflowStepDefinition — deploy step
    └── apply-object.go      # WorkflowStepDefinition — apply K8s object
```

</details>

## The cmd/register/main.go Pattern

The entry point binary aggregates all definitions by blank-importing each package. Blank imports trigger the `init()` function in each package, which calls `defkit.Register()`. The `main()` function then calls `defkit.ToJSON()` to emit all registered definitions as JSON for the `vela def apply-module` command to consume.

<details>
<summary>cmd/register/main.go</summary>

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

</details>

:::warning
`Register()` validates placement constraints at init time. If a definition has conflicting placement (e.g. the same label condition in both `RunOn` and `NotRunOn`), `Register()` **panics** to catch the error early during initialization rather than at deploy time.
:::

## Registry Query Functions

The registry provides query functions for filtering registered definitions. These are used internally by the CLI but are also useful in tests and tooling.

| Function | Returns | Description |
|---|---|---|
| `defkit.All()` | `[]Definition` | All registered definitions. |
| `defkit.Components()` | `[]*ComponentDefinition` | Only ComponentDefinitions. |
| `defkit.Traits()` | `[]*TraitDefinition` | Only TraitDefinitions. |
| `defkit.Policies()` | `[]*PolicyDefinition` | Only PolicyDefinitions. |
| `defkit.WorkflowSteps()` | `[]*WorkflowStepDefinition` | Only WorkflowStepDefinitions. |
| `defkit.Count()` | `int` | Number of registered definitions. |
| `defkit.Clear()` | — | Resets the registry. Use in tests to isolate test cases. |

## ToJSON() Output Schema

`defkit.ToJSON()` serializes all registered definitions into a JSON payload that `vela def apply-module` consumes:

<details>
<summary>JSON schema</summary>

```json
{
  "definitions": [
    {
      "name": "webservice",
      "type": "component",
      "cue": "webservice: {\n  type: \"component\"\n  ...\n}\ntemplate: { ... }",
      "placement": {
        "runOn": [
          { "key": "provider", "operator": "Eq", "values": ["aws"] }
        ],
        "notRunOn": [
          { "key": "cluster-type", "operator": "Eq", "values": ["vcluster"] }
        ]
      }
    }
  ]
}
```

</details>

The `placement` field is only present when the definition has `RunOn` or `NotRunOn` constraints. Definitions without placement constraints omit the field entirely.

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
