---
title:  Apply Components and Traits
---

## Overview

In this guide, you will learn how to apply components and traits in `WorkflowStepDefinition`.

## Apply components and traits in one operation

Apply the following `Application` and `WorkflowStepDefinition`:

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
          // pass the component name as a parameter
          name: express-server

---
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

## Apply components and traits separately

The `ApplyComponent` have integrated the `Load` and `Apply` actions. We can also apply components and traits separately by applying the following `WorkflowStepDefinition`:

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

        // apply all the items in auxiliaries array and apply
        step: op.#Steps & {
          for index, aux in load.value.auxiliaries {
            "aux-\(index)": op.#Apply & {
              value: aux
            }
          }
        }
```

## Expected outcome

We can see that all the components and traits have been applied to the cluster.
