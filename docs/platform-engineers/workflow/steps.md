---
title: Steps
---

## What's a Step

A Workflow Step instantiates from a Definition and runs the instance.
It corresponds to find a Definition by the `type` field:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  ...
  workflow:
    steps:
      - name: deploy-server1
        # This is the name of the Definition to actually create an executable instance
        type: apply-component
        properties:
          component: server1
          ...
```

## How to define a Step

The platform admin prepares the WorkflowStepDefinitions for developers to use.
Basically the Definition provides the templated process to automate operation tasks.
This hides the complexities and exposes only high-level parameters to simplify user experience.
Here's an exmaple of a Definition:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-component
spec:
  schematic:
    cue:
      template: |
        import ("vela/op")
        parameter: {
           component: string
           prefixIP?: string
        }
        // load component from application
        component: op.#Load & {
           component: parameter.component
        }
        // apply workload to kubernetes cluster
        apply: op.#ApplyComponent & {
           component: parameter.component
        }
        // wait until workload.status equal "Running"
        wait: op.#ConditionalWait & {
           continue: apply.workload.status.phase =="Running"
        }
        // export podIP
        myIP: apply.workload.status.podIP
```

## User Parameters

Inside the CUE template, the parameters exposed to users are defined in the `parameters` key.
The workflow step properties from the Application will be used to fill the parameters.
Besides properties, we also support data flow to input parameter values from outputs of other steps.

## CUE Actions

The rest of CUE keys are actions that will be executed in order by KubeVela.
To learn about how to compose such actions, read [CUE Actions Reference](./cue-actions)
