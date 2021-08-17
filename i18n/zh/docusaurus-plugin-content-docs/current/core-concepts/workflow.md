---
title:  工作流
---

在 KubeVela 里，工作流能够让用户去粘合各种运维任务到一个流程中去，实现自动化地快速交付云原生应用到任意混合环境中。
从设计上讲，工作流是为了定制化控制逻辑：不仅仅是简单地 Apply 所有资源，更是为了能够提供一些面向过程的灵活性。
比如说，使用工作流能够帮助我们实现暂停、人工验证、等待状态、数据流传递、多环境灰度、A/B 测试等复杂操作。

下面是一个例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  components:
    - name: database
      type: helm
      properties:
        repoUrl: chart-repo-url
        chart: mysql

    - name: web
      type: helm
      properties:
        repoUrl: chart-repo-url
        chart: my-web

  # Deploy the database first and then the web component.
  # In each step, it ensures the resource has been deployed successfully before jumping to next step.
  # The connection information will be emitted as output from database and input for web component.
  workflow:

    # Workflow contains multiple steps and each step instantiates from a Definition.
    # By running a workflow of an application, KubeVela will orchestrate the flow of data between steps.
    steps:
      - name: deploy-database
        type: apply-and-wait
        outputs:
          - name: db-conn
            exportKey: dbConn
        properties:
          component: database
          resourceType: StatefulSet
          resourceAPIVersion: apps/v1beta2
          names:
            - mysql

      - name: deploy-web
        type: apply-and-wait
        inputs:
          - from: db-conn # input comes from the output from `deploy-database` step
            parameterKey: mysqlConn
        properties:
          component: web
          resourceType: Deployment
          resourceAPIVersion: apps/v1
          names:
            - my-web

---
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: step-def
  namespace: default
spec:
  schematic:
    cue:
      template: |
        import (
        	"vela/op"
        )

        parameter: {
          component: string
          names: [...string]
          resourceType: string
          resourceAPIVersion: string
        }

        // apply the component
        apply: op.#ApplyComponent & {
          component: parameter.component
        }

        // iterate through given resource names and wait for them
        step: op.#Steps & {
          for index, resource in parameter.names {
            
            // read resource object
            "resource-\(index)": op.#Read & {
              value: {
                kind: parameter.resourceType
                apiVersion: parameter.resourceAPIVersion
                metadata: {
                  name: resource
                  namespace: context.namespace
                }
              }
            }

            // wait until resource object satisfy given condition. If not, it will reconcile again later
            "wait-\(index)": op.#ConditionalWait & {
              if step["resource-\(index)"].workload.status.ready == "true" {
                continue: true
              }
            }
          }
        }

```

工作流是基于模块化设计的。
每一个工作流模块都是一个 Definition CRD 并且通过 K8s API 来提供给用户操作。
工作流模块作为一个“超级粘合剂”可以将你任意的工具和流程都通过 CUE 语言来组合起来。
这让你可以通过强大的声明式语言和云原生 API 来创建你自己的模块。

作为下一步，你可以：


- [动手尝试工作流的实践案例](../end-user/workflow/apply-component).
- [学习创建你自己的 Definition 模块](../platform-engineers/workflow/steps). 
- [了解工作流系统背后的设计和架构](https://github.com/oam-dev/kubevela/blob/master/design/vela-core/workflow_policy.md).

