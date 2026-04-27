---
title: WorkflowStepDefinition
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`defkit.NewWorkflowStep(name string) *WorkflowStepDefinition` creates a WorkflowStepDefinition builder. Workflow steps describe actions in application delivery pipelines — deploying components, running builds, applying Terraform configs, or checking metrics.

## Chain Methods

### WorkflowStep-specific

| Method | Description |
|---|---|
| `.Category(string)` | Groups the step for display in the UI and CLI. Common categories: `"Application Delivery"`, `"Resource Management"`, `"Process Control"`, `"Terraform"`, `"External Integration"`. Shown in `vela show --type workflow-step`. |
| `.Scope(string)` | Defines the execution scope of the step — whether it runs at the application level or per-component. Affects how the step interacts with multi-component applications. Typically `"Application"` for delivery steps. |
| `.Alias(string)` | Sets an alternative name users can use to reference this step type in their workflow YAML. Allows shorter or more intuitive names alongside the canonical definition name. |
| `.Template(fn func(tpl *WorkflowStepTemplate))` | Provides the workflow step template closure. Inside, you define actions (builtins, suspend, field assignments) that KubeVela's workflow engine executes. Unlike component templates that produce resources, step templates orchestrate operations. |
| `.TemplateBody(body string)` | Escape hatch: provides raw CUE for the template body while still using the builder for the definition header and parameters. Use when the step logic is too complex for the builder API. |

### Shared base methods

These methods are the same shape as on `ComponentDefinition`. See the [ComponentDefinition page](./definition-component.md) for the longer descriptions.

| Method | Description |
|---|---|
| `.Description(desc string)` | Human-readable description shown in `vela show` and the KubeVela dashboard. |
| `.Annotations(map[string]string)` | Annotations on the WorkflowStepDefinition CR itself. |
| `.Labels(map[string]string)` | Labels on the WorkflowStepDefinition CR. |
| `.Version(v string)` | Definition version string for versioned selection. |
| `.Params(params ...Param)` | Adds parameter definitions that become the `parameter: { ... }` block (insertion order preserved). |
| `.Param(param Param)` | Adds a single parameter — incremental equivalent of `Params()`. |
| `.Helper(name string, param Param)` | Registers a named CUE helper type definition (`#Name: { ... }`) referenced from params or the template body. |
| `.CustomStatus(expr string)` | Raw CUE expression for the `status: customStatus:` block. |
| `.HealthPolicy(expr string)` | Raw CUE expression for the `status: healthPolicy:` block. |
| `.HealthPolicyExpr(expr HealthExpression)` | Type-safe `HealthExpression` DSL alternative to `HealthPolicy()`. |
| `.StatusDetails(details string)` | Raw CUE expression for the `status: details:` block. |
| `.RunOn(conditions ...placement.Condition)` | Restricts this step to clusters whose labels match the given conditions. |
| `.NotRunOn(conditions ...placement.Condition)` | Excludes this step from clusters whose labels match the given conditions. |
| `.RawCUE(cue string)` | Escape hatch: bypasses the entire builder and emits the raw CUE string as the whole definition. |
| `.WithImports(imports ...string)` | Adds CUE import statements (e.g. `"strings"`, `"strconv"`) to the generated template. |
| `.ToCue() string` | Compiles the step into a complete CUE string ready to apply as a KubeVela X-Definition. |
| `.ToYAML() ([]byte, error)` | Generates the Kubernetes YAML manifest for the WorkflowStepDefinition CR. |

### WorkflowStepTemplate (closure argument)

`.Template()` passes a `*WorkflowStepTemplate`. Use it to assemble the actions the workflow engine runs.

| Method | Description |
|---|---|
| `.Builtin(name, builtinRef string)` | Invokes a builtin workflow action (e.g. `"deploy", "multicluster.#Deploy"`). Returns a `*BuiltinActionBuilder` to configure parameters. The `builtinRef` is a CUE reference to the action's schema from an imported package. |
| `.Set(name string, value Value)` | Assigns a value to a named field in the step's template body. Used for steps that compute values (e.g. reading from K8s, calling HTTP endpoints) and storing results for later steps. |
| `.SetIf(cond Condition, name string, value Value)` | Conditionally assigns a value only when the condition is true. Generates `if cond { name: value }` in the template body. |
| `.SetGuardedBlock(cond Condition, name string, value Value)` | Creates a named field whose contents are conditional. Generates `name: { if cond { ...value... } }` — the field always exists, but its contents are guarded. Opposite of `SetIf` which wraps the field itself. |
| `.Suspend(message string)` | Adds a suspend action that pauses the workflow and displays the message. The workflow waits for manual approval (via `vela workflow resume`) before continuing. |
| `.SuspendIf(cond Condition, message string)` | Conditionally suspends the workflow only when the condition is true. For example, suspend for manual approval only when `auto` is false: `SuspendIf(Not(auto.IsTrue()), "Waiting for approval")`. |

### BuiltinActionBuilder

Returned by `WorkflowStepTemplate.Builtin()`. Configure the builtin's parameters and finalize with `.Build()`.

| Method | Description |
|---|---|
| `.WithParams(map[string]Value)` | Passes specific parameter values to the builtin action. Each key maps to a field in the action's `$params` block — for example, `{"policies": policies, "parallelism": parallelism}` for a deploy action. |
| `.WithFullParameter()` | Passes the entire `parameter` block from the step definition directly to the builtin action. Use when the step's parameters are a 1:1 match with the action's expected inputs. |
| `.WithDirectFields()` | Passes parameters as direct fields (not nested under `$params`) to the builtin action. Some builtins expect flat field inputs rather than a nested params block. |
| `.If(cond Condition)` | Makes the entire builtin action conditional — it only executes when the condition is true. Generates `if cond { actionName: builtin.#Action & { ... } }`. |
| `.Build()` | Finalizes the builtin action configuration and adds it to the workflow step template. Must be called as the last method in the chain. |

## Example

Let's build a `deploy-with-gate` workflow step — a reusable pipeline action that dispatches the Application's components to one or more clusters, with an optional manual-approval gate before the dispatch happens. Users supply a list of policy names to honor, a parallelism limit, and a boolean `auto` flag: when `auto: false` the step suspends before dispatching so an operator can review and resume via `vela workflow resume`; when `auto: true` the step deploys immediately.

Behind the scenes the step exercises most chain methods in a single definition — metadata (`Description`, `Labels`), step-specific (`Category`, `Scope`), `WithImports("vela/multicluster")` to bring in the `multicluster.#Deploy` action, `Params` with `Bool` / `StringList` / `Int`, and a `Template(...)` that combines `SuspendIf(...)` with `Builtin("deploy", "multicluster.#Deploy").WithParams(...).Build()`. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/workflowsteps/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package workflowsteps

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func DeployWithGate() *defkit.WorkflowStepDefinition {
    auto := defkit.Bool("auto").Default(true).
        Description("If false, pause the workflow for manual approval before dispatch")
    policies := defkit.StringList("policies").
        Description("Names of policies to apply for this deploy")
    parallelism := defkit.Int("parallelism").Default(5).
        Description("Max number of parallel dispatches")

    return defkit.NewWorkflowStep("deploy-with-gate").
        Description("Deploy components, optionally pausing for manual approval first").
        Labels(map[string]string{"tier": "platform"}).
        Category("Application Delivery").
        Scope("Application").
        WithImports("vela/multicluster").
        Params(auto, policies, parallelism).
        Template(func(tpl *defkit.WorkflowStepTemplate) {
            tpl.SuspendIf(
                defkit.Not(auto.IsTrue()),
                "Waiting for manual approval before deploy")
            tpl.Builtin("deploy", "multicluster.#Deploy").
                WithParams(map[string]defkit.Value{
                    "policies":    policies,
                    "parallelism": parallelism,
                }).
                Build()
        })
}

func init() { defkit.Register(DeployWithGate()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
import (
  "vela/multicluster"
)

"deploy-with-gate": {
  type: "workflow-step"
  annotations: {
    "category": "Application Delivery"
  }
  labels: {
    "tier": "platform"
    "scope": "Application"
  }
  description: "Deploy components, optionally pausing for manual approval first"
}
template: {
  if !(parameter.auto) {
    suspend: builtin.#Suspend & {
      $params: {
        message: "Waiting for manual approval before deploy"
      }
    }
  }
  deploy: multicluster.#Deploy & {
    $params: {
      parallelism: parameter.parallelism
      policies: parameter.policies
    }
  }
  parameter: {
    // +usage=If false, pause the workflow for manual approval before dispatch
    auto: *true | bool
    // +usage=Names of policies to apply for this deploy
    policies: [...string]
    // +usage=Max number of parallel dispatches
    parallelism: *5 | int
  }
}
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

## Workflow Step Execution

Steps run as part of the Application's `workflow` section. They execute sequentially by default or in parallel when grouped into `sub-steps`. The KubeVela workflow engine evaluates the step's CUE template to determine the actions to take.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  workflow:
    steps:
      - name: deploy-frontend
        type: apply-component
        properties:
          component: frontend
```

## Related

- [ComponentDefinition](./definition-component.md) — define workload types
- [PolicyDefinition](./definition-policy.md) — govern application lifecycle
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Integration](./integration.md) — KubeVela ecosystem integration points
