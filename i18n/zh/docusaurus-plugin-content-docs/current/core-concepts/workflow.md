---
title:  工作流
---

在 KubeVela 里，工作流能够让用户去粘合各种运维任务到一个流程中去，实现自动化地快速交付云原生应用到任意混合环境中。
从设计上讲，工作流是为了定制化控制逻辑：不仅仅是简单地 Apply 所有资源，更是为了能够提供一些面向过程的灵活性。
比如说，使用工作流能够帮助我们实现暂停、人工验证、等待状态、数据流传递、多环境灰度、A/B 测试等复杂操作。

工作流是基于模块化设计的。
每一个工作流模块都由一个 Definition CRD 定义并且通过 K8s API 来提供给用户操作。
工作流模块作为一个“超级粘合剂”可以将你任意的工具和流程都通过 CUE 语言来组合起来。
这让你可以通过强大的声明式语言和云原生 API 来创建你自己的模块。


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

  # 部署 database 然后再 web 组件
  # 在每一步都会确保资源完全部署成功再执行下一步
  # 连接信息还会从 database 组件输出出来传递到 web 组件中
  workflow:
    steps:
      - name: deploy-database
        type: apply-and-wait
        outputs:
          - name: db-conn
            exportKey: outConn
        properties:
          component: database
          resourceType: StatefulSet
          resourceAPIVersion: apps/v1beta2
          names:
            - mysql

      - name: deploy-web
        type: apply-and-wait
        inputs:
          - from: db-conn
            parameterKey: dbConn
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
  name: apply-and-wait
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
          dbConn?: string
        }
        apply: op.#ApplyComponent & {
          component: parameter.component
          if dbConn != _|_ {
            spec: containers: [{env: [{name: "DB_CONN",value: parameter.dbConn}]}]
          }
        }
        // 遍历每一个指定资源并等到状态满足
        step: op.#Steps & {
          for index, resource in parameter.names {
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

            "wait-\(index)": op.#ConditionalWait & {
              if step["resource-\(index)"].workload.status.ready == "true" {
                continue: true
              }
            }
          }
        }
        outConn: apply.status.address.ip
```

接下来我们对上面的例子做更详细的说明：

- 这里有一个 WorkflowStepDefinition 定义了预先模板化的操作流程：
  - 该定义中首先会部署用户指定的组件。
    这里使用了 `op.#ApplyComponent` 指令来部署指定组件的所有资源。
  - 然后会等待所有指定资源都准备好。
    这里使用了 `op.#Read` 指令来读取一个资源到指定字段，然后使用了 `op#ConditionalWait` 指令来等待到 `continue` 字段为 true 。    
- 这里还有一个 Application 用于表达如何使用预先配置好的定义来启动流程去交付两个服务组件：
  - 该应用部署首先会为 `database` 组件执行 `apply-and-wait` 步骤。
    这会触发该步骤定义里面的流程按照当前配置来执行。
  - 第一个步骤执行完后，它将输出 `outConn` 字段的值到一个名叫 `db-conn` 的逻辑输出对象中。
    这也意味着任何后面的步骤可以使用这个 `db-conn` 输出的值来作为输入值使用。
  - 第二个步骤将拿到之前输出的 `db-conn` 的值作为输入值，并用于填值到参数 `dbConn` 中。
  - 接下来第二个步骤将开始执行，也是 `apply-and-wait` 类型，不过这次是用于 `web` 组件，并且这次的 `dbConn` 参数将有输入值。
    这也意味着相应的容器环境变量字段会有值被渲染出来。
  - 当第二个步骤也执行完后，整个工作流将跑完结束。

到这里我们已经介绍完 KubeVela 工作流的基本概念。作为下一步，你可以：


- [动手尝试工作流的实践案例](../end-user/workflow/apply-component).
- [学习创建你自己的 Definition 模块](../platform-engineers/workflow/steps). 
- [了解工作流系统背后的设计和架构](https://github.com/oam-dev/kubevela/blob/master/design/vela-core/workflow_policy.md).
