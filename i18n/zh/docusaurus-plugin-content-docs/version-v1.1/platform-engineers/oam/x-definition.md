---
title: 模块定义（X-Definition）
---

最终用户使用的 OAM 模型 [应用部署计划 Application][1] 中，有很多声明“类型的字段”，如组件类型、运维特征类型、应用策略类型、工作流节点类型等，这些类型实际上就是 OAM 模型的模块定义（X-Definition）。

当前 OAM 模型支持的模块定义（X-Definition）包括组件定义（ComponentDefinition），运维特征定义（TraitDefinition）、应用策略定义（PolicyDefinition），工作流节点定义（WorkflowStepDefinition）等，随着系统演进，OAM 模型未来可能会根据场景需要进一步增加新的模块定义。


## 组件定义（ComponentDefinition）

组件定义（ComponentDefinition）的设计目标是允许平台管理员将任何类型的可部署制品封装成待交付的“组件”。只要定义好之后，这种类型的组件就可以被用户在部署计划（Application）中引用、实例化并交付出去。

> 所以你可以很容易的联想到，我们在 Application 的 `components[*].type` 中指定的类型名称，就是就是平台中的组件定义。无论是 KubeVela 内置的还是平台管理员扩展的，都是平等的对象。

常见的组件类型包括 Helm Chart 、Kustomize 目录、一组 Kubernetes YAML文件、容器镜像、云资源 IaC 文件、或者 CUE 配置文件模块等等。组件供应方对应真实世界中的角色，一般就是第三方软件的分发者（ISV）、DevOps 团队的工程师、或者你自己建设的 CI 体系生成的代码包和镜像。

组件定义是可以被共享和复用的。比如一个`阿里云 RDS`组件类型，最终用户可以在不同的应用中选择同样的 `阿里云 RDS` 组件类型，实例化成不同规格、不同参数配置的云数据库实例。

### 组件定义是如何运作的？

让我们来看一下组件定义的框架格式：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: <组件定义名称>
  annotations:
    definition.oam.dev/description: <功能描述说明>
spec:
  workload: # 工作负载描述
    definition:
      apiVersion: <Kubernetes 工作负载的资源组>
      kind: <Kubernetes 工作负载类型>
  schematic:  # 组件描述
    cue: # 通过 CUE 语言定义的组件详情
      template: <CUE 格式模板>
```

除了基本的“组件定义名称”和“功能描述说明”以外，组件定义的核心是 `.spec` 下面的两部分，一部分是工作负载类型；另一部分是组件描述。

* 工作负载类型（对应`.spec.workload`）字段为系统指明了一个组件背后对应的工作负载类型。它有两种定义方式，一种如例子中显示的，填写 `.spec.workload.definition` 的具体资源组和资源类型名称。另一种方法则是填写一个工作负载类型的名称。对于背后的工作负载类型不明确的组件定义，可以填写一个特殊的工作负载类型 `autodetects.core.oam.dev`，表示让 KubeVela 自动发现背后的工作负载。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
...
spec:
  workload: # 工作负载类型
    type: <工作负载类型名称>
  ...    
```

工作负载类型名称对应了一个“工作负载定义”的引用，“工作负载定义”的原理会在下一个小节介绍。两种写法的区别在于第一种直接写工作负载的资源组和类型，如果背后没有工作负载定义，会自动生成。而指定“工作负载类型名称”则可以做校验，限制组件定义只能针对系统中已经存在的工作负载类型做抽象。

* 组件描述（对应`.spec.schematic`）定义了组件的详细信息。该部分目前支持 [`cue`][2] 和 [`kube`][3] 两种描述方式。

具体抽象方式和交付方式的编写可以查阅对应的文档，这里以一个完整的例子介绍组件定义的工作流程。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: helm
  namespace: vela-system
  annotations:
    definition.oam.dev/description: "helm release is a group of K8s resources from either git repository or helm repo"
spec:
  workload:
    type: autodetects.core.oam.dev
  schematic:
    cue:
      template: |
        output: {
        	apiVersion: "source.toolkit.fluxcd.io/v1beta1"
        	metadata: {
        		name: context.name
        	}
        	if parameter.repoType == "git" {
        		kind: "GitRepository"
        		spec: {
        			url: parameter.repoUrl
        			ref:
        				branch: parameter.branch
        			interval: parameter.pullInterval
        		}
        	}
        	if parameter.repoType == "helm" {
        		kind: "HelmRepository"
        		spec: {
        			interval: parameter.pullInterval
        			url:      parameter.repoUrl
        			if parameter.secretRef != _|_ {
        				secretRef: {
        					name: parameter.secretRef
        				}
        			}
        		}
        	}
        }

        outputs: release: {
        	apiVersion: "helm.toolkit.fluxcd.io/v2beta1"
        	kind:       "HelmRelease"
        	metadata: {
        		name: context.name
        	}
        	spec: {
        		interval: parameter.pullInterval
        		chart: {
        			spec: {
        				chart:   parameter.chart
        				version: parameter.version
        				sourceRef: {
        					if parameter.repoType == "git" {
        						kind: "GitRepository"
        					}
        					if parameter.repoType == "helm" {
        						kind: "HelmRepository"
        					}
        					name:      context.name
        					namespace: context.namespace
        				}
        				interval: parameter.pullInterval
        			}
        		}
        		if parameter.targetNamespace != _|_ {
        			targetNamespace: parameter.targetNamespace
        		}
        		if parameter.values != _|_ {
        			values: parameter.values
        		}
        	}
        }

        parameter: {
        	repoType: "git" | "helm"
        	// +usage=The Git or Helm repository URL, accept HTTP/S or SSH address as git url.
        	repoUrl: string
        	// +usage=The interval at which to check for repository and relese updates.
        	pullInterval: *"5m" | string
        	// +usage=1.The relative path to helm chart for git source. 2. chart name for helm resource
        	chart: string
        	// +usage=Chart version
        	version?: string
        	// +usage=The Git reference to checkout and monitor for changes, defaults to master branch.
        	branch: *"master" | string
        	// +usage=The name of the secret containing authentication credentials for the Helm repository.
        	secretRef?: string
        	// +usage=The namespace for helm chart
        	targetNamespace?: string
        	// +usage=Chart version
        	value?: #nestedmap
        }

        #nestedmap: {
        	...
        }
```

如上所示，这个组件定义的名字叫 `helm`，一经注册，最终用户在 Application 的组件类型（`components[*].type`）字段就可以填写这个类型。

* 其中 `definition.oam.dev/description` 对应的字段就描述了这个组件类型的功能是启动一个 helm chart。
*  `.spec.workload` 字段，填写的是`autodetects.core.oam.dev`表示让用户自动发现这个 helm chart 组件背后的工作负载。
*  `.spec.schematic.cue.template`字段描述了基于 CUE 的抽象模板，输出包含2个对象，其中一个输出是根据 helm repo 托管的制品形态决定的，如果是用的helm官方的模式托管的则是生成 `HelmRepository` 对象，git模式推广的就是生成`GitRepository` 对象，另一个输出的对象是 `HelmRelease` 包含了这个 helm 的具体参数。 其中 `parameter` 列表则是暴露给用户填写的全部参数。


## 运维特征定义（TraitDefinition）

运维特征定义（TraitDefinition）为组件提供了一系列可被按需绑定的运维动作，这些运维动作通常都是由平台管理员提供的运维能力，它们为这个组件提供一系列的运维操作和策略，比如添加一个负载均衡策略、路由策略、或者执行弹性扩缩容、灰度发布策略等等。

绑定一个运维特征实际上就是在 Application 的 `components[*].traits` 数组中添加一个元素，其中 `.triats[*].type` 指定的类型名称，就是平台中的运维特征定义，而 `.triats[*].properties` 就是一系列运维特征的参数字段。与组件定义类似，这里的运维特征可以是 KubeVela 内置的，也可以是平台管理员后续扩展的，都是平等的对象。同样的，运维特征定义中也允许通过不同的抽象方式定义模板指定运维功能。

运维特征定义的格式和字段作用如下：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: <运维特征定义名称>
  annotations:
    definition.oam.dev/description: <功能描述说明>
spec:
  definition:
    apiVersion: <运维能力对应的 Kubernetes 资源组>
    kind: <运维能力对应的 Kubernetes 资源类型>
  workloadRefPath: <运维能力中对于工作负载对象的引用字段路径>
  podDisruptive: <运维能力的参数更新会不会引起底层资源（pod）重启>
  manageWorkload: <是否由该运维特征管理工作负载>
  skipRevisionAffect: <该运维特征是否不计入版本变化的计算>
  appliesToWorkloads:
  - <运维特征能够适配的工作负载名称>
  conflictsWith:
  - <与该运维特征冲突的其他运维特征名称>
  revisionEnabled: <运维能力是否感知组件版本的变化>
  schematic:  # 抽象方式
    cue: # 存在多种抽象方式
      template: <CUE 格式模板>
```

从上述运维特征的格式和功能中我们可以看到，运维特征定义提供了一系列运维能力和组件之间衔接的方式，使得相同功能的运维功能可以适配到不同的组件中。具体的字段功能如下所示：

* 运维特征能够适配的工作负载名称列表（`.spec.appliesToWorkloads`）,可缺省字段，字符串数组类型，申明这个运维特征可以用于的工作负载类型，填写的是工作负载的 CRD 名称，格式为 `<resources>.<api-group>`
* 与该运维特征冲突的其他运维特征名称列表（`.spec.conflictsWith`）,可缺省字段，字符串数组类型，申明这个运维特征与哪些运维特征冲突，填写的是运维特征名称的列表。
* 特征描述（对应`.spec.schematic`）字段定义了具体的运维动作。目前主要通过 [`CUE`][4] 来实现，同时也包含一系列诸如[`patch-trait`][5]这样的高级用法。
* 运维特征对应的 Kubernetes 资源定义（`.spec.definition`字段），可缺省字段，如果运维能力通过 Kubernetes 的 CRD 方式提供可以填写，其中 `apiVersion` 和 `kind` 分别描述了背后对应的 Kubernetes 资源组和资源类型。
* 运维能力中对于工作负载对象的引用字段路径（`.spec.workloadRefPath`字段），可缺省字段，运维能力中如果涉及到工作负载的引用，可以填写这样一个路径地址（如操作弹性扩缩容的 [HPA][6]对象，就可以填写`spec.scaleTargetRef`），然后 KubeVela 会自动将工作负载的实例化引用注入到运维能力的实例对象中。
* 运维能力的参数更新会不会引起底层资源（pod）重启（`.spec.podDisruptive`字段），可缺省字段，bool 类型，主要用于向用户标识 trait 的更新会不会导致底层资源（pod）的重启。这个标识通常可以提醒用户，改动这样一个trait可能应该再结合一个灰度发布，以免大量资源重启引入服务不可用和其他风险。
* 是否由该运维特征管理工作负载（`.spec.manageWorkload`）,可缺省字段，bool 类型，设置为 true 则标识这个运维特征会负责工作负载的创建、更新、以及资源回收，通常是灰度发布的运维特征会具备这个能力。
* 该运维特征是否不计入版本变化的计算（`.spec.skipRevisionAffect`）,可缺省字段，bool 类型，设置为 true 则标识这个运维特征的修改不计入版本的变化，即用户在应用中纯粹修改这个运维特征的字段不会触发应用本身的版本变化。
* 运维能力是否感知组件版本的变化（`.spec.revisionEnabled`）字段，可缺省字段，bool 类型，设置为 true 表示组件会生成的资源后缀会带版本后缀。


让我们来看一个实际的例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "configure k8s Horizontal Pod Autoscaler for Component which using Deployment as worklaod"
  name: hpa
spec:
  appliesToWorkloads:
    - deployments.apps
  workloadRefPath: spec.scaleTargetRef
  schematic:
    cue:
      template: |
        outputs: hpa: {
          apiVersion: "autoscaling/v2beta2"
          kind:       "HorizontalPodAutoscaler"
          spec: {
            minReplicas: parameter.min
            maxReplicas: parameter.max
            metrics: [{
              type: "Resource"
              resource: {
                name: "cpu"
                target: {
                  type:               "Utilization"
                  averageUtilization: parameter.cpuUtil
                }
              }
            }]
          }
        }
        parameter: {
          min:     *1 | int
          max:     *10 | int
          cpuUtil: *50 | int
        }
```

如上所示，这个运维特征的名字叫 `hpa`，一经注册，最终用户在 Application 的组件类型（`components[*].traits[*].type`）字段就可以填写这个类型，将这个运维特征作用在对应的组件上。

从字段和参数中我们可以看到这个运维特征的功能是为 Kubernetes Deployment 这类工作负载的组件提供弹性扩缩容的能力。这个运维特征只能用于 Kubernetes Deployment，同时 KubeVela 在实例化运维能力（即这个 HPA 对象）时会为 `spec.scaleTargetRef` 字段自动注入工作负载（Deployment 对象）的引用。最后 `.spec.schematic.cue.template`字段描述了基于 CUE 的抽象模板，定义了输出是一个 Kubernetes 的 HorizontalPodAutoscaler 结构，模板中的 parameter 定义了用户可以使用的参数，包括最大最小值和 CPU 的利用率。


## 应用策略定义（PolicyDefinition）

应用策略定义与运维特征定义类似，区别在于运维特征作用于单个组件，而应用策略是作用于整个应用整体（多个组件）。它可以为应用提供全局的策略定义，常见的包括全局安全策略（如 RBAC权限、审计、秘钥管理）、应用洞察（如 应用的 SLO 管理等）。

其格式如下所示：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: PolicyDefinition
metadata:
  name: <应用策略定义名称>
  annotations:
    definition.oam.dev/description: <功能描述说明>
spec:
  schematic:  # 策略描述
    cue: 
      template: <CUE 格式模板>
```

目前应用策略定义仅包含 CUE 格式模板一个字段，包含了应用策略输出的对象以及对应的参数，其 CUE 编写的格式与组件定义的 CUE 模板格式一致。一个具体的例子如下所示：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: PolicyDefinition
metadata:
  name: env-binding
  annotations:
    definition.oam.dev/description: "为应用提供差异化配置和环境调度策略"
spec:
  schematic:
    cue:
      template: |
        output: {
        	apiVersion: "core.oam.dev/v1alpha1"
        	kind:       "EnvBinding"
        	spec: {
        		engine: parameter.engine
        		appTemplate: {
        			apiVersion: "core.oam.dev/v1beta1"
        			kind:       "Application"
        			metadata: {
        				name:      context.appName
        				namespace: context.namespace
        			}
        			spec: {
        				components: context.components
        			}
        		}
        		envs: parameter.envs
        	}
        }

        #Env: {
        	name: string
        	patch: components: [...{
        		name: string
        		type: string
        		properties: {...}
        	}]
        	placement: clusterSelector: {
        		labels?: [string]: string
        		name?: string
        	}
        }

        parameter: {
        	engine: *"ocm" | string
        	envs: [...#Env]
        }
```

主要介绍其中的策略描述部分，基于 CUE 格式，输出一个 `EnvBinding` 对象，其参数就是 engine 和 envs 两个，其中 envs 是一个结构体数组，具体的结构体类型和其中的参数由 `#Env` 指定，这里面的 CUE 语法与[组件定义的 CUE 语法][7]一致。


## 工作流节点定义（WorkflowStepDefinition）

工作流节点定义用于描述一系列在工作流中可以声明的步骤节点，如执行资源的部署、状态检查、数据输出、依赖输入、外部脚本调用等一系列能力均可以通过工作流节点定义来描述。

工作流节点的字段相对简单，除了基本的名称和功能以外，其主要的功能都在 CUE 的模板中配置。KubeVela 在工作流模板中内置了大量的操作，具体可以通过工作流文档学习如何使用和编写。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: <工作流节点定义名称>
  annotations:
    definition.oam.dev/description: <功能描述说明>
spec:
  schematic:  # 节点描述
    cue: 
      template: <CUE 格式模板>
```

一个实际的工作流节点定义如下所示：

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
           component: parameter.name
        }

        // wait until workload.status equal "Running"
        wait: op.#ConditionalWait & {
           continue: apply.status.phase =="Running"
        }
```

例子中的工作流主要通过引入`vela/op` 这个内置的 KubeVela 包完成一系列动作，包括数据载入、资源创建以及状态检查。整体这个工作流就完成了 KubeVela 组件的创建、并且查看组件状态是否在正常运行这一功能。


## 工作负载定义（WorkloadDefinition）

工作负载定义（WorkloadDefinition）是组件的一种系统级特征，它不是用户所关心的字段，而是作为元数据被 OAM 系统本身进行检查、验证和使用。

其格式如下所示：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkloadDefinition
metadata:
  name: <工作负载定义名称>
spec:
  definitionRef:
    name: <工作负载定义对应的 Kubernetes 资源>
    version: <工作负载定义对应的 Kubernetes 资源版本>
  podSpecPath: <工作负载中 Pod 字段的路径>
  childResourceKinds:
    - apiVersion: <资源组>
      kind: <资源类型>
```

* 其中 `.spec.definitionRef.name` 描述了 Kubernetes 资源的名称，其格式与 CRD（Custom Resource Definition）名称一致，是 `<resources>.<api group>`。
* `.spec.podSpecPath` 定义了包含 `Kubernetes Pod` 字段的工作负载对应的 Pod 字段路径。
* `.spec.revisionLabel` 定义了工作负载的版本化标签
* `.spec.childResourceKinds` 定义了这个资源会生成的子资源。

除此之外，未来需要 OAM 模型中需要的引入的其他的针对 Kubernetes 资源类型特征的约定，也会作为字段加入到工作负载定义中。

## 抽象背后的标准协议

应用一经创建，KubeVela 就会为创建的资源打上一系列的标签，这些标签包含了应用的版本、名称、类型等。通过这些标准协议，应用的组件和运维能力之间就可以进行协作。具体的元数据列表如下所示：

|                        标签                         |                      描述                      |
| :-------------------------------------------------: | :--------------------------------------------: |
|       `workload.oam.dev/type=<组件定义名称>`        | 对应了组件定义（`ComponentDefinition`）的名字  |
|       `trait.oam.dev/type=<运维特征定义名称>`       | 对应了运维特征定义（`TraitDefinition`）的名字  |
|          `app.oam.dev/name=<应用实例名称>`          |        应用实例化（Application）的名称         |
|       `app.oam.dev/component=<组件实例名称>`        |                组件实例化的名称                |
| `trait.oam.dev/resource=<运维特征中输出的资源名称>` | 运维特征中输出(outputs.\<资源名称\>)的资源名称 |
|   `app.oam.dev/appRevision=<应用实例的版本名称>`    |               应用实例的版本名称               |

这些元数据可以帮助应用部署以后的运维能力正常运作，比如灰度发布组件在应用更新时根据标签进行灰度发布等，同时这些标签也保证了 KubeVela 被其他系统集成时的正确性。

## 模块定义运行时上下文

模块定义中可以通过 `context` 变量获得一些运行时的上下文信息，具体的列表如下，其中作用范围表示该 Context 变量能够在哪些模块定义中使用：

|           Context 变量           |                                     功能描述                                     |               作用范围               |
| :------------------------------: | :------------------------------------------------------------------------------: | :----------------------------------: |
|      `context.appRevision`       |                          应用当前的实例对应的版本名称                       |        组件定义、运维特征定义        |
|     `context.appRevisionNum`     |                          应用当前的实例对应的版本数字                     |        组件定义、运维特征定义        |
|        `context.appName`         |                            应用当前的实例对应的名称                           |        组件定义、运维特征定义        |
|          `context.name`          | 在组件定义和运维特征定义中表示的是组件名称，在应用策略定义中表示的是应用策略名称 | 组件定义、运维特征定义、应用策略定义 |
|       `context.namespace`        |                            应用当前实例所在的命名空间                            |        组件定义、运维特征定义        |
|        `context.revision`        |                              当前组件实例的版本名称                              |        组件定义、运维特征定义        |
|       `context.parameter`        |                当前组件实例的参数，可以在运维特征中获得组件的参数                |             运维特征定义             |
|         `context.output`         |                           当前组件实例化后的对象结构体                           |        组件定义、运维特征定义        |
| `context.outputs.<resourceName>` |                       当前组件和运维特征实例化以后的结构体                       |        组件定义、运维特征定义        |

同时，在工作流系统当中，由于 `context` 要作用于应用级，与上述用法有很大不同。我们单独对其进行介绍：

|           Context 变量           |                                     功能描述                                     |               作用范围               |
| :------------------------------: | :------------------------------------------------------------------------------: | :----------------------------------: |
|      `context.name`       |                          应用当前实例对应的名称                          |        工作流节点定义        |
|     `context.namespace`     |                          应用当前实例所在的命名空间                           |         工作流节点定义     |
|      `context.labels`       |                          应用当前实例的标签                       |       工作流节点定义       |
|     `context.annotations`     |                          应用当前实例的注释                       |       工作流节点定义        |

最后请注意，在本节介绍的所有的模块化定义概念，都只需要平台的管理员在希望对 KubeVela 进行功能扩展时了解，最终用户对这些概念不需要有任何感知。

[1]:	./oam-model
[2]:	../cue/basic
[3]:	../kube/component
[4]:	../traits/customize-trait
[5]:	../traits/advanced
[6]:	https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/
[7]:	../cue/basic