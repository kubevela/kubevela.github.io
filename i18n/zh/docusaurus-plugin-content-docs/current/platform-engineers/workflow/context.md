---
title: 工作流上下文
---

用户在定义 WorkflowStepDefinition 时可以使用 `context` 来获取该 Application 的任意元信息。

下面是一个例子：

```yaml
kind: WorkflowStepDefinition
metadata:
  name: my-step
spec:
  cue:
    template: |
      import ("vela/op")
      parameter: {
          component: string
      }
      apply: op.#ApplyComponent & {
          component: parameter.component
          workload: patch: {
            metadata: {
              labels: {
                app: context.name
                version: context.labels["version"]
              }
            }
          }
      }
```

当我们部署下面 Application:

```yaml
kind: Application
metadata:
  name: example-app
  labels:
    version: v1.0
spec:
  workflow:
    steps:
      - name: example
        type: my-step
        properties:
          component: example
```

这时候 `context.XXX` 将填写相应的 Application 元信息：

```
apply: op.#ApplyComponent & {
    ...
          app: "example-app" // context.name
          version: "v1.0" // context.labels["version"]
        }
      }
    }
}
```
