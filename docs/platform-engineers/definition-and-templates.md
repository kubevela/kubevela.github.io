---
title:  Definition Objects
---

This documentation explains `ComponentDefinition` and `TraitDefinition` in detail.

## Overview

Essentially, a definition object in KubeVela is a programmable build block. A definition object normally includes several information to model a certain platform capability that would used in further application deployment:
- **Capability Indicator** 
  - `ComponentDefinition` uses `spec.workload` to indicate the workload type of this component.
  - `TraitDefinition` uses `spec.definitionRef` to indicate the provider of this trait.
- **Interoperability Fields**
  - they are for the platform to ensure a trait can work with given workload type. Hence only `TraitDefinition` has these fields.
- **Capability Encapsulation and Abstraction** defined by `spec.schematic`
  - this defines the **templating and parametering** (i.e. encapsulation) of this capability.

Hence, the basic structure of definition object is as below:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: XxxDefinition
metadata:
  name: <definition name>
spec:
  ...
  schematic:
    cue:
      # cue template ...
    helm:
      # Helm chart ...
  # ... interoperability fields
```

Let's explain these fields one by one.

### Capability Indicator

In `ComponentDefinition`, the indicator of workload type is declared as `spec.workload`.

Below is a definition for *Web Service* in KubeVela: 

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: webservice
  namespace: default
  annotations:
    definition.oam.dev/description: "Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers."
spec:
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
    ...        
```

In above example, it claims to leverage Kubernetes Deployment (`apiVersion: apps/v1`, `kind: Deployment`) as the workload type for component.

### Interoperability Fields

The interoperability fields are **trait only**. An overall view of interoperability fields in a `TraitDefinition` is show as below.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name:  ingress
spec:
  appliesToWorkloads: 
    - deployments.apps
    - webservice
  conflictsWith: 
    - service
  workloadRefPath: spec.wrokloadRef
  podDisruptive: false
```

Let's explain them in detail.

#### `.spec.appliesToWorkloads`

This field defines the constraints that what kinds of workloads this trait is allowed to apply to.
- It accepts an array of string as value.
- Each item in the array refers to one or a group of workload types to which this trait is allowded to apply.

There are four approaches to denote one or a group of workload types.

- `ComponentDefinition` name, e.g., `webservice`, `worker`
- `ComponentDefinition` definition reference (CRD name), e.g., `deployments.apps`
- Resource group of `ComponentDefinition` definition reference prefixed with `*.`, e.g., `*.apps`, `*.oam.dev`. This means the trait is allowded to apply to any workloads in this group.
- `*` means this trait is allowded to apply to any workloads

If this field is omitted, it means this trait is allowded to apply to any workload types.

KubeVela will raise an error if a trait is applied to a workload which is NOT included in the `appliesToWorkloads`.


##### `.spec.conflictsWith` 

This field defines that constraints that what kinds of traits are conflicting with this trait, if they are applied to the same workload.
- It accepts an array of string as value. 
- Each item in the array refers to one or a group of traits.

There are four approaches to denote one or a group of workload types.

- `TraitDefinition` name, e.g., `ingress`
- Resource group of `TraitDefinition` definition reference prefixed with `*.`, e.g., `*.networking.k8s.io`. This means the trait is conflicting with any traits in this group.
- `*` means this trait is conflicting with any other trait.

If this field is omitted, it means this trait is NOT conflicting with any traits.

##### `.spec.workloadRefPath`

This field defines the field path of the trait which is used to store the reference of the workload to which the trait is applied.
- It accepts a string as value, e.g., `spec.workloadRef`.

If this field is set, KubeVela core will automatically fill the workload reference into target field of the trait. Then the trait controller can get the workload reference from the trait latter. So this field usually accompanies with the traits whose controllers relying on the workload reference at runtime. 

Please check [scaler](https://github.com/oam-dev/kubevela/blob/master/charts/vela-core/templates/defwithtemplate/manualscale.yaml) trait as a demonstration of how to set this field.

##### `.spec.podDisruptive`

This field defines that adding/updating the trait will disruptive the pod or not.
In this example, the answer is not, so the field is `false`, it will not affect the pod when the trait is added or updated.
If the field is `true`, then it will cause the pod to disruptive and restart when the trait is added or updated.
By default, the value is `false` which means this trait will not affect.
Please take care of this field, it's really important and useful for serious large scale production usage scenarios.

### Capability Encapsulation and Abstraction

The programmable template of given capability are defined in `spec.schematic` field. For example, below is the full definition of *Web Service* type in KubeVela:

<details>

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: webservice
  namespace: default
  annotations:
    definition.oam.dev/description: "Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers."
spec:
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
  schematic:
    cue:
      template: |
        output: {
            apiVersion: "apps/v1"
            kind:       "Deployment"
            spec: {
                selector: matchLabels: {
                    "app.oam.dev/component": context.name
                }
        
                template: {
                    metadata: labels: {
                        "app.oam.dev/component": context.name
                    }
        
                    spec: {
                        containers: [{
                            name:  context.name
                            image: parameter.image
        
                            if parameter["cmd"] != _|_ {
                                command: parameter.cmd
                            }
        
                            if parameter["env"] != _|_ {
                                env: parameter.env
                            }
        
                            if context["config"] != _|_ {
                                env: context.config
                            }
        
                            ports: [{
                                containerPort: parameter.port
                            }]
        
                            if parameter["cpu"] != _|_ {
                                resources: {
                                    limits:
                                        cpu: parameter.cpu
                                    requests:
                                        cpu: parameter.cpu
                                }
                            }
                        }]
                }
                }
            }
        }
        parameter: {
            // +usage=Which image would you like to use for your service
            // +short=i
            image: string
        
            // +usage=Commands to run in the container
            cmd?: [...string]
        
            // +usage=Which port do you want customer traffic sent to
            // +short=p
            port: *80 | int
            // +usage=Define arguments by using environment variables
            env?: [...{
                // +usage=Environment variable name
                name: string
                // +usage=The value of the environment variable
                value?: string
                // +usage=Specifies a source the value of this var should come from
                valueFrom?: {
                    // +usage=Selects a key of a secret in the pod's namespace
                    secretKeyRef: {
                        // +usage=The name of the secret in the pod's namespace to select from
                        name: string
                        // +usage=The key of the secret to select from. Must be a valid secret key
                        key: string
                    }
                }
            }]
            // +usage=Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)
            cpu?: string
        }     
```
</details>

The specification of `schematic` is explained in following CUE and Helm specific documentations.

Also, the `schematic` filed enables you to render UI forms directly based on them, please check the [Generate Forms from Definitions](openapi-v3-json-schema) section about how to.

## Definition Revisions

In KubeVela, definition entities are mutable. Each time a `ComponentDefinition` or `TraitDefinition` is updated, a corresponding `DefinitionRevision` will be generated to snapshot this change. Hence, KubeVela allows user to reference a specific revision of definition to declare an application.

### Specify Definition Revision in Application

For example, we can update the `webservice` component definition by applying a new definition with same name as below.

```shell
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/definition-revision/webservice-v2.yaml
```

A new definition revision will be automatically generated, `v2` is the latest version, `v1` is the previous one.

```shell
$  kubectl get definitionrevision -l="componentdefinition.oam.dev/name=webservice" -n vela-system
NAME            REVISION   HASH               TYPE
webservice-v1   1          3f6886d9832021ba   Component
webservice-v2   2          b3b9978e7164d973   Component
```

Users can specify the revision with `@version` approach, for example, if a user want to stick to using the `v1` revision of `webservice` component:

```yaml
# testapp.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
  - name: server
    type: webservice@v1
    properties:
      image: crccheck/hello-world
      port: 8000
```
If no revision is specified, KubeVela will always use the latest revision for a given component definition.