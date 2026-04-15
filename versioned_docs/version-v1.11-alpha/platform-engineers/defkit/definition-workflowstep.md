---
title: WorkflowStepDefinition
---

`defkit.NewWorkflowStep(name string) *WorkflowStepDefinition` creates a WorkflowStepDefinition builder. Workflow steps describe actions in application delivery pipelines — deploying components, running builds, applying Terraform configs, or checking metrics.

## Chain Methods

| Method | Description |
|---|---|
| `.Description(text)` | Human-readable description of what the step does. |
| `.Category(name)` | Groups the step under a category in the KubeVela UI and CLI. |
| `.Scope(scope)` | Sets execution scope. Typically `"Application"` for delivery steps. |
| `.Params(params...)` | Registers typed parameter definitions for the step. |
| `.Template(func(tpl))` | Assigns the CUE template function executed when the step runs. |
| `.WithImports(imports...)` | Adds CUE package import paths used by the template body. |

## Example

```go title="Go — defkit"
func ApplyComponent() *defkit.WorkflowStepDefinition {
    comp := defkit.String("component").
        Description("Name of the component to apply")

    return defkit.NewWorkflowStep("apply-component").
        Description("Apply a single component from the Application").
        Category("Deploy").
        Scope("Application").
        Params(comp).
        Template(applyComponentTemplate)
}

func init() { defkit.Register(ApplyComponent()) }
```

```cue title="CUE — generated"
// Generated — apply-component WorkflowStepDefinition
parameter: {
  // +usage=Specify the component name to apply
  component: string
  // +usage=Specify the cluster
  cluster: *"" | string
  // +usage=Specify the namespace
  namespace: *"" | string
}
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

## WithImports

Like ComponentDefinition, WorkflowStepDefinition supports `.WithImports()` for steps whose CUE templates reference CUE standard library packages:

```go
return defkit.NewWorkflowStep("my-step").
    WithImports("strings", "strconv").
    Params(comp).
    Template(myStepTemplate)
```

## Related

- [ComponentDefinition](./definition-component.md) — define workload types
- [PolicyDefinition](./definition-policy.md) — govern application lifecycle
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Integration](./integration.md) — KubeVela ecosystem integration points
