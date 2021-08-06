---
title: 模块定义（X-Definitions）
---

最终用户使用的 OAM 模型 [应用部署计划 Application](./oam-model) 中，有很多声明“类型的字段”，如组件类型、运维特征类型、应用策略类型、工作流节点类型等，这些类型实际上就是 OAM 模型的模块定义（X-Definition）。

模块定义（X-Definition）是所有模块化能力的代称，目前主要包括组件定义（ComponentDefinition），运维特征定义（TraitDefinition）、应用策略定义（PolicyDefinition），工作流节点定义（WorkflowStepDefinition）等，随着系统演进，OAM 模型未来可以根据场景需要增加模块化定义概念。

模块化定义的实例，就是具体的各种功能类型，KubeVela 内置的组件类型，如 webservice 就是组件定义的一种模块化定义实例。KubeVela 的系统管理员，也就是平台工程师或 DevOps 工程师，可以非常容易的通过编写和注册模块化定义的实例，来扩展 KubeVela 系统支持的功能类型。

## 组件定义（ComponentDefinition）


The component model (`ComponentDefinition` API) is designed to allow *component providers* to encapsulate deployable/provisionable entities with a wide range of tools, and hence give a easier path to End User to deploy complicated microservices across hybrid environments at ease. A component normally carries its workload type description (i.e. `WorkloadDefinition`), a encapsulation module with a parameter list.

> Hence, a components provider could be anyone who packages software components in form of Helm chart of CUE modules. Think about 3rd-party software distributor, DevOps team, or even your CI pipeline.

Components are shareable and reusable. For example, by referencing the same *Alibaba Cloud RDS* component and setting different parameter values, End User could easily provision Alibaba Cloud RDS instances of different sizes in different availability zones.

End User will use the `Application` entity to declare how they want to instantiate and deploy a group of certain components. In above example, it describes an application composed with Kubernetes stateless workload (component `foo`) and a Alibaba Cloud OSS bucket (component `bar`) alongside.

### How it Works?

In above example, `type: worker` means the specification of this component (claimed in following `properties` section) will be enforced by a `ComponentDefinition` object named `worker` as below:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: worker
  annotations:
    definition.oam.dev/description: "Describes long-running, scalable, containerized services that running at backend. They do NOT have network endpoint to receive external network traffic."
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
                }]
              }
            }
          }
        }
        parameter: {
          image: string
          cmd?: [...string]
        }
```


Hence, the `properties` section of `backend` only exposes two parameters to fill: `image` and `cmd`, this is enforced by the `parameter` list of the `.spec.template` field of the definition.

## Traits

Traits (`TraitDefinition` API) are operational features provided by the platform. A trait augments the component instance with operational behaviors such as load balancing policy, network ingress routing, auto-scaling policies, or upgrade strategies, etc.

To attach a trait to component instance, the user will declare `.type` field to reference the specific `TraitDefinition`, and `.properties` field to set property values of the given trait. Similarly, `TraitDefinition` also allows you to define *template* for operational features.

In the above example, `type: autoscaler` in `frontend` means the specification (i.e. `properties` section) of this trait will be enforced by a `TraitDefinition` object named `autoscaler` as below:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "configure k8s HPA for Deployment"
  name: hpa
spec:
  appliesToWorkloads:
    - deployments.apps
  schematic:
    cue:
      template: |
        outputs: hpa: {
          apiVersion: "autoscaling/v2beta2"
          kind:       "HorizontalPodAutoscaler"
          metadata: name: context.name
          spec: {
            scaleTargetRef: {
              apiVersion: "apps/v1"
              kind:       "Deployment"
              name:       context.name
            }
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

The application also have a `sidecar` trait.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  annotations:
    definition.oam.dev/description: "add sidecar to the app"
  name: sidecar
spec:
  appliesToWorkloads:
    - deployments.apps
  schematic:
    cue:
      template: |-
        patch: {
           // +patchKey=name
           spec: template: spec: containers: [parameter]
        }
        parameter: {
           name: string
           image: string
           command?: [...string]
        }
```

Please note that the End User do NOT need to know about definition objects, they learn how to use a given capability with visualized forms (or the JSON schema of parameters if they prefer). Please check the [Generate Forms from Definitions](../openapi-v3-json-schema) section about how this is achieved.

## Standard Contract Behind The Abstractions

Once the application is deployed, KubeVela will index and manage the underlying instances with name, revisions, labels and selector etc in automatic approach. These metadata are shown as below.

|                           Label                            |                     Description                     |
| :--------------------------------------------------------: | :-------------------------------------------------: |
|    `workload.oam.dev/type=<component definition name>`     | The name of its corresponding `ComponentDefinition` |
|        `trait.oam.dev/type=<trait definition name>`        |   The name of its corresponding `TraitDefinition`   |
|               `app.oam.dev/name=<app name>`                |      The name of the application it belongs to      |
|          `app.oam.dev/component=<component name>`          |       The name of the component it belongs to       |
| `trait.oam.dev/resource=<name of trait resource instance>` |         The name of trait resource instance         |
|      `app.oam.dev/appRevision=<name of app revision>`      | The name of the application revision it belongs to  |


Consider these metadata as a standard contract for any "day 2" operation controller such as rollout controller to work on KubeVela deployed applications. This is the key to ensure the interoperability for KubeVela based platform as well.
