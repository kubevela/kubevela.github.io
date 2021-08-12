---
title:  部署组件和运维特征
---

本节将介绍如何在 `WorkflowStepDefinition` 部署组件和运维特征。

> 在阅读本部分之前，请确保你已经了解了 KubeVela 中 [Workflow](../../core-concepts/workflow.md) 的核心概念。

## 一键部署组件和运维特征

假设现在我们拥有这样一个应用部署计划：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: express-server
        type: apply-express
        properties:
          name: express-server
```

可以看到，在 `workflow` 中，定义了一个 `type` 为 `apply-express` 的 `step`，并且传递了一个 `name` 参数，参数值为应用中组件的名称。
接下来，我们来编写 `WorkflowStepDefinition`。KubeVela 提供了一个集成的操作符 `ApplyComponent`，通过这个操作符，可以简单的一键部署组件和运维特征。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-express
  namespace: default
spec:
  schematic:
    cue:
      template: |
        import (
        	"vela/op"
        )

        // 获取传递的参数
        parameter: {
          name: string
        }

        // 一键部署组件和运维特征
        apply: op.#ApplyComponent & {
          component: parameter.name
        }
```

`ApplyComponent` 实际上是一系列操作符的集合，接下来我们来介绍如何分开操作并部署组件和运维特征。

## 分开部署组件和运维特征

在 `ApplyComponent` 操作符中，集成了 `Load` 以及 `Apply` 的逻辑。此外，组件和运维特征需要分开部署。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-express
  namespace: default
spec:
  schematic:
    cue:
      template: |
        import (
        	"vela/op"
        )

        // 获取传递的参数
        parameter: {
          name: string
        }

        // 加载组件
        load: op.#Load & {
        	component: parameter.name
        }

        // 部署组件，value 表明取值，workload 表明为组件
        apply: op.#Apply & {
        	value: {
        		load.value.workload
        	}
        }

        // 部署运维特征，value 表明取值，auxiliaries 表明附属的资源，这是一个数组，由于在例子中只有一个运维特征，可以简单使用下标 0 来指定
        apply: op.#Apply & {
          value: {
            load.value.auxiliaries[0]
          }
        }
```

如果拥有多个运维特征，也可以通过循环写法来完成部署：

```yaml
spec:
  schematic:
    cue:
      template: |
        import (
        	"vela/op"
        )

        // 获取传递的参数
        parameter: {
          name: string
        }

        // 加载组件
        load: op.#Load & {
        	component: parameter.name
        }

        // 遍历 auxiliaries 数组并部署
        step: op.#Steps & {
          for index, aux in load.value.auxiliaries {
            "aux-\(index)": op.#Apply & {
              value: aux
            }
          }
        }
```