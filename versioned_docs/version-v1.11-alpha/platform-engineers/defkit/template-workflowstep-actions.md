---
title: Workflow Step Actions
---

Workflow step templates use a separate Go type — `*defkit.WorkflowStepTemplate` — with its own method set for pausing execution, calling KubeVela built-in actions, and assigning named fields. These methods are **not** available on the `*defkit.Template` used by component and trait definitions.

### WorkflowStepTemplate Methods

| Method | Description |
|---|---|
| `tpl.Suspend(message string)` | Unconditionally pauses the workflow at this step. Emits `suspend: builtin.#Suspend & { $params: { message: "..." } }`. |
| `tpl.SuspendIf(cond, message string)` | Pauses only when the boolean condition is true. Typically used to gate manual approval behind an `auto` parameter. |
| `tpl.Builtin(name, builtinRef string)` | Calls a KubeVela built-in workflow action. Returns a `*BuiltinActionBuilder` to configure parameters. |
| `tpl.Set(name string, value Value)` | Assigns a value to a named field in the step template body. Used for steps that compute values (e.g. reading from Kubernetes, calling HTTP endpoints) and storing results. |
| `tpl.SetIf(cond, name, value)` | Conditional `Set` — generates `if cond { name: value }`. |
| `tpl.SetGuardedBlock(cond, name, value)` | Creates a named field whose *contents* are conditional. Generates `name: { if cond { ...value... } }` — the field always exists, its contents are guarded. |

### BuiltinActionBuilder (returned by `tpl.Builtin`)

| Method | Description |
|---|---|
| `.WithParams(map[string]Value)` | Binds individual parameter references by name into a `$params: {...}` block. |
| `.WithFullParameter()` | Emits `$params: parameter`, forwarding the entire parameter object as-is. Use when the action's schema matches `parameter` directly. |
| `.WithDirectFields()` | Emits each bound field directly (no `$params` wrapper). Use for actions that consume top-level fields rather than a `$params` struct. |
| `.If(cond)` | Makes the entire builtin action conditional — generates `if cond { actionName: builtin.#Action & { ... } }`. |
| `.Build()` | Finalizes the builtin action and adds it to the workflow step template. Must be called as the last method in the chain. |

## `tpl.Suspend()` / `tpl.SuspendIf()`

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

## `tpl.Builtin()`

Calls a KubeVela built-in workflow action (e.g., `multicluster.#Deploy`). Three binding modes are available:

- **`.WithParams(map[string]defkit.Value)`** — bind individual parameter references by name into a `$params: {...}` block.
- **`.WithFullParameter()`** — emit `$params: parameter`, forwarding the entire parameter object as-is. Use when the action's schema matches `parameter` directly.
- **`.WithDirectFields()`** — emit each bound field directly (no `$params` wrapper). Use for actions that consume top-level fields rather than a `$params` struct.

Requires declaring the CUE import with `.WithImports(...)` on the step definition (e.g. `WithImports("vela/multicluster")` for `multicluster.#Deploy`).

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

## `tpl.Set()` / `tpl.SetIf()` / `tpl.SetGuardedBlock()`

Unlike `Output` / `Outputs` on a component template, a workflow-step `Set` assigns a value directly to a named field in the step's template body — useful when the step is computing a value (from a `KubeRead`, `HTTPPost`, or other op-builder result) and naming it so later steps can reference it.

- `tpl.Set(name, value)` — always emits `name: value`.
- `tpl.SetIf(cond, name, value)` — wraps the assignment in an `if cond { name: value }` guard.
- `tpl.SetGuardedBlock(cond, name, value)` — the field is always present, but its *contents* are guarded: `name: { if cond { ... } }`.

Applies to: **WorkflowStep**

```go title="Go — defkit"
tpl.Set("config",
    defkit.KubeRead("v1", "ConfigMap").
        WithName(defkit.Reference("parameter.configName")).Build())

tpl.SetIf(defkit.ParamIsSet("notifyUrl"), "notify",
    defkit.HTTPPost(defkit.Reference("parameter.notifyUrl")).Build())
```

```cue title="CUE — generated"
config: kube.#Read & { $params: { ... } }

if parameter.notifyUrl != _|_ {
    notify: http.#Post & { $params: { ... } }
}
```

## Full Deploy Step Example

A complete workflow step combining `SuspendIf` for manual approval gating and `Builtin` for multicluster deployment. For the full definition wrapper (with `Category`, `Scope`, etc.), see [WorkflowStepDefinition → Example](./definition-workflowstep.md#example).

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

## Related

- [WorkflowStepDefinition](./definition-workflowstep.md) — full chain-method reference for step definitions, including `Category`, `Scope`, and the full comprehensive example
- [Template Output Methods](./template-output-methods.md) — `tpl.Output` / `tpl.Outputs` for component and trait templates (a different `*Template` type)
