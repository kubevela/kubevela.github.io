---
title: Definition Modules
---

A definition module is a Go module of defkit definitions with a `module.yaml` at its root. `vela def apply-module` compiles the Go to CUE and applies every definition in it, along with the module's placement rules and hooks. Each definition type maps to a Kubernetes CRD managed by the KubeVela controller.

## Definition Types

| Definition Type | API Group | Purpose |
|---|---|---|
| `ComponentDefinition` | `core.oam.dev/v1beta1` | Defines a workload type. Maps Go template to Kubernetes resources (Deployment, StatefulSet, Job, etc.). End users reference by name in Application YAML. |
| `TraitDefinition` | `core.oam.dev/v1beta1` | Patches or augments a workload. Uses CUE patch semantics to modify the primary output (e.g., inject env vars, set replica count, add sidecars). |
| `PolicyDefinition` | `core.oam.dev/v1beta1` | Controls deployment topology and behavior. Used for multi-cluster override, garbage collection rules, and apply-once semantics. |
| `WorkflowStepDefinition` | `core.oam.dev/v1beta1` | Defines automation steps for the application workflow engine. Steps run sequentially or in parallel as part of Application deployment. |

## module.yaml

`module.yaml` names the module and sets what applies to all of its definitions:

```yaml title="module.yaml"
apiVersion: core.oam.dev/v1beta1
kind: DefinitionModule
metadata:
  name: my-platform
spec:
  description: Platform definitions for the payments team
  maintainers:
    - name: Platform Team
      email: platform@example.com
  categories:
    - platform
  minVelaVersion: v1.12.0
  placement:
    runOn:
      - key: provider
        operator: Eq
        values: ["aws"]
  hooks:
    pre-apply:
      - path: hooks/pre
        wait: true
```

| Field | Description |
|---|---|
| `metadata.name` | The module's name. |
| `spec.description` | What the module is for. |
| `spec.maintainers` | Who looks after it: a list of `name` and `email`. |
| `spec.categories` | Labels for grouping modules. KubeVela doesn't act on them. |
| `spec.minVelaVersion` | The oldest KubeVela the module works with. `vela def validate-module` fails when the `vela` CLI is older. |
| `spec.placement` | Which clusters the module's definitions apply to. See [Placement](#placement). |
| `spec.hooks` | Manifests to apply and scripts to run before and after the definitions. See [Module Hooks](./module-hooks.md). |

### Placement

The `placement:` block sets module-wide defaults. Any definition that does not declare its own `.RunOn()` / `.NotRunOn()` inherits it; a definition that declares its own placement ignores the module block completely (override, not merge). Module hooks always run, whatever the placement results.

| YAML key | Type | Description |
|---|---|---|
| `spec.placement.runOn` | `[]Condition` | All conditions must match for the module's definitions to be applied. Omit or leave empty to skip the gate. |
| `spec.placement.notRunOn` | `[]Condition` | If any condition matches, every definition in the module without its own placement is skipped. |

Each `Condition` entry has this shape:

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Cluster label key to match (ConfigMap-safe: no `/`). |
| `operator` | `string` | One of `Eq`, `Ne`, `In`, `NotIn`, `Exists`, `NotExists` (case-sensitive). |
| `values` | `[]string` | Values to compare. Required for `Eq`, `Ne`, `In`, `NotIn`. Ignored by `Exists`, `NotExists`. |

When `vela def apply-module` runs it prints the labels it evaluated against, for example `Cluster labels: environment=production, provider=aws, region=us-west-2`. A `Cluster labels: (no labels)` line means the label ConfigMap is absent or empty: `RunOn` rules fail and `NotRunOn` rules pass. For labelling clusters and per-definition placement, see [Cluster Placement](./cluster-placement.md).

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

go 1.27.1

require (
    github.com/oam-dev/kubevela v1.12.0
)
```

</details>

KubeVela 1.12 needs Go 1.27.1 or later. `go mod tidy` raises the `go` line of a scaffolded module to match what KubeVela requires.

## Package Structure

Organize definitions by type in separate packages. Each package registers its definitions via `init()`:

<details>
<summary>Module directory layout</summary>

```shell
my-platform/
├── module.yaml              # Module metadata, placement and hooks
├── go.mod
├── go.sum
├── cmd/register/main.go     # Registry entry point: imports all packages
├── components/
│   ├── webservice.go        # ComponentDefinition: Deployment workload
│   ├── worker.go            # ComponentDefinition: background worker
│   └── statefulset.go       # ComponentDefinition: StatefulSet workload
├── traits/
│   ├── env.go               # TraitDefinition: environment variables
│   ├── scaler.go            # TraitDefinition: replica scaling
│   └── hpa.go               # TraitDefinition: HPA autoscaling
├── policies/
│   ├── override.go          # PolicyDefinition: parameter override
│   └── garbage-collect.go   # PolicyDefinition: GC policies
└── workflowsteps/
    ├── deploy.go             # WorkflowStepDefinition: deploy step
    └── apply-object.go      # WorkflowStepDefinition: apply K8s object
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
    "os"

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
    output, err := defkit.ToJSON()
    if err != nil {
        fmt.Fprintf(os.Stderr, "failed to serialize registry: %v\n", err)
        os.Exit(1)
    }
    fmt.Print(string(output))
}
```

</details>

:::warning
`Register()` checks each definition as it registers it and **panics** when one is invalid, so the mistake stops the module at initialization rather than at deploy time. It panics on:

- **conflicting placement**, e.g. the same label condition in both `RunOn` and `NotRunOn`;
- **an invalid definition**: a reference (`ComponentRef`, `TraitRef`) registered as if it were a definition, a definition that breaks the rules of the parent it extends, or a policy that uses `Priority`, `CtxSchema`, `Output` or `Enabled` without `ApplicationScoped()`;
- **invalid restrictions**: malformed namespace restrictions or quotas, such as a negative quota count, or a quota with an empty selector that is not the last entry.
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
| `defkit.Clear()` |: | Resets the registry. Use in tests to isolate test cases. |

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

`apply-module` compiles Go → CUE → YAML and applies to the cluster in one step. For its flags (`--types`, `--prefix`, `--conflict`, `--skip-hooks` and the rest) and for applying a module straight from its repository, see [Share and Version a Module](./share-a-module.md).

## Related

- [Architecture](./architecture.md): understand the full pipeline
- [Cluster Placement](./cluster-placement.md): choose the clusters each definition applies to
- [Module Hooks](./module-hooks.md): run manifests and scripts around the apply
- [Share and Version a Module](./share-a-module.md): publish a module and apply it by version
- [Register & Output](./definition-register.md): `defkit.Register()` and `defkit.ToJSON()` details
- [Quick Start](./quick-start.md): end-to-end walkthrough
