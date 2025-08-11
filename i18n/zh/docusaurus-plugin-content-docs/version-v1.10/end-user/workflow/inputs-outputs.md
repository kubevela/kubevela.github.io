---
title:  数据传递
---

本节将介绍如何在 KubeVela 中使用 Inputs 和 Outputs 在工作流步骤间进行数据传递。

## Outputs

outputs 由 `name` 和 `valueFrom` 组成。`name` 声明了这个 output 的名称，在 input 中将通过 `from` 引用 output。

`valueFrom` 有以下几种写法：
1. 通过指定 value 来指定值，如：`valueFrom: output.value.status.workflow.message`。注意，`output.value.status.workflow.message` 将使用变量引用的方式从当前步骤的 CUE 模板中取值，如果该步骤的 CUE 模板中没有该字段，那么得到的值为空。
2. 使用 CUE 表达式。如，用 `+` 来连接值和字符串: `valueFrom: output.metadata.name + "testString"`。你也可以引入 CUE 的内置包:
```
valueFrom: |
          import "strings"
          strings.Join(["1","2"], ",")
```

## Inputs

inputs 由 `from` 和 `parameterKey` 组成。`from` 声明了这个 input 从哪个 output 中取值，`parameterKey` 为一个表达式，将会把 input 取得的值赋给对应的字段。

:::caution
如果你想在 `parameterKey` 中使用一个非法的 CUE 变量名（如，含有 `-` 或者以数字开头），你可以用 `[]` 指定，如：

```
inputs:
   - from: output
     parameterKey: data["my-input"]
```
:::

如：
1. 指定 inputs:

```yaml
...
- name: notify
  type: notification
  inputs:
    - from: read-status
      parameterKey: slack.message.text
```

## 如何使用

假设我们已经在集群中有了一个 depends 应用，我们希望在一个新的应用中读取到 depends 应用的工作流状态，并且发送状态信息到 Slack 中。

部署如下应用：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: input-output
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      ports:
        - port: 8000
  workflow:
    steps:
      - name: read
        type: read-object
        properties:
          name: depends
        outputs:
          - name: read-status
            valueFrom: output.value.status.workflow.message
      - name: slack-message
        type: notification
        inputs:
          - from: read-status
            parameterKey: slack.message.text
        properties:
          slack:
            url:
              value: <your slack url>
```

> 读取 depends 应用时，我们使用了 `read-object` 这个步骤类型，在这个步骤类型中，读取到的资源会被放在 `output.value` 中，因此，我们可以使用 `output.value.status.workflow.message` 读取到 depends 应用的工作流状态信息。

当应用成功运行后，我们可以在 Slack 消息通知中收到 `depends` 应用的工作流状态信息。
