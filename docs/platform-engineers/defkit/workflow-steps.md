---
title: Workflow Step Definitions
---

In this section, we will introduce how to build WorkflowStepDefinitions using the defkit Go SDK.

:::tip
Before reading this section, make sure you've read [Getting Started with defkit](./overview.md). For the CUE-based approach, see [Workflow Step Definition (CUE)](../workflow/workflow.md).
:::

## Declare a Workflow Step

Use `NewWorkflowStep` to create a workflow step definition:

```go title="deploy.go"
step := defkit.NewWorkflowStep("deploy").
    Description("A powerful deploy step").
    Category("Application Delivery").
    Scope("Application").
    Params(
        defkit.Bool("auto").Default(true),
        defkit.Int("parallelism").Default(5),
    )
```

### Workflow Step Configuration

| Method | Description |
|:-------|:-----------|
| `.Category(name)` | The category shown in the UI (e.g., `"Application Delivery"`) |
| `.Scope(scope)` | The scope of the step (e.g., `"Application"`) |

## Workflow Step Templates

Workflow step templates support unique actions like `Suspend`, `SuspendIf`, and `Builtin` calls:

### Suspend

Unconditionally pause the workflow:

```go title="suspend.go"
step := defkit.NewWorkflowStep("manual-approval").
    Description("Wait for manual approval").
    Template(func(tpl *defkit.WorkflowStepTemplate) {
        tpl.Suspend("Waiting for approval")
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="manual_approval.cue"
"manual-approval": {
	type: "workflow-step"
	annotations: {
	}
	labels: {
	}
	description: "Wait for manual approval"
}
template: {
	parameter: {
	}
}
```

</details>

### SuspendIf

Pause the workflow based on a condition:

```go title="suspend_if.go"
auto := defkit.Bool("auto").Default(true)

step := defkit.NewWorkflowStep("deploy").
    Description("Deploy step").
    Params(auto).
    Template(func(tpl *defkit.WorkflowStepTemplate) {
        tpl.SuspendIf(defkit.Not(auto.IsTrue()), "Waiting for approval")
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="suspend_if.cue"
deploy: {
	type: "workflow-step"
	annotations: {
	}
	labels: {
	}
	description: "Deploy step"
}
template: {
	if !(parameter.auto) {
		suspend: builtin.#Suspend & {
			$params: {
				message: "Waiting for approval"
			}
		}
	}
	parameter: {
		auto: *true | bool
	}
}
```

</details>

### Builtin Actions

Call KubeVela builtin workflow actions:

```go title="builtin.go"
policies := defkit.StringList("policies")
parallelism := defkit.Int("parallelism").Default(5)

step := defkit.NewWorkflowStep("deploy").
    Description("Deploy step").
    Params(policies, parallelism).
    Template(func(tpl *defkit.WorkflowStepTemplate) {
        tpl.Builtin("deploy", "multicluster.#Deploy").
            WithParams(map[string]defkit.Value{
                "policies":    policies,
                "parallelism": parallelism,
            }).Build()
    })
```

<details>
<summary>Generated CUE output</summary>

```cue title="builtin.cue"
deploy: {
	type: "workflow-step"
	annotations: {
	}
	labels: {
	}
	description: "Deploy step"
}
template: {
	deploy: multicluster.#Deploy & {
		$params: {
			policies: parameter.policies
			parallelism: parameter.parallelism
		}
	}
	parameter: {
		policies?: [...string]
		parallelism: *5 | int
	}
}
```

</details>

## Full Deploy Step Example

Combining suspend, builtin, and imports into a complete step:

```go title="deploy.go"
auto := defkit.Bool("auto").Default(true)
policies := defkit.StringList("policies")
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

<details>
<summary>Generated CUE output</summary>

```cue title="deploy_full.cue"
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
			policies: parameter.policies
			parallelism: parameter.parallelism
		}
	}
	parameter: {
		auto: *true | bool
		policies?: [...string]
		parallelism: *5 | int
	}
}
```

</details>

## Raw CUE

For complex workflow steps that need full CUE control:

```go title="raw_step.go"
step := defkit.NewWorkflowStep("deploy").RawCUE(`import (
    "vela/multicluster"
)

"deploy": {
    type: "workflow-step"
    description: "Raw CUE step"
}
template: {
    deploy: multicluster.#Deploy
    parameter: auto: *true | bool
}`)
```

## Applying Workflow Step Definitions

```bash
# Validate all definitions in your module
vela def validate-module ./my-platform

# Apply all definitions (or just workflow steps)
vela def apply-module ./my-platform
vela def apply-module ./my-platform --types workflow-step

# List applied workflow step definitions
vela def list -t workflow-step
```

For the full CLI reference, see [Applying Definitions](./overview.md#applying-definitions-with-the-vela-cli).

## What's Next

- [Parameter Types](./parameters.md) -- Complete parameter type reference
- [Health and Status](./health-and-status.md) -- Adding health checks
- [Testing Definitions](./testing.md) -- Unit testing workflow steps
