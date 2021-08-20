---
title: Data Flow
---

## What's Data Flow

In KubeVela, data flow enables users to pass data from one workflow step to another.
You can orchestrate the data flow by specifying declarative config -- inputs and outputs of each step.
This doc will explain how to specify data inputs and outputs.

> Full example available at: https://github.com/oam-dev/kubevela/blob/master/docs/examples/workflow

## Outputs

An output exports the data corresponding to a key in the CUE template of a workflow step.
Once the workflow step has finished running, the output will have the data from the key.

Here is an example to specify the output in Application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  ...
  workflow:
    steps:
      - name: deploy-server1
        type: apply-component
        properties:
          component: "server1"
        outputs:
          - name: server1IP
            # Any key can be exported from the CUE template of the Definition
            exportKey: "myIP"
```

Here is an example CUE template that contains the export key:

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
        // apply workload to Kubernetes cluster
        apply: op.#ApplyComponent & {
          component: parameter.component
        }
        // export podIP
        myIP: apply.workload.status.podIP
```

The output can then be used by the input in the following.

## Inputs

An input takes the data of an output to fill a parameter in the CUE template of a workflow step.
The parameter will be filled before running the workflow step.

Here is an example to specify the input in Application:

```yaml
kind: Application
spec:
  ...
  workflow:
    steps:
      ...
      - name: deploy-server2
        type: apply-with-ip
        inputs:
          - from: server1IP
            parameterKey: serverIP
        properties:
          component: "server2"
```

Here is an example CUE template that takes the input parameter:

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
          // the input value will be used to fill this parameter
          serverIP?: string
        }
        // load component from application
        component: op.#Load & {
          component: parameter.component
          value: {}
        }
        // apply workload to Kubernetes cluster
        apply: op.#Apply & {
          value: {
            component.value.workload
            metadata: name: parameter.component
            if parameter.serverIP!=_|_{
              // this data will override the env fields of the workload container
              spec: containers: [{env: [{name: "PrefixIP",value: parameter.serverIP}]}]
            }
          }
        }
        // wait until workload.status equal "Running"
        wait: op.#ConditionalWait & {
          continue: apply.value.status.phase =="Running"
        }
```
