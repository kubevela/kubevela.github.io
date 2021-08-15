---
title: Data Input/Output
---

This doc will explain how to specify data inputs and outputs to orchestrate data flow.

> Full example at: https://github.com/oam-dev/kubevela/blob/master/docs/examples/workflow/basic-app.yaml

## Outputs

A workflow step can output the value of a key from CUE template for other steps to use.
Here is an example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  workflow:
    steps:
      - name: deploy-server1
        type: apply-component
        properties:
          component: "server1"
        outputs:
          - name: server1IP
            exportKey: "myIP"
```

The `myIP` export key is defined in the CUE template:

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
        }
        // load component from application
        component: op.#Load & {
           component: parameter.component
        }
        // apply workload to kubernetes cluster
        apply: op.#ApplyComponent & {
           component: parameter.component
        }
        // export podIP
        myIP: apply.workload.status.podIP
```

It is supported to export any key from the CUE template.

## Inputs

A workflow step can take an output from another step as an input to use.
The input value will be used to fill the specified parameter key.
Here is an example:

```yaml
kind: Application
spec:
  workflow:
    steps:
      ...
        outputs:
          - name: server1IP
            exportKey: "myIP"
      - name: deploy-server2
        type: apply-with-ip
        inputs:
          - from: server1IP
            parameterKey: serverIP
        properties:
          component: "server2"
```

The `serverIP` is defined in the parameter of CUE template:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-with-ip
spec:
  schematic:
    cue:
      template: |
        import ("vela/op")
        parameter: {
           component: string
           serverIP?: string
        }
        // load component from application
        component: op.#Load & {
           component: parameter.component
           value: {}
        }
        // apply workload to kubernetes cluster
        apply: op.#Apply & {
           value: {
              component.value.workload
              metadata: name: parameter.component
              if parameter.serverIP!=_|_{
                 spec: containers: [{env: [{name: "PrefixIP",value: parameter.serverIP}]}]
              }
           }
        }
        // wait until workload.status equal "Running"
        wait: op.#ConditionalWait & {
           continue: apply.value.status.phase =="Running"
        }
```

The value of `serverIP` parameter will be the value of the output of `myIP` of previous step.
Input must be used to fill parameters only.

Note that the input and output are correlated by the name, and the step with input must be after the step with output to get the value.
