---
title: 数据流
---

## 数据流是什么

KubeVela 里的数据流是用来赋能用户在不同的工作流步骤里传递数据的手段。
用户使用数据流的方式是通过编写声明式的字段：即每一个步骤的输入输出 (inputs/outputs)。
这篇文档将阐述如何去编写这些字段来使用数据流功能。

> 完整版例子请参考这个链接: https://github.com/oam-dev/kubevela/blob/master/docs/examples/workflow

## 输出字段 (Outputs)

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

与上面对应，使用一个 CUE 模版提供输出字段是这样的：

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

可以看到，当我们在 WorkflowStepDefinition 的 CUE 模板里定义 `myIP` 字段，并且当 Application 里 outputs 的 exportKey 也指定了 `myIP` 字段时，它的值将被输出出去。我们将在下面看到输出的值可以如何使用。


## 输入字段 (Inputs)

输入字段可以对应前面输出的值，然后将输出的值用于填值该步骤的 CUE 模板的指定参数。
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

可以看到，`deploy-server2` 工作流步骤中 inputs 有一个 `from: server1IP` 对应了之前的 `deploy-server1` 步骤的一个输出字段。
到这里前面的输出值这时候将被用来给 `deploy-server2` 的参数 `serverIP` 填值。

下面是 `deploy-server2` 对应的 `apply-with-ip` WorkflowStepDefinition 的定义：

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

可以看到，这个步骤渲染的对象是需要拿到 `serverIP`，也就是之前部署的服务的 IP 来作为环境变量传入。
到这里，我们看到了一个完整的数据流传递的故事。
