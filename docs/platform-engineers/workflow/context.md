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
    apply: op.#ApplyComponent & {
        component: parameter.component
        workload: patch: {
          metadata: {
            labels: {
              app: context.name
              version: context.labels["version"]
            }
          }
        }
    }
```


When defining the CUE template of the WorkflowStepDefinition,
you can use the `context` to get metadata of the Application.

Here is an example:

```yaml
kind: WorkflowStepDefinition
metadata:
  name: my-step
spec:
  cue:
    template: |
      import ("vela/op")
      parameter: {
          component: string
      }
      apply: op.#ApplyComponent & {
          component: parameter.component
          workload: patch: {
            metadata: {
              labels: {
                app: context.name
                version: context.labels["version"]
              }
            }
          }
      }
```

When we deploy the following Application:

```yaml
kind: Application
metadata:
  name: example-app
  labels:
    version: v1.0
spec:
  workflow:
    steps:
      - name: example
        type: my-step
        properties:
          component: example
```

Now `context.XXX` will be filled with the corresponding Application's metadata:

```
apply: op.#ApplyComponent & {
    ...
          app: "example-app" // context.name
          version: "v1.0" // context.labels["version"]
        }
      }
    }
}
```