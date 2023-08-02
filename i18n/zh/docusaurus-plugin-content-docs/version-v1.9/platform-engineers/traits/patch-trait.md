---
title:  配置模块补丁
---

在我们在进行定义的编写时，有时需要对其他的组件或者运维特征进行修改、打补丁。我们可以在自定义运维特征和自定义工作流步骤中执行补丁操作。

## 补丁策略

在默认情况下，KubeVela 会将需要打补丁的值通过 CUE 的 merge 来进行合并。但是目前 CUE 无法处理有冲突的字段名。

比如，在一个组件实例中已经设置 replicas=5，那一旦有运维特征实例，尝试给 replicas 字段的值打补丁就会失败。所以我们建议你提前规划好，不要在组件和运维特征之间使用重复的字段名。

但在一些情况下，我们确实需要处理覆盖已被赋值的字段。比如，在进行多环境资源的差异化配置时，我们希望不同环境中的环境变量是不同的：如默认的环境变量为 `MODE=PROD`，测试环境中需要修改为 `MODE=DEV DEBUG=true`。

此时，我们可以部署如下的应用：

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

部署完应用后，可以看到，在 `test` 命名空间下，nginx 应用的环境变量如下：

```yaml
spec:
  containers:
  - env:
    - name: MODE
      value: test
    - name: DEBUG
      value: "true"
```

而在 `prod` 命名空间下，nginx 应用的环境变量如下：

```yaml
spec:
  containers:
  - env:
    - name: MODE
      value: prod
```

`deploy-test` 会将 nginx 部署到 test namespace 下，同时，在 `env` 这个运维特征中，通过使用补丁策略，支持了覆盖相同变量的能力，从而为这个测试环境下的 nginx 加上 `MODE=test DEBUG=true` 的环境变量。而 prod namespace 下的 nginx 将保留原本的 `MODE=prod` 环境变量。

KubeVela 提供了一系列补丁策略来帮助你完成这类需求。在编写补丁型运维特征和工作流时，如果你发现值冲突的问题，可以结合使用这些补丁策略。值得注意的是，补丁策略并不是 CUE 官方提供的功能, 而是 KubeVela 扩展开发而来。

关于所有补丁策略的使用方法，请参考 [补丁策略](../cue/patch-strategy)。

## 在运维特征中打补丁

在自定义运维特征中，使用补丁型特征是一种比较常用的形式。

它让我们可以修改、补丁某些属性给组件对象（工作负载或者其他运维特征）来完成特定操作，比如更新 sidecar 和节点亲和性（node affinity）的规则（并且，这个操作一定是在资源往集群部署前就已经生效）。

当我们的组件是从第三方提供并自定义而来的时候，由于它们的模版往往是固定不可变的，所以能使用补丁型特征就显得尤为有用了。

### 为组件打补丁

下面，我们通过一个节点亲和性（node affinity）的例子，讲解如何在运维特征中为组件打补丁：

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
              // +patchStrategy=retainKeys
        			affinity: nodeAffinity: requiredDuringSchedulingIgnoredDuringExecution: nodeSelectorTerms: [{
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

具体来说，我们上面的这个补丁型特征，假定了使用它的组件对象将会使用 `spec.template.spec.affinity` 这个字段。因此，我们需要用 `appliesToWorkloads` 来指明，让当前运维特征被应用到拥有这个字段的对应工作负载实例上。同时，在指定了 `// +patchStrategy=retainKeys` 补丁策略的情况下，如果遇到值冲突，则会使用新的值去覆盖。

另一个重要的字段是 `podDisruptive`，这个补丁型特征将修改 Pod 模板字段，因此对该运维特征的任何字段进行更改，都会导致 Pod 重启。我们应该增加 `podDisruptive` 并且设置它的值为 true，以此告诉用户这个运维特征生效后将导致 Pod 重新启动。

现在用户只需要，声明他们希望增加一个节点亲和性的规则到组件实例当中：

```yaml
apiVersion: core.oam.dev/v1beta1
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
        - type: "node-affinity"
          properties:
            affinity:
              server-owner: ["owner1","owner2"]
              resource-pool: ["pool1","pool2","pool3"]
            tolerations:
              resource-pool: "broken-pool1"
              server-owner: "old-owner"
```

### 为其他运维特征打补丁

> 注意：该功能在 KubeVela 1.4 版本之后生效。

你还可以通过在 Definition 中使用 `patchOutputs`，来为其他运维特征打补丁。如：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: patch-annotation
spec:
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

上面的这个补丁型特征，假定了它绑定的组件还有别的运维特征，并且别的运维特征拥有 `ingress` 资源。该补丁型特征则会为这个 `ingress` 资源打上一个 istio 的 annotation。

我们可以部署如下应用来查看：

```yaml
apiVersion: core.oam.dev/v1beta1
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

应用成功运行后，`ingress` 资源如下：

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

注意：为了能够 Patch 其他 trait 生成的资源，你要把这类 `patchOutputs` 的 trait 放到其他 trait 后面。

你甚至可以写一个 `for` 循环来 patch 所有的资源，例子如下：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: patch-for-argo
spec:
  schematic:
    cue:
      template: |
        patch: {
            metadata: annotations: {
                "argocd.argoproj.io/compare-options": "IgnoreExtraneous"
                "argocd.argoproj.io/sync-options": "Prune=false"
            }
        }
        patchOutputs: {
          for k, v in context.outputs {
            "\(k)": {
              metadata: annotations: {
                "argocd.argoproj.io/compare-options": "IgnoreExtraneous"
                "argocd.argoproj.io/sync-options":    "Prune=false"
              }
            }
          }
        }
```

这个例子对应了一个[真实的场景](https://github.com/kubevela/kubevela/issues/4342).

## 在工作流中打补丁

当你在自定义工作流中使用 `op.#ApplyComponent` 时，你可以在其中的 `patch` 字段中为组件或者运维特征打补丁。

比如，在使用 Istio 进行渐进式的发布时，你可以通过在 `op.#ApplyComponent` 的 `patch: workload` 中，为其中的组件打上本次发布的 annotation；在 `patch: traits: <trait-name>` 中，变更本次渐进式发布的流量和路径。

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

部署完如上定义后，你可以声明如下的工作流：

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

在第一步和第三步中，我们分别在 traffic 中声明了不同的版本和流量，在 `canary-rollout` 这个步骤定义中，我们会将用户声明的版本和流量通过补丁的方式覆盖到原本的路由规则上，从而实现在工作流中的渐进式发布。

> 关于更多使用 KubeVela 完成 Istio 渐进式发布的细节和效果，请参考 [基于 Istio 的渐进式发布](https://kubevela.io/docs/case-studies/canary-blue-green/)。