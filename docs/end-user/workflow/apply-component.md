---
title:  Apply Components and Traits
---

This documentation introduces how to apply components and traits in `WorkflowStepDefinition`.

> Make sure you have learned about [Workflow](../../core-concepts/workflow.md) before reading this section.

## Apply components and traits in one operation

Suppose we have such an Application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: express-server
        type: apply-express
        properties:
          name: express-server
```

As you can see, we have a `step` with `type` of `apply-express` in `workflow`, and pass a parameter called `name` with the value of the name of the component in the application.

Next, we can write `WorkflowStepDefinition`. KubeVela provides an integrated operator, `ApplyComponent`, through which components and traits can be easily applied.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-express
  namespace: default
spec:
  schematic:
    cue:
      template: |
        import (
        	"vela/op"
        )

        // get the passed parameter
        parameter: {
          name: string
        }

        // apply component and traits
        apply: op.#ApplyComponent & {
          component: parameter.name
        }
```

Actually, `ApplyComponent` is a collection of operators, then we'll show how to apply components and traits separately.

## Apply components and traits separately

The `ApplyComponent` have integrated the `Load` and `Apply` actions. In the following, we will apply components and traits separately.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-express
  namespace: default
spec:
  schematic:
    cue:
      template: |
        import (
        	"vela/op"
        )

        // get the passed parameter
        parameter: {
          name: string
        }

        // load the component
        load: op.#Load & {
        	component: parameter.name
        }

        // apply the component, `.value.workload` means the actual component
        apply: op.#Apply & {
        	value: {
        		load.value.workload
        	}
        }

        // apply the trait, `.value.auxiliaries[0]` means the actual trait since we have only one trait here
        apply: op.#Apply & {
          value: {
            load.value.auxiliaries[0]
          }
        }
```

If we have multiple traits, we can also apply one by one in a loop:

```yaml
spec:
  schematic:
    cue:
      template: |
        import (
        	"vela/op"
        )

        // get the passed parameter
        parameter: {
          name: string
        }

        // load the component
        load: op.#Load & {
        	component: parameter.name
        }

        // apply all the items in auxiliaries array and apply
        step: op.#Steps & {
          for index, aux in load.value.auxiliaries {
            "aux-\(index)": op.#Apply & {
              value: aux
            }
          }
        }
```
