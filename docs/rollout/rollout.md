---
title:  KubeVela Rollout 
---
`Rollout` or `Upgrade` is one of the most essential "day 2" operation on any application
. KubeVela, as an application centric platform, definitely needs to provide a customized solution
to alleviate the burden on the application operators.

## Overview 
There are several attempts at solving this problem in the cloud native community. However, none 
of them provide a true rolling style upgrade. For example, flagger supports Blue/Green, Canary 
and A/B testing. Therefore, we decide to add support for batch based rolling upgrade as 
our first style to support in KubeVela.

### Design Principles and Goals
We design KubeVela rollout solutions with the following principles in mind
- First, we want all flavors of rollout controllers share the same core rollout
  related logic. The trait and application related logic can be easily encapsulated into its own
  package.
- Second, the core rollout related logic is easily extensible to support different type of
  workloads, i.e. Deployment, Cloneset, Statefulset, Daemonset or even customized workloads.
- Thirdly, the core rollout related logic has a well documented state machine that
  does state transition explicitly.
- Finally, the controllers can support all the rollout/upgrade needs of an application running
  in a production environment including Blue/Green, Canary and A/B testing.


## AppRollout Example
Here is a simple `AppRollout` that upgrade an application from v1 to v2 in three batches. The 
first batch contains only 1 pod while the rest of the batches split the rest.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: AppRollout
metadata:
  name: rolling-example
spec:
  sourceAppRevisionName: test-rolling-v1
  targetAppRevisionName: test-rolling-v2
  componentList:
    - metrics-provider
  rolloutPlan:
    rolloutStrategy: "IncreaseFirst"
    rolloutBatches:
      - replicas: 1
      - replicas: 50%
      - replicas: 50%
    batchPartition: 1
```

## User Experience Workflow
Here is the end to end user experience

1. Install Open Kurise and CloneSet based workloadDefinition
```shell
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.7.0/kruise-chart.tgz
```
   
```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: clonesetservice
  namespace: vela-system
  annotations:
    definition.oam.dev/description: "Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers.
    If workload type is skipped for any service defined in Appfile, it will be defaulted to `webservice` type."
spec:
  workload:
    definition:
      apiVersion: apps.kruise.io/v1alpha1
      kind: CloneSet
  schematic:
    cue:
      template: |
        output: {
            apiVersion: "apps.kruise.io/v1alpha1"
            kind:       "CloneSet"
            metadata: labels: {
              "app.oam.dev/component": context.name
            }
            spec: {
                if parameter["replicas"] != _|_ {
                    replicas: parameter.replicas
                }
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
                if parameter["updateStrategyType"] != _|_ {
                    updateStrategy: {
                      type: parameter.updateStrategyType
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
            // +usage=Cloneset updateStrategy, candidates are `ReCreate`/`InPlaceIfPossible`/`InPlaceOnly`
            updateStrategyType?: string
            // +usage=Number of pods in the cloneset
            replicas?: int
        }
  ```

2. Apply an application to the cluster
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test-rolling
  annotations:
    "app.oam.dev/rolling-components": "metrics-provider"
    "app.oam.dev/rollout-template": "true"
spec:
  components:
    - name: metrics-provider
      type: clonesetservice
      properties:
        cmd:
          - ./podinfo
          - stress-cpu=1
        image: stefanprodan/podinfo:4.0.6
        port: 8080
        updateStrategyType: InPlaceIfPossible
        replicas: 5
```

3. Apply the following rollout to upgrade the application to v1
```yaml
apiVersion: core.oam.dev/v1beta1
kind: AppRollout
metadata:
  name: rolling-example
spec:
  # application (revision) reference
  targetAppRevisionName: test-rolling-v1
  componentList:
    - metrics-provider
  rolloutPlan:
    rolloutStrategy: "IncreaseFirst"
    rolloutBatches:
      - replicas: 10%
      - replicas: 40%
      - replicas: 50%
```
Use can check the status of the ApplicationRollout and wait for the rollout to complete.

4. User can continue to modify the application image tag and apply
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test-rolling
  annotations:
    "app.oam.dev/rolling-components": "metrics-provider"
    "app.oam.dev/rollout-template": "true"
spec:
  components:
    - name: metrics-provider
      type: clonesetservice
      properties:
        cmd:
          - ./podinfo
          - stress-cpu=1
        image: stefanprodan/podinfo:5.0.2
        port: 8080
        updateStrategyType: InPlaceIfPossible
        replicas: 5
```

5. Apply the application rollout that upgarde the application from v1 to v2
```yaml
apiVersion: core.oam.dev/v1beta1
kind: AppRollout
metadata:
  name: rolling-example
spec:
  # application (revision) reference
  sourceAppRevisionName: test-rolling-v1
  targetAppRevisionName: test-rolling-v2
  componentList:
    - metrics-provider
  rolloutPlan:
    rolloutStrategy: "IncreaseFirst"
    rolloutBatches:
      - replicas: 1
      - replicas: 2
      - replicas: 2
```
User can check the status of the ApplicationRollout and see the rollout completes, and the
ApplicationRollout's "Rolling State" becomes `rolloutSucceed`

## State Transition
Here is the high level state transition graph

![](../../resources/approllout-status-transition.jpg)