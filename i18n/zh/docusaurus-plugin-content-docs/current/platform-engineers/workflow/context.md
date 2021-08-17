---
title: 工作流中的上下文(context)
---

用户在定义工作流步骤的定义 (WorkflowStepDefinition) 时可以使用 `context` 
来获取 Application 的任意元信息。

下面是一个例子：

```yaml
cue:
  template: |
    import ("vela/op")
    parameter: {
        component: string
    }
    // apply workload to kubernetes cluster
    apply: op.#ApplyComponent & {
        component: parameter.component
        workload: patch: {
          metadata: {
            labels: app: context.name
            labels: version: context.labels["version"]
          }
        }
    }
```
