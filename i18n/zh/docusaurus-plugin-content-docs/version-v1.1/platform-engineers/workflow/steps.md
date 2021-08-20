---
title: 工作流步骤
---

## 工作流步骤是什么

一个工作流步骤 (Step) 从一个定义 (Definition) 的模板出发来实例化出一个对象，并运行它。
工作流步骤是通过 `type` 字段来找到对应的定义：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  ...
  workflow:
    steps:
      - name: deploy-server1
        # type 名与对应的 WorkflowStepDefinition 名称相同
        type: apply-component
        properties:
          component: server1
          ...
```

## 如何定义一个步骤？

一般平台管理员会预先设置好工作流步骤的定义 (WorkflowStepDefinition) 来给开发者使用。
这些定义包含了写好模板的自动化流程去执行过程式任务。
这样一来，那些复杂的底层信息会被屏蔽掉，而暴露给用户的都是简单易用的参数。

下面是一个定义的例子：

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
           prefixIP?: string
        }
        // 加载组件
        component: op.#Load & {
           component: parameter.component
        }
        // 将组件部署到集群中
        apply: op.#ApplyComponent & {
           component: parameter.component
        }
        // 等待直至 workload.status 变成 "Running"
        wait: op.#ConditionalWait & {
           continue: apply.workload.status.phase =="Running"
        }
        // 输出 podIP
        myIP: apply.workload.status.podIP
```

## 用户参数

在 CUE 模板里面，暴露给用户的参数将被定义在 `parameters` 字段中。
在 Application 中的工作流步骤的属性值将被用来给这些参数填值。
此外，我们还支持了使用数据流的方式用其他步骤的输出来为一个步骤的参数填值。

## CUE 动作指令

剩下的 CUE 字段将作为动作指令被逐步执行。
如需知晓更多关于如何编写这些 CUE 动作指令的细节，敬请阅读[CUE 操作文档](./cue-actions)。
