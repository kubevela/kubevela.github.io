---
title:  Data Flow
---

## Overview

In KubeVelow Workflow, you can orchestrate the data flow between steps via declarative config.
In this guide, you will learn how to pass data from one step to another.

## Apply Base Definitions

Apply the following Component and Trait Definitions:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: my-service
spec:
  schematic:
    cue:
      template: |
        output: {
          apiVersion: "apps/v1"
          kind:       "Deployment"
          metadata: labels: {
            "app": context.name
          }
          spec: {
            selector: matchLabels: {
              "app": context.name
            }
            template: {
              metadata: labels: {
                "app": context.name
              }
              spec: {
                containers: [{
                  name:  context.name
                  image: parameter.image
                }]
              }
            }
          }
        }
        parameter: {
          image: string
        }

---
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: ingress
spec:
  schematic:
    cue:
      template: |
        parameter: {
          domain: string
          http: [string]: int
        }
        outputs: {
          "service": {
            apiVersion: "v1"
            kind: "Service"
            metadata: {
              name: context.name
              namespace: context.namespace
            }
            spec: {
              selector: app: context.name
              ports: [for ph, pt in parameter.http{
                protocol: "TCP"
                port: pt
                targetPort: pt
              }]
            }
          }
          "ingress": {
            apiVersion: "networking.k8s.io/v1"
            kind: "Ingress"
            metadata: {
              name: "\(context.name)-ingress"
              namespace: context.namespace
            }
            spec: rules: [{
              host: parameter.domain
              http: paths: [for ph, pt in parameter.http {
                  path: ph
                  pathType: "Prefix"
                  backend: service: {
                      name: context.name
                      port: number: pt
                  }
              }]
            }]
           }
        }
```

## Apply WorkflowStep Definitions

Apply the following WorkflowStep Definitions:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-base
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        import ("vela/op")
        parameter: {
           component: string
        }
        apply: op.#ApplyComponent & {
           component: parameter.component
        }
        // wait until deployment ready
        wait: op.#ConditionalWait & {
           continue: apply.workload.status.readyReplicas == apply.workload.status.replicas && apply.workload.status.observedGeneration == apply.workload.metadata.generation
        }
        // export service ClusterIP
        clusterIP: apply.traits["service"].value.spec.clusterIP

---
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-proxy
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        import (
           "vela/op"
           "encoding/json"
        )
        parameter: {
           component: string
           backendIP: string
        }
        // patch the component with the passed IP and then apply it
        apply: op.#ApplyComponent & {
           component: parameter.component

           workload: patch: spec: template: spec: {
             containers: [{
                // patchKey=name
                env: [{name: "BackendIP",value: parameter.backendIP}]
             },...]
           }
        }
        // wait until argo.rollout ready
        wait: op.#ConditionalWait & {
           continue: apply.workload.status.readyReplicas == apply.workload.status.replicas && apply.workload.status.observedGeneration == apply.workload.metadata.generation
        }
```


## Apply application

Apply the following Application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: data-flow-example
spec:
  components:
    - name: base-service
      type: my-service
      properties:
        image: nginx:1.14.2
      traits:
      - type: ingress
        properties:
            domain: base-service.dev.example.com
            http:
              "/": 11001
    - name: proxy-service
      type: my-service
      properties:
          image: nginx:1.14.2
      traits:
      - type: ingress
        properties:
            domain: proxy-service.dev.example.com
            http:
              "/": 11002
  workflow:
    steps:
      - name: apply-base-service
        type: apply-base
        outputs:
        - name: baseIP
          exportKey: clusterIP
        properties:
          component: base-service

      - name: apply-proxy-service
        type: apply-proxy
        inputs:
        - from: baseIP
          parameterKey: backendIP
        properties:
          component: proxy-service
```

## Under the hood

We can see that the data flow is done via the inputs/outputs config.
Here is how the example work:
- As it is run, `apply-base-service` step will apply `base-service` and wait for the `clusterIP` in the last step.
- The `outputs` field contains `baseIP` exported from `clusterIP` which is an exported key.
  Note that the outputs can be any keys from the CUE template of the corresponding Definition.
- Then the second step `apply-proxy-service` runs, and its `inputs` field contains `baseIP` which matches the output from previous step.
  The value of `baseIP` will be used to fill the `backendIP` parameter in `apply-proxy` CUE template.
- After the input value is filled, the `apply-proxy-service` step will run and apply the Component with filled value.

Now we can see that how the `clusterIP` is passed in the data flow.

