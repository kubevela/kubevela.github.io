---
title: Workflow Context
---

When defining the CUE template of the WorkflowStepDefinition,
you can use the `context` to get metadata of the Application.
For example:

```yaml
cue:
  template: |
    import ("vela/op")
    parameter: {
        component: string
    }
    // apply workload to kubernetes cluster
    apply: op.#ApplyComponent & {
        component: parameter.component
        workload: patch: {
          metadata: {
            labels: app: context.name
            labels: version: context.labels["version"]
          }
        }
    }
```
