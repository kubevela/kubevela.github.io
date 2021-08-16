---
title: 数据流
---

## 数据流是什么

KubeVela 里的数据流是用来赋能用户在不同的工作流步骤里传递数据的手段。
用户使用数据流的方式是通过编写声明式的字段 -- 即每一个步骤的输入输出 (inputs/outputs)。
这篇文档将阐述如何去编写这些字段来使用数据流功能。

> 完整版例子请参考这个链接: https://github.com/oam-dev/kubevela/blob/master/docs/examples/workflow

## Outputs：输出字段

一个输出字段可以将一个步骤对应的 CUE 模板中的某个 Key 的数据给输出出来。
输出的数据可以在工作流接下来的步骤中被当做输入来使用。

下面是一个如何在 Application 中编写输出字段 (Outputs) 的例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  ...
  workflow:
    steps:
      - name: deploy-server1
        type: apply-component
        properties:
          component: "server1"
        outputs:
          - name: server1IP
            # Any key can be exported from the CUE template of the Definition
            exportKey: "myIP"
```

下面是一个如何编写 CUE 模板提供输出字段的例子：

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
          component: parameter.component
        }
        // export podIP
        myIP: apply.workload.status.podIP
```

## Inputs：输入字段

输入字段可以对应前面发生的输出字段，然后输出的值将被用于填写该步骤的 CUE 模板的指定参数的值。
参数会在工作流步骤运行前先被填值。


下面是一个如何在 Application 中编写输入字段 (Outputs) 的例子：

```yaml
kind: Application
spec:
  ...
  workflow:
    steps:
      ...
      - name: deploy-server2
        type: apply-with-ip
        inputs:
          - from: server1IP
            parameterKey: serverIP
        properties:
          component: "server2"
```

下面是一个如何编写 CUE 模板使用输入字段的例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-with-ip
spec:
  schematic:
    cue:
      template: |
        import ("vela/op")
        parameter: {
          component: string
          // the input value will be used to fill this parameter
          serverIP?: string
        }
        // load component from application
        component: op.#Load & {
          component: parameter.component
          value: {}
        }
        // apply workload to kubernetes cluster
        apply: op.#Apply & {
          value: {
            component.value.workload
            metadata: name: parameter.component
            if parameter.serverIP!=_|_{
              // this data will override the env fields of the workload container
              spec: containers: [{env: [{name: "PrefixIP",value: parameter.serverIP}]}]
            }
          }
        }
        // wait until workload.status equal "Running"
        wait: op.#ConditionalWait & {
          continue: apply.value.status.phase =="Running"
        }
```
