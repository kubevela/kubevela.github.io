---
title:  Patch in the Definitions
---

When we are writing the definition, sometimes we need to patch to the corresponding component or traits. We can use the `patch` capability when you're writing trait definitions or workflow step definitions.

## Patch Strategy

By default, KubeVela will merge patched values with CUE's merge. However, CUE cannot handle conflicting fields currently.

For example, if `replicas=5` has been set in a component instance, once there is another trait, attempting to patch the value of the replicas field, it will fail. So we recommend that you need to plan ahead and don't use duplicate fields between components and traits.

But in some cases, we do need to deal with overwriting fields that have already been assigned a value. For example, when set up resources in multi-environments, we hope that the `envs` in different environments are different: i.e., the default `env` is `MODE=PROD`, and in the test environment, it needs to be modified to `MODE=DEV DEBUG=true `.

In this case, we can apply the following application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: deploy-with-override
spec:
  components:
    - name: nginx-with-override
      type: webservice
      properties:
        image: nginx
        env:
          - name: MODE
            value: prod
  policies:
    - name: test
      type: topology
      properties:
        clusters: ["local"]
        namespace: test
    - name: prod
      type: topology
      properties:
        clusters: ["local"]
        namespace: prod
    - name: override-env
      type: override
      properties:
        components:
          - name: nginx-with-override
            traits:
              - type: env
                properties:
                  env:
                    MODE: test
                    DEBUG: "true"

  workflow:
    steps:
      - type: deploy
        name: deploy-test
        properties:
          policies: ["test", "override-env"]
      - type: deploy
        name: deploy-prod
        properties:
          policies: ["prod"]
```

After deploying the application, you can see that in the `test` namespace, the `envs` of the nginx application are as follows:

```yaml
spec:
  containers:
  - env:
    - name: MODE
      value: test
    - name: DEBUG
      value: "true"
```

At the same time, in the `prod` namespace, the `envs` are as follows:

```yaml
spec:
  containers:
  - env:
    - name: MODE
      value: prod
```

`deploy-test` will deploy nginx to the test namespace. At the same time, the `env` trait overwrite the same envs by using the patch strategy, thus adding `MODE=test DEBUG=true` in the test namespace, while the nginx in the prod namespace will retain the original `MODE=prod` env.

KubeVela provides a series of patching strategies to help resolve conflicting issues. When writing patch traits and workflow steps, you can use these patch strategies to solve conflicting values. Note that the patch strategy is not an official capability provided by CUE, but an extension developed by KubeVela.

For the usage of all patch strategies, please refer to [Patch Strategy](../cue/patch-strategy).

## Patch in Traits

**Patch** is a very common pattern of trait definitions, i.e. the app operators can amend/patch attributes to the component instance or traits to enable certain operational features such as sidecar or node affinity rules (and this should be done **before** the resources applied to target cluster).

This pattern is extremely useful when the component definition is provided by third-party component provider (e.g. software distributor) so app operators do not have privilege to change its template.

### Patch to components

Below is an example for `node-affinity` trait:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "affinity specify node affinity and toleration"
  name: node-affinity
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patch: {
        	spec: template: spec: {
        		if parameter.affinity != _|_ {
        			affinity: nodeAffinity: requiredDuringSchedulingIgnoredDuringExecution: nodeSelectorTerms: [{
                // +patchStrategy=retainKeys
        				matchExpressions: [
        					for k, v in parameter.affinity {
        						key:      k
        						operator: "In"
        						values:   v
        					},
        				]}]
        		}
        		if parameter.tolerations != _|_ {
              // +patchStrategy=retainKeys
        			tolerations: [
        				for k, v in parameter.tolerations {
        					effect:   "NoSchedule"
        					key:      k
        					operator: "Equal"
        					value:    v
        				}]
        		}
        	}
        }

        parameter: {
        	affinity?: [string]: [...string]
        	tolerations?: [string]: string
        }
```

In `patch`, we declare the component object fields that this trait will patch to.

The patch trait above assumes the target component instance have `spec.template.spec.affinity` field.
Hence, we need to use `appliesToWorkloads` to enforce the trait only applies to those workload types have this field. Meanwhile, we use `// +patchStrategy=retainKeys` to override the conflict fields in the original component instance.

Another important field is `podDisruptive`, this patch trait will patch to the pod template field,
so changes on any field of this trait will cause the pod to restart, We should add `podDisruptive` and make it to be true
to tell users that applying this trait will cause the pod to restart.

Now the users could declare they want to add node affinity rules to the component instance as below:

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/testapp:v1
      traits:
        - type: "gateway"
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
        - type: "node-affinity"
          properties:
            affinity:
              server-owner: ["owner1","owner2"]
              resource-pool: ["pool1","pool2","pool3"]
            tolerations:
              resource-pool: "broken-pool1"
              server-owner: "old-owner"
```

### Patch to traits

> Note: it's available after KubeVela v1.4.

You can also patch to other traits by using `patchOutputs` in the Definition. Such as:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: patch-annotation
spec:
  appliesToWorkloads:
    - deployments.apps
  podDisruptive: true
  schematic:
    cue:
      template: |
        patchOutputs: {
          ingress: {
            metadata: annotations: {
              "kubernetes.io/ingress.class": "istio"
            }
          }
        }
```

The patch trait above assumes that the component it binds has other traits which have `ingress` resource. The patch trait will patch an `istio` annotation to the `ingress` resource.

We can deploy the following application:

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/testapp:v1
      traits:
        - type: "gateway"
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
        - type: "patch-annotation"
          properties:
            name: "patch-annotation-trait"
```

And the ingress resource is now like:

```yaml
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: istio
  name: ingress
spec:
  rules:
  spec:
    rules:
    - host: testsvc.example.com
      http:
        paths:
        - backend:
            service:
              name: express-server
              port:
                number: 8000
          path: /
          pathType: ImplementationSpecific
```

## Patch in Workflow Step

When you use `op.#ApplyComponent` in a custom workflow step definition, you can patch component or traits in the `patch` field.

For example, when using Istio for canary release, you can add annotations of the release name to the component in `patch: workload` of `op.#ApplyComponent`; meanwhile, you can change the traffic and destination rule in `patch: traits: <trait-name>`.

Following is a real example of canary rollout in a custom workflow step:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: canary-rollout
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |-
        import ("vela/op")

        parameter: {
                batchPartition: int
                traffic: weightedTargets: [...{
                        revision: string
                        weight:   int
                }]
        }

        comps__: op.#Load
        compNames__: [ for name, c in comps__.value {name}]
        comp__: compNames__[0]

        apply: op.#ApplyComponent & {
                value: comps__.value[comp__]
                patch: {

                        workload: {
                                // +patchStrategy=retainKeys
                                metadata: metadata: annotations: {
                                        "rollout": context.name
                                }
                        }

                        traits: "rollout": {
                               spec: rolloutPlan: batchPartition: parameter.batchPartition
                        }

                        traits: "virtualService": {
                                spec:
                                   // +patchStrategy=retainKeys
                                   http: [
                                        {
                                                route: [
                                                        for i, t in parameter.traffic.weightedTargets {
                                                                destination: {
                                                                        host:   comp__
                                                                        subset: t.revision
                                                                }
                                                                weight: t.weight
                                                        }]
                                        },
                                ]
                        }

                        traits: "destinationRule": {
                                 // +patchStrategy=retainKeys
                                 spec: {
                                   host: comp__
                                   subsets: [
                                        for i, t in parameter.traffic.weightedTargets {
                                                name: t.revision
                                                labels: {"app.oam.dev/revision": t.revision}
                                        },
                                ]}
                        }
                }
        }

        applyRemaining: op.#ApplyRemaining & {
            exceptions: [comp__]
        }
```

After deploying the above definition, you can apply the following workflow to control the canary rollout:

```yaml
...
  workflow:
    steps:
      - name: rollout-1st-batch
        type: canary-rollout
        properties:
          batchPartition: 0
          traffic:
            weightedTargets:
              - revision: reviews-v1
                weight: 90
              - revision: reviews-v2
                weight: 10

      - name: manual-approval
        type: suspend

      - name: rollout-rest
        type: canary-rollout
        properties:
          batchPartition: 1
          traffic:
            weightedTargets:
              - revision: reviews-v2
                weight: 100
...
```

In the first and third steps, we declared different revisions and weight in traffic. In the step definition of `canary-rollout`, we will overwrite the revision and weight declared by the user through `patch`, so as to control the progressive rollout in the workflow.

> For more details of using KubeVela with Istio progressive release, please refer to [Progressive Rollout with Istio
](https://kubevela.io/docs/case-studies/canary-blue-green/).
