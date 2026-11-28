---
title: WorkflowStepDefinition and Step Actions
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`defkit.NewWorkflowStep(name string) *WorkflowStepDefinition` creates a WorkflowStepDefinition builder. Workflow steps describe actions in application delivery pipelines: deploying components, running builds, applying Terraform configs, or checking metrics.

Workflow step templates use a separate Go type, `*defkit.WorkflowStepTemplate`, with its own method set for pausing execution, calling KubeVela built-in actions, and assigning named fields. These methods are **not** available on the `*defkit.Template` used by component and trait definitions.

## Definition methods

### WorkflowStep-specific

| Method | Description |
|---|---|
| `.Category(string)` | Groups the step for display in the UI and CLI. Common categories: `"Application Delivery"`, `"Resource Management"`, `"Process Control"`, `"Terraform"`, `"External Integration"`. Shown in `vela show --type workflow-step`. |
| `.Scope(string)` | Defines the execution scope of the step: whether it runs at the application level or per-component. Affects how the step interacts with multi-component applications. Typically `"Application"` for delivery steps. |
| `.Alias(string)` | Sets an alternative name users can use to reference this step type in their workflow YAML. Allows shorter or more intuitive names alongside the canonical definition name. |
| `.Template(fn func(tpl *WorkflowStepTemplate))` | Provides the workflow step template closure. Inside, you define actions (builtins, suspend, field assignments) that KubeVela's workflow engine executes. Unlike component templates that produce resources, step templates orchestrate operations. |
| `.RestrictNamespaces(namespaces ...string)` | Limits where the step may be used to namespaces matching any of the names or `path.Match` globs. With `.RestrictNamespaceSelector`, matching either is enough. |
| `.RestrictNamespaceSelector(selector *metav1.LabelSelector)` | Limits the step to namespaces matching the selector; `defkit.MatchLabels(map[string]string)` builds a simple one. With `.RestrictNamespaces`, matching either is enough. |
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
| `.Param(param Param)` | Adds a single parameter: incremental equivalent of `Params()`. |
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

## Template methods

### WorkflowStepTemplate Methods

| Method | Description |
|---|---|
| `tpl.SuspendIf(cond, message string)` | Pauses only when the condition is true. Generates `if cond { suspend: builtin.#Suspend & { $params: { message: "..." } } }`. Use this for gated approval steps. |
| `tpl.Suspend(message string)` | Records the suspend message on the template object. **Does not emit CUE.** For an unconditional pause, use `tpl.Builtin("suspend", "builtin.#Suspend").WithParams(...)`.Build()` or `WithFullParameter()` instead. |
| `tpl.Builtin(name, builtinRef string)` | Calls a KubeVela built-in workflow action. Returns a `*BuiltinActionBuilder` to configure parameters. |
| `tpl.Set(name string, value Value)` | Assigns a value to a named field in the step template body. |
| `tpl.SetIf(cond, name, value)` | Conditional `Set`: generates `if cond { name: value }`. |
| `tpl.SetGuardedBlock(cond, name, value)` | Field always present; its *contents* are guarded. Generates `name: { if cond { ...value... } }`. |

### BuiltinActionBuilder (returned by `tpl.Builtin`)

| Method | Description |
|---|---|
| `.WithParams(map[string]Value)` | Binds individual parameter references by name into a `$params: {...}` block. |
| `.WithFullParameter()` | Emits `$params: parameter`, forwarding the entire parameter object as-is. Use when the action's schema matches `parameter` directly (e.g., `builtin.#Suspend`). |
| `.WithDirectFields()` | Emits each bound field directly (no `$params` wrapper). Use for `op.#` actions that consume top-level struct fields. |
| `.If(cond)` | Makes the entire builtin action conditional. **Do not call `.Build()` after `.If()`**: `.If()` already finalises the action. |
| `.Build()` | Finalizes an unconditional builtin action and adds it to the template. Call this OR `.If()`, not both. |

## Workflow op builders

Pre-built builders for common workflow step actions. Each generates the appropriate CUE action block; add the package it uses with `WithImports` (see [Imports](./advanced-api.md#imports)).

| Constructor | Chain Methods | Description |
|---|---|---|
| `KubeRead(apiVersion, kind)` | `.Name(v)`, `.Namespace(v)`, `.NamespaceIf(cond, v)`, `.Cluster(v)` | Reads a Kubernetes resource by GVK and name. Generates `kube.#Read`. |
| `KubeApply(objectValue)` | `.Cluster(v)` | Applies (creates/updates) a Kubernetes resource. Generates `kube.#Apply`. |
| `HTTPPost(url Value)` | `.Body(v)`, `.Header(key, value)` | Makes an HTTP POST request. Generates `http.#HTTPDo` with method POST. |
| `ConvertString(input)` | | Converts a value to a string. Generates `util.#ConvertString`. |
| `WaitUntil(continueExpr)` | `.Guard(guards...)`, `.MessageIf(cond, val)` | Pauses the workflow until a condition becomes true. Generates `builtin.#ConditionalWait`. |
| `Fail(message Value)` | | Fails the workflow step with an error message. Generates `builtin.#Fail`. |

## Example: `deploy-with-gate`

Let's build a `deploy-with-gate` workflow step: a reusable pipeline action that dispatches the Application's components to one or more clusters, with an optional manual-approval gate before the dispatch happens. Users supply a list of policy names to honor, a parallelism limit, and a boolean `auto` flag: when `auto: false` the step suspends before dispatching so an operator can review and resume via `vela workflow resume`; when `auto: true` the step deploys immediately.

Behind the scenes the step exercises most chain methods in a single definition: metadata (`Description`, `Labels`), step-specific (`Category`, `Scope`), `WithImports("vela/multicluster")` to bring in the `multicluster.#Deploy` action, `Params` with `Bool` / `StringList` / `Int`, and a `Template(...)` that combines `SuspendIf(...)` with `Builtin("deploy", "multicluster.#Deploy").WithParams(...).Build()`. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/workflowsteps/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

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
<TabItem value="cue" label="CUE (generated)">

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

The CUE tab shows what `vela def gen-module` generates. Reproduce it with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

### Use the step

Steps run as part of the Application's `workflow` section. They execute sequentially by default or in parallel when grouped into `sub-steps`. The KubeVela workflow engine evaluates the step's CUE template to determine the actions to take.

Once the module is applied, an Application uses the `deploy-with-gate` step by its type name:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: frontend
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: nginx:1.27
  workflow:
    steps:
      - name: deploy
        type: deploy-with-gate
        properties:
          auto: false
          policies: []
          parallelism: 2
```

With `auto: false` the step suspends before dispatching. `vela status frontend` shows it waiting:

```console
Workflow:

  mode: StepByStep-DAG
  finished: false
  Suspend: true
  Terminated: false
  Steps
  - id: 9fierfjz2b
    name: deploy
    type: deploy-with-gate
    phase: suspending
    message: Waiting for manual approval before deploy
```

Continue it with `vela workflow resume frontend`; the step then deploys the component and ends as `succeeded`.

## Example: `deploy-and-notify`

The `deploy-and-notify` step covers all `WorkflowStepTemplate` methods in a single coherent definition:

- **`SuspendIf`**: pauses for manual approval when `auto: false`.
- **`Set` + `KubeRead`**: always reads a ConfigMap before the deploy runs.
- **`Builtin` + `WithParams`**: dispatches `multicluster.#Deploy` with individual param bindings.
- **`Builtin` + `If(cond)`**: conditionally invokes `builtin.#Fail` when `auto: false` and no policies are given.
- **`SetIf`**: adds a `wait` field only when `policies` are provided.
- **`SetGuardedBlock`**: `notifyStatus` block always exists; its contents are populated only when `notifyUrl` is set.

Check it with `vela def validate-module ./my-platform`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package workflowsteps

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func DeployAndNotify() *defkit.WorkflowStepDefinition {
	auto        := defkit.Bool("auto").Default(true).
		Description("Skip manual approval gate when true")
	policies    := defkit.StringList("policies").Optional().
		Description("Multicluster policies to target")
	parallelism := defkit.Int("parallelism").Default(5).
		Description("Max parallel cluster deploys")
	notifyUrl   := defkit.String("notifyUrl").Optional().
		Description("Webhook URL to POST after a successful deploy")
	configName  := defkit.String("configName").Default("app-config").
		Description("Name of the ConfigMap to read before deploying")

	return defkit.NewWorkflowStep("deploy-and-notify").
		Description("Gate, read config, deploy multicluster, and optionally webhook-notify").
		Category("Application Delivery").
		Scope("Application").
		WithImports("vela/multicluster", "vela/builtin", "vela/kube").
		Params(auto, policies, parallelism, notifyUrl, configName).
		Template(deployAndNotifyTemplate)
}

func deployAndNotifyTemplate(tpl *defkit.WorkflowStepTemplate) {
	auto        := defkit.Bool("auto")
	policies    := defkit.StringList("policies").Optional()
	parallelism := defkit.Int("parallelism")
	notifyUrl   := defkit.String("notifyUrl").Optional()
	configName  := defkit.String("configName")

	// SuspendIf: conditional manual-approval gate
	tpl.SuspendIf(defkit.Not(auto.IsTrue()), "Waiting for manual approval to deploy")

	// Set: always-present field; reads a ConfigMap before the deploy runs
	tpl.Set("config",
		defkit.KubeRead("v1", "ConfigMap").
			Name(configName).
			Namespace(defkit.Reference("context.namespace")))

	// Builtin + WithParams: individual parameter bindings into $params
	tpl.Builtin("deploy", "multicluster.#Deploy").
		WithParams(map[string]defkit.Value{
			"parallelism": parallelism,
		}).Build()

	// Builtin + If(cond): conditional builtin; do NOT call .Build() after .If()
	tpl.Builtin("abort", "builtin.#Fail").
		WithParams(map[string]defkit.Value{
			"message": defkit.Lit("Deployment aborted: manual mode requires explicit policies"),
		}).
		If(defkit.And(defkit.Not(auto.IsTrue()), defkit.Not(policies.IsSet())))

	// SetIf: conditional field; only emits when policies are provided
	tpl.SetIf(policies.IsSet(), "wait",
		defkit.WaitUntil(
			defkit.Reference(`deploy.status.phase == "succeeded"`),
		).Guard(defkit.Reference("deploy.status")))

	// SetGuardedBlock: field always present; contents populated only when notifyUrl is set
	tpl.SetGuardedBlock(notifyUrl.IsSet(), "notifyStatus",
		defkit.NewArrayElement().
			Set("url", notifyUrl).
			Set("sent", defkit.Lit(true)))
}

func init() { defkit.Register(DeployAndNotify()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
import (
	"vela/multicluster"
	"vela/builtin"
	"vela/kube"
)

"deploy-and-notify": {
	type: "workflow-step"
	annotations: {
		"category": "Application Delivery"
	}
	labels: {
		"scope": "Application"
	}
	description: "Gate, read config, deploy multicluster, and optionally webhook-notify"
}
template: {
	if !(parameter.auto) {
		suspend: builtin.#Suspend & {
			$params: {
				message: "Waiting for manual approval to deploy"
			}
		}
	}
	config: kube.#Read & {
		$params: value: {
			apiVersion: "v1"
			kind:       "ConfigMap"
			metadata: {
				name:      parameter.configName
				namespace: context.namespace
			}
		}
	}
	deploy: multicluster.#Deploy & {
		$params: {
			parallelism: parameter.parallelism
		}
	}
	if !(parameter.auto) && parameter["policies"] == _|_ {
		abort: builtin.#Fail & {
			$params: {
				message: "Deployment aborted: manual mode requires explicit policies"
			}
		}
	}
	if parameter["policies"] != _|_ {
		wait: builtin.#ConditionalWait & {
			if deploy.status != _|_ {
				$params: continue: deploy.status.phase == "succeeded"
			}
		}
	}
	notifyStatus: {
		if parameter["notifyUrl"] != _|_ {
			sent: true
			url:  parameter.notifyUrl
		}
	}
	parameter: {
		// +usage=Skip manual approval gate when true
		auto: *true | bool
		// +usage=Multicluster policies to target
		policies?: [...string]
		// +usage=Max parallel cluster deploys
		parallelism: *5 | int
		// +usage=Webhook URL to POST after a successful deploy
		notifyUrl?: string
		// +usage=Name of the ConfigMap to read before deploying
		configName: *"app-config" | string
	}
}
```

</TabItem>
</Tabs>

**`auto: true`** (default): the `SuspendIf` guard collapses: deploy proceeds immediately. The `config` read and the `deploy` builtin always run. **`auto: false`**: the step pauses for approval first; if `policies` is also absent, `abort` fires with the `builtin.#Fail` message.

**`policies` provided**: the `if parameter["policies"] != _|_` guard evaluates true, emitting the `wait: builtin.#ConditionalWait` block that polls `deploy.status.phase`. **`policies` absent**: the `wait` field is not emitted.

**`notifyUrl` provided**: the `notifyStatus` block (always present) has its contents populated: `url` and `sent: true`. **`notifyUrl` absent**: `notifyStatus` exists but is empty `{}`.

:::note `WithDirectFields()`: when to use it
`WithDirectFields()` emits bound values as top-level struct fields on the action (no `$params` wrapper). All standard KubeVela built-in providers (`vela/multicluster`, `vela/builtin`, `vela/kube`, `vela/http`, `vela/op`) use the `$params` convention in v1.11.x and later, so `WithDirectFields()` does **not** apply to them. Use it only for custom CUE workflow providers that you author yourself and that expose fields at the top level rather than under `$params`.
:::

:::note `multicluster.#Deploy` requires multicluster setup
`multicluster.#Deploy` dispatches to remote clusters using KubeVela multicluster policies. On a single local cluster without multicluster configuration, the step reaches the deploy action and fails because there are no cluster targets. The `SuspendIf`, `Set`, `SetIf`, `SetGuardedBlock`, and conditional `builtin.#Fail` behaviors all work on any cluster: only the actual cross-cluster dispatch needs a multicluster environment.
:::

## Example: `manual-gate`

`manual-gate` demonstrates `Builtin` + `WithFullParameter`: the correct pattern for an unconditional suspend step where the caller controls the message via a parameter.

:::note `tpl.Suspend()` vs `Builtin().WithFullParameter()`
`tpl.Suspend(message)` records the string on the template object but **does not emit any CUE** in the current generator. For an unconditional pause, use `tpl.Builtin("suspend", "builtin.#Suspend").WithFullParameter().Build()`: this generates `suspend: builtin.#Suspend & { $params: parameter }`, forwarding the `message` parameter directly.
:::

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package workflowsteps

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func ManualGate() *defkit.WorkflowStepDefinition {
	message := defkit.String("message").Default("Waiting for manual approval").
		Description("Message shown in the workflow UI while paused")

	return defkit.NewWorkflowStep("manual-gate").
		Description("Unconditional manual-approval gate: always pauses the workflow at this step").
		Category("Workflow Control").
		Scope("Application").
		WithImports("vela/builtin").
		Params(message).
		Template(func(tpl *defkit.WorkflowStepTemplate) {
			// WithFullParameter: forwards entire parameter as $params: parameter
			tpl.Builtin("suspend", "builtin.#Suspend").
				WithFullParameter().
				Build()
		})
}

func init() { defkit.Register(ManualGate()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
import (
	"vela/builtin"
)

"manual-gate": {
	type: "workflow-step"
	annotations: {
		"category": "Workflow Control"
	}
	labels: {
		"scope": "Application"
	}
	description: "Unconditional manual-approval gate: always pauses the workflow at this step"
}
template: {
	suspend: builtin.#Suspend & {
		$params: parameter
	}
	parameter: {
		// +usage=Message shown in the workflow UI while paused
		message: *"Waiting for manual approval" | string
	}
}
```

</TabItem>
</Tabs>

This step always pauses regardless of any condition. `$params: parameter` forwards the step's entire parameter block (just `message`) to the builtin: the message string in the UI comes from the Application YAML.

## Reproduce

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
vela def apply-module ./my-platform --conflict overwrite
```

## Related

- [Template Output Methods](./template-output-methods.md): `tpl.Output` / `tpl.Outputs` for component and trait templates (a different `*Template` type)
- [Template Patch Methods](./template-patch-methods.md): `tpl.Patch()` / `tpl.PatchStrategy()` for trait patch templates
- [ComponentDefinition](./definition-component.md): define workload types
- [PolicyDefinition](./definition-policy.md): govern application lifecycle
- [Register & Output](./definition-register.md): `defkit.Register()` and output methods
- [Definition Modules](./modules.md): module layout, `module.yaml` and the `vela def` commands
