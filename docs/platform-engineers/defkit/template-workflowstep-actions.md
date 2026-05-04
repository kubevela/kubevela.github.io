---
title: Workflow Step Actions
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Workflow step templates use a separate Go type — `*defkit.WorkflowStepTemplate` — with its own method set for pausing execution, calling KubeVela built-in actions, and assigning named fields. These methods are **not** available on the `*defkit.Template` used by component and trait definitions.

## Method Reference

### WorkflowStepTemplate Methods

| Method | Description |
|---|---|
| `tpl.SuspendIf(cond, message string)` | Pauses only when the condition is true. Generates `if cond { suspend: builtin.#Suspend & { $params: { message: "..." } } }`. Use this for gated approval steps. |
| `tpl.Suspend(message string)` | Records the suspend message on the template object. **Does not emit CUE.** For an unconditional pause, use `tpl.Builtin("suspend", "builtin.#Suspend").WithParams(...)`.Build()` or `WithFullParameter()` instead. |
| `tpl.Builtin(name, builtinRef string)` | Calls a KubeVela built-in workflow action. Returns a `*BuiltinActionBuilder` to configure parameters. |
| `tpl.Set(name string, value Value)` | Assigns a value to a named field in the step template body. |
| `tpl.SetIf(cond, name, value)` | Conditional `Set` — generates `if cond { name: value }`. |
| `tpl.SetGuardedBlock(cond, name, value)` | Field always present; its *contents* are guarded. Generates `name: { if cond { ...value... } }`. |

### BuiltinActionBuilder (returned by `tpl.Builtin`)

| Method | Description |
|---|---|
| `.WithParams(map[string]Value)` | Binds individual parameter references by name into a `$params: {...}` block. |
| `.WithFullParameter()` | Emits `$params: parameter`, forwarding the entire parameter object as-is. Use when the action's schema matches `parameter` directly (e.g., `builtin.#Suspend`). |
| `.WithDirectFields()` | Emits each bound field directly (no `$params` wrapper). Use for `op.#` actions that consume top-level struct fields. |
| `.If(cond)` | Makes the entire builtin action conditional. **Do not call `.Build()` after `.If()`** — `.If()` already finalises the action. |
| `.Build()` | Finalizes an unconditional builtin action and adds it to the template. Call this OR `.If()`, not both. |

## Working Example 1 — `deploy-and-notify` Step

The `deploy-and-notify` step covers all `WorkflowStepTemplate` methods in a single coherent definition:

- **`SuspendIf`** — pauses for manual approval when `auto: false`.
- **`Set` + `KubeRead`** — always reads a ConfigMap before the deploy runs.
- **`Builtin` + `WithParams`** — dispatches `multicluster.#Deploy` with individual param bindings.
- **`Builtin` + `If(cond)`** — conditionally invokes `builtin.#Fail` when `auto: false` and no policies are given.
- **`SetIf`** — adds a `wait` field only when `policies` are provided.
- **`SetGuardedBlock`** — `notifyStatus` block always exists; its contents are populated only when `notifyUrl` is set.

Verified with `vela def validate-module ./my-platform` against KubeVela v1.11.0-alpha.3.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

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

	// SuspendIf — conditional manual-approval gate
	tpl.SuspendIf(defkit.Not(auto.IsTrue()), "Waiting for manual approval to deploy")

	// Set — always-present field; reads a ConfigMap before the deploy runs
	tpl.Set("config",
		defkit.KubeRead("v1", "ConfigMap").
			Name(configName).
			Namespace(defkit.Reference("context.namespace")))

	// Builtin + WithParams — individual parameter bindings into $params
	tpl.Builtin("deploy", "multicluster.#Deploy").
		WithParams(map[string]defkit.Value{
			"parallelism": parallelism,
		}).Build()

	// Builtin + If(cond) — conditional builtin; do NOT call .Build() after .If()
	tpl.Builtin("abort", "builtin.#Fail").
		WithParams(map[string]defkit.Value{
			"message": defkit.Lit("Deployment aborted: manual mode requires explicit policies"),
		}).
		If(defkit.And(defkit.Not(auto.IsTrue()), defkit.Not(policies.IsSet())))

	// SetIf — conditional field; only emits when policies are provided
	tpl.SetIf(policies.IsSet(), "wait",
		defkit.WaitUntil(
			defkit.Reference(`deploy.status.phase == "succeeded"`),
		).Guard(defkit.Reference("deploy.status")))

	// SetGuardedBlock — field always present; contents populated only when notifyUrl is set
	tpl.SetGuardedBlock(notifyUrl.IsSet(), "notifyStatus",
		defkit.NewArrayElement().
			Set("url", notifyUrl).
			Set("sent", defkit.Lit(true)))
}

func init() { defkit.Register(DeployAndNotify()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

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

**`auto: true`** (default): the `SuspendIf` guard collapses — deploy proceeds immediately. The `config` read and the `deploy` builtin always run. **`auto: false`**: the step pauses for approval first; if `policies` is also absent, `abort` fires with the `builtin.#Fail` message.

**`policies` provided**: the `if parameter["policies"] != _|_` guard evaluates true, emitting the `wait: builtin.#ConditionalWait` block that polls `deploy.status.phase`. **`policies` absent**: the `wait` field is not emitted.

**`notifyUrl` provided**: the `notifyStatus` block (always present) has its contents populated — `url` and `sent: true`. **`notifyUrl` absent**: `notifyStatus` exists but is empty `{}`.

:::note `WithDirectFields()` — when to use it
`WithDirectFields()` emits bound values as top-level struct fields on the action (no `$params` wrapper). All standard KubeVela built-in providers (`vela/multicluster`, `vela/builtin`, `vela/kube`, `vela/http`, `vela/op`) use the `$params` convention in v1.11.x and later, so `WithDirectFields()` does **not** apply to them. Use it only for custom CUE workflow providers that you author yourself and that expose fields at the top level rather than under `$params`.
:::

:::note `multicluster.#Deploy` requires multicluster setup
`multicluster.#Deploy` dispatches to remote clusters using KubeVela multicluster policies. On a single local cluster without multicluster configuration, the step reaches the deploy action and fails because there are no cluster targets. The `SuspendIf`, `Set`, `SetIf`, `SetGuardedBlock`, and conditional `builtin.#Fail` behaviors all work on any cluster — only the actual cross-cluster dispatch needs a multicluster environment.
:::

## Working Example 2 — `manual-gate` Step

`manual-gate` demonstrates `Builtin` + `WithFullParameter` — the correct pattern for an unconditional suspend step where the caller controls the message via a parameter.

:::note `tpl.Suspend()` vs `Builtin().WithFullParameter()`
`tpl.Suspend(message)` records the string on the template object but **does not emit any CUE** in the current generator. For an unconditional pause, use `tpl.Builtin("suspend", "builtin.#Suspend").WithFullParameter().Build()` — this generates `suspend: builtin.#Suspend & { $params: parameter }`, forwarding the `message` parameter directly.
:::

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package workflowsteps

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func ManualGate() *defkit.WorkflowStepDefinition {
	message := defkit.String("message").Default("Waiting for manual approval").
		Description("Message shown in the workflow UI while paused")

	return defkit.NewWorkflowStep("manual-gate").
		Description("Unconditional manual-approval gate — always pauses the workflow at this step").
		Category("Workflow Control").
		Scope("Application").
		WithImports("vela/builtin").
		Params(message).
		Template(func(tpl *defkit.WorkflowStepTemplate) {
			// WithFullParameter — forwards entire parameter as $params: parameter
			tpl.Builtin("suspend", "builtin.#Suspend").
				WithFullParameter().
				Build()
		})
}

func init() { defkit.Register(ManualGate()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

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
	description: "Unconditional manual-approval gate — always pauses the workflow at this step"
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

This step always pauses regardless of any condition. `$params: parameter` forwards the step's entire parameter block (just `message`) to the builtin — the message string in the UI comes from the Application YAML.

## Reproduce

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
vela def apply-module ./my-platform --conflict overwrite
```

## Related

- [WorkflowStepDefinition](./definition-workflowstep.md) — full chain-method reference for step definitions, including `Category`, `Scope`, and the full comprehensive example
- [Template Output Methods](./template-output-methods.md) — `tpl.Output` / `tpl.Outputs` for component and trait templates (a different `*Template` type)
- [Template Patch Methods](./template-patch-methods.md) — `tpl.Patch()` / `tpl.PatchStrategy()` for trait patch templates
