---
title:  部署组件和运维特征
---

## 总览

本节将介绍如何在 `WorkflowStepDefinition` 部署组件和运维特征。

## 一键部署组件和运维特征

部署如下应用特征计划及流程步骤定义：

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

---
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

## 分开部署组件和运维特征

在 `ApplyComponent` 操作符中，集成了 `Load` 以及 `Apply` 的逻辑。我们也可以通过部署如下流程步骤定义，来分开部署组件和运维特征：

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

        // 遍历 auxiliaries 数组并部署
        step: op.#Steps & {
          for index, aux in load.value.auxiliaries {
            "aux-\(index)": op.#Apply & {
              value: aux
            }
          }
        }
```

## 预期结果

所有的组件及运维特征都被成功地部署到了集群中。