---
title: Template Output Methods
---

The `*defkit.Template` context object is passed to the template function of a component or trait definition. It manages which Kubernetes resources the definition emits as outputs.

### Template Builder Methods

| Method | Description |
|---|---|
| `tpl.Output(r ...*Resource) *Resource` | Sets the primary output resource — the main Kubernetes object this component creates. Generates the `output: { ... }` block. |
| `tpl.Outputs(name string, r ...*Resource) *Resource` | Adds a named auxiliary output resource. Generates `outputs: { name: { ... } }`. |
| `tpl.OutputsIf(cond, name, r)` | Adds an auxiliary output that only exists when the condition is true. |
| `tpl.OutputsGroupIf(cond, fn func(g *OutputGroup))` | Groups multiple auxiliary outputs under a single condition. |
| `tpl.Patch() *PatchResource` | Gets or creates the patch block for trait definitions. Returns a `*PatchResource` for chaining `Set()`, `SetIf()`, `SpreadIf()`. |
| `tpl.PatchStrategy(strategy string)` | Sets the patch merge strategy. Common values: `"retainKeys"`, `"jsonMergePatch"`, `"jsonPatch"`. |
| `tpl.Helper(name string) *HelperBuilder` | Starts building a named helper variable in the template. Helpers compute intermediate values referenced in outputs. |
| `tpl.StructArrayHelper(name, source)` | Creates a helper that splits a source object's fields into separate typed arrays. |
| `tpl.ConcatHelper(name, source)` | Creates a helper that concatenates arrays from a `StructArrayHelper`. Chain `.Fields(...)` to specify which fields to join. |
| `tpl.DedupeHelper(name, source)` | Creates a helper that deduplicates items by a key field. Chain `.ByKey("name")`. |
| `tpl.AddLetBinding(name string, expr Value)` | Adds a CUE `let` binding: `let name = expr`. Reference with `LetVariable("name")`. |
| `tpl.UsePatchContainer(config PatchContainerConfig)` | Activates the container mutation pattern for trait definitions. |
| `tpl.SetRawPatchBlock(block string)` | Escape hatch: replaces the builder-generated `patch:` block with raw CUE. |
| `tpl.SetRawParameterBlock(block string)` | Escape hatch: replaces the builder-generated `parameter:` block with raw CUE. |
| `tpl.SetRawOutputsBlock(block string)` | Escape hatch: replaces the builder-generated `outputs:` block with raw CUE. |
| `tpl.SetRawHeaderBlock(block string)` | Escape hatch: injects raw CUE at the top of the template block, before output/parameter/patch. |

## `tpl.Output(resource)`

Sets the primary output resource of the template. In CUE this becomes the top-level `output: { ... }` block. Every component template calls this exactly once.

Applies to: **Component**

```go title="Go — defkit"
func myTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")

    deployment := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image)

    tpl.Output(deployment)
}
```

```cue title="CUE — generated"
output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: name: context.name
    spec: template: spec: containers: [{
        image: parameter.image
    }]
}
```

## `tpl.Outputs()` / `tpl.OutputsIf()`

Adds a named secondary output resource. Use when a trait or component creates additional Kubernetes objects (e.g., an HPA, Service, Secret). `OutputsIf` conditionally includes the resource based on a boolean value expression.

Applies to: **Component**, **Trait**

```go title="Go — defkit"
// Always emit the secondary resource
tpl.Outputs("cpuscaler", hpa)

// Only emit when create == true
create := defkit.Bool("create").Default(false)
tpl.OutputsIf(create.IsTrue(), "service-account", serviceAccount)
```

```cue title="CUE — generated"
// tpl.Outputs("cpuscaler", hpa)
outputs: cpuscaler: {
    apiVersion: "autoscaling/v1"
    kind:       "HorizontalPodAutoscaler"
    ...
}

// tpl.OutputsIf(create.IsTrue(), ...)
if parameter.create {
    outputs: "service-account": { ... }
}
```

:::tip
`tpl.Output()` is for the single primary resource. Use `tpl.Outputs()` for every additional Kubernetes object the definition manages (Services, HPAs, ConfigMaps, etc.).
:::

## Workflow Step Actions

Workflow step templates use a separate set of methods on `*defkit.WorkflowStepTemplate` to control execution flow and call KubeVela built-in actions.

### `tpl.Suspend()` / `tpl.SuspendIf()`

`tpl.Suspend()` unconditionally pauses the workflow at this step, emitting a message. `tpl.SuspendIf()` pauses only when the boolean condition is true — typically used to require manual approval when auto-deploy is disabled.

Applies to: **WorkflowStep**

```go title="Go — defkit"
// Unconditional suspend
step := defkit.NewWorkflowStep("manual-approval").
    Description("Wait for manual approval").
    Template(func(tpl *defkit.WorkflowStepTemplate) {
        tpl.Suspend("Waiting for approval")
    })

// Conditional suspend — pause when auto == false
auto := defkit.Bool("auto").Default(true)
step2 := defkit.NewWorkflowStep("deploy").
    Params(auto).
    Template(func(tpl *defkit.WorkflowStepTemplate) {
        tpl.SuspendIf(defkit.Not(auto.IsTrue()), "Waiting approval to deploy")
    })
```

```cue title="CUE — generated"
// SuspendIf output
if !(parameter.auto) {
    suspend: builtin.#Suspend & {
        $params: {
            message: "Waiting approval to deploy"
        }
    }
}
```

### `tpl.Builtin()`

Calls a KubeVela built-in workflow action (e.g., `multicluster.#Deploy`). Three binding modes are available:

- **`.WithParams(map[string]defkit.Value)`** — bind individual parameter references by name into a `$params: {...}` block.
- **`.WithFullParameter()`** — emit `$params: parameter`, forwarding the entire parameter object as-is. Use when the action's schema matches `parameter` directly.
- **`.WithDirectFields()`** — emit each bound field directly (no `$params` wrapper). Use for actions that consume top-level fields rather than a `$params` struct.

Requires declaring the import with `.WithImports()` on the step definition.

Applies to: **WorkflowStep**

```go title="Go — defkit"
// WithParams — individual field bindings
policies    := defkit.StringList("policies")
parallelism := defkit.Int("parallelism").Default(5)

tpl.Builtin("deploy", "multicluster.#Deploy").
    WithParams(map[string]defkit.Value{
        "policies":    policies,
        "parallelism": parallelism,
    }).Build()

// WithFullParameter — forward entire parameter
tpl.Builtin("msg", "builtin.#Message").
    WithFullParameter().
    Build()

// WithDirectFields — no $params wrapper
env := defkit.Array("env")
tpl.Builtin("apply", "kube.#Apply").
    WithDirectFields().
    WithParams(map[string]defkit.Value{"env": env}).
    Build()
```

```cue title="CUE — generated"
// WithParams output
deploy: multicluster.#Deploy & {
    $params: {
        policies:    parameter.policies
        parallelism: parameter.parallelism
    }
}

// WithFullParameter output
msg: builtin.#Message & {
    $params: parameter
}

// WithDirectFields output
apply: kube.#Apply & {
    env: parameter.env
}
```

### Full Deploy Step Example

A complete workflow step combining `SuspendIf` for manual approval gating and `Builtin` for multicluster deployment.

```go title="Go — defkit"
auto        := defkit.Bool("auto").Default(true)
policies    := defkit.StringList("policies")
parallelism := defkit.Int("parallelism").Default(5)

step := defkit.NewWorkflowStep("deploy").
    Description("Deploy step").
    Category("Application Delivery").
    Scope("Application").
    WithImports("vela/multicluster", "vela/builtin").
    Params(auto, policies, parallelism).
    Template(func(tpl *defkit.WorkflowStepTemplate) {
        tpl.SuspendIf(defkit.Not(auto.IsTrue()), "Waiting approval to the deploy step")
        tpl.Builtin("deploy", "multicluster.#Deploy").
            WithParams(map[string]defkit.Value{
                "policies":    policies,
                "parallelism": parallelism,
            }).Build()
    })
```

```cue title="CUE — generated"
import (
    "vela/multicluster"
    "vela/builtin"
)

deploy: {
    type: "workflow-step"
    annotations: {
        "category": "Application Delivery"
    }
    labels: {
        "scope": "Application"
    }
    description: "Deploy step"
}
template: {
    if !(parameter.auto) {
        suspend: builtin.#Suspend & {
            $params: {
                message: "Waiting approval to the deploy step"
            }
        }
    }
    deploy: multicluster.#Deploy & {
        $params: {
            policies:    parameter.policies
            parallelism: parameter.parallelism
        }
    }
    parameter: {
        auto:        *true | bool
        policies?:   [...string]
        parallelism: *5 | int
    }
}
```
