---
title:  自定义工作流
slug: /platform-engineers/workflow/workflow
---

:::tip
在阅读本部分之前，请确保你已经了解 KubeVela 中 [工作流节点定义（WorkflowStepDefinition）](../oam/x-definition.md#工作流节点定义（WorkflowStepDefinition）) 的概念且学习掌握了 [CUE 的基本知识](../cue/basic.md)
:::

本节将以工作流步骤定义的例子展开说明，介绍如何使用 [CUE](../cue/basic.md) 通过工作流步骤定义`WorkflowStepDefinition` 来自定义应用部署计划的工作流步骤。

## 交付一个简单的工作流步骤

我们可以通过 `vela def <def-name> --type workflow-step > <def-name>.cue` 来生成一个 `workflow-step` 类型的 Definition CUE 文件。

我们以一个发送 HTTP 请求的自定义步骤为例，首先初始化这个 Definition 文件：

```shell
vela def init request --type workflow-step --desc "Send request to the url" > request.cue
```

初始化完成后，我们可以在 `request.cue` 中看到如下内容：

```cue
request: {
	alias: ""
	annotations: {}
	attributes: {}
	description: "Send request to the url"
	labels: {}
	type: "workflow-step"
}

template: {
}
```

`template` 中是这个工作流步骤的执行逻辑。我们先在 `template` 中定义 `parameter`，用于接收用户传入的参数：

```cue
template: {
  parameter: {
		url:    string
		method: *"GET" | "POST" | "PUT" | "DELETE"
		body?: {...}
		header?: [string]: string
	}
}
```

CUE 提供了一系列[基础内置包](https://cuelang.org/docs/concepts/packages/#builtin-packages)，如：`regexp`, `json`, `strings`, `math` 等。

同时，KubeVela 也默认提供了 `vela/op` 包，其中包含了一系列内置的工作流 [CUE 操作符](./cue-actions.md)，如：发送 HTTP 请求，操作 K8s 资源，打印日志等，来帮助你更好地编写工作流步骤。

我们在这引用 KubeVela 内置的 `vela/op` 包以及 CUE 官方的 `encoding/json`，使用 `op.#HTTPDo` 根据用户的参数发送 HTTP 请求，并使用 `json.Marshal()` 来进行数据类型的转换。

```cue
import (
	"vela/op"
	"encoding/json"
)

request: {
	alias: ""
	annotations: {}
	attributes: {}
	description: "Send request to the url"
	labels: {}
	type: "workflow-step"
}

template: {
	http: op.#HTTPDo & {
		method: parameter.method
		url:    parameter.url
		request: {
			if parameter.body != _|_ {
				body: json.Marshal(parameter.body)
			}
			if parameter.header != _|_ {
				header: parameter.header
			}
		}
	}
	parameter: {
		url:    string
		method: *"GET" | "POST" | "PUT" | "DELETE"
		body?: {...}
		header?: [string]: string
	}
}
```

如果 HTTP 请求返回的状态码大于 400，则我们希望这个步骤的状态是失败的。使用 `op.#Fail` 是步骤的状态变为失败。这样一个发送请求的自定义步骤最终为：

```cue
import (
	"vela/op"
	"encoding/json"
)

request: {
	alias: ""
	annotations: {}
	attributes: {}
	description: "Send request to the url"
	labels: {}
	type: "workflow-step"
}

template: {
	http: op.#HTTPDo & {
		method: parameter.method
		url:    parameter.url
		request: {
			if parameter.body != _|_ {
				body: json.Marshal(parameter.body)
			}
			if parameter.header != _|_ {
				header: parameter.header
			}
		}
	}
	fail: op.#Steps & {
		if http.response.statusCode > 400 {
			requestFail: op.#Fail & {
				message: "request of \(parameter.url) is fail: \(http.response.statusCode)"
			}
		}
	}
	response: json.Unmarshal(http.response.body)
	parameter: {
		url:    string
		method: *"GET" | "POST" | "PUT" | "DELETE"
		body?: {...}
		header?: [string]: string
	}
}
```

使用 `vela def apply -f request.cue` 将这个 Definition 部署到集群中，接着，我们就可以直接在应用部署计划中使用这个自定义步骤了。

部署如下应用部署计划：工作流的第一步会发送一个 HTTP 请求，得到 KubeVela 仓库的信息；同时，这个步骤会将 KubeVela 仓库的 Star 数作为 Output，下一个步骤将使用这个 Output 作为参数，并将其作为消息内容发送到 Slack 消息中：

:::tip
有关于参数传递的更多信息，请参考 [工作流参数传递](../../end-user/workflow/component-dependency-parameter.md#参数传递)。
:::

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: request-http
  namespace: default
spec:
  components: []
  workflow:
    steps:
    - name: request
      type: request
      properties:
        url: https://api.github.com/repos/kubevela/kubevela
      outputs:
        - name: stars
          valueFrom: |
            import "strconv"
            "Current star count: " + strconv.FormatInt(response["stargazers_count"], 10)
    - name: notification
      type: notification
      inputs:
        - from: stars
          parameterKey: slack.message.text
      properties:
        slack:
          url:
            value: <your slack url>
```

## 自定义健康检查和状态

如果你希望在工作流步骤中等待一段时间，直到某个条件满足，或者直到某个资源的状态变为 Ready，你可以使用 `op.#ConditionalWait`。

以等待 Deployment 的状态为例，先使用 `op.#Apply` 部署一个 Deployment，再使用 `op.#ConditionalWait` 来等待这个 Deployment 的状态变为 Ready：

```cue
import (
	"vela/op"
)

"apply-deployment": {
	alias: ""
	annotations: {}
	attributes: {}
	description: ""
	labels: {}
	type: "workflow-step"
}

template: {
	output: op.#Apply & {
		value: {
			apiVersion: "apps/v1"
			kind:       "Deployment"
			metadata: {
				name:      context.stepName
				namespace: context.namespace
			}
			spec: {
				selector: matchLabels: wr: context.stepName
				template: {
					metadata: labels: wr: context.stepName
					spec: containers: [{
						name:  context.stepName
						image: parameter.image
						if parameter["cmd"] != _|_ {
							command: parameter.cmd
						}
					}]
				}
			}
		}
	}
	wait: op.#ConditionalWait & {
		continue: output.value.status.readyReplicas == 1
	}
	parameter: {
		image: string
		cmd?: [...string]
	}
}
```

## 工作流步骤定义中的 Context 运行时信息

KubeVela 让你可以在运行时，通过 `context` 关键字来引用一些信息。

在工作流步骤定义中，你可以使用如下 Context 信息：

|         Context Variable         |                                                                                  Description                                                                                  |    Type    |
| :------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------: |
|          `context.name`          |                                                 应用部署计划的名称                                                  |   string   |
|        `context.appName`         |                                                    应用部署计划的名称                                                     |   string   |
|       `context.namespace`        |          应用部署计划的命名空间          |   string   |
|        `context.appRevision`        |                                                              应用部署计划的版本                                                              |   string   |
|       `context.stepName`        |          当前步骤的名称          |   string   |
|       `context.stepSessionID`        |          当前步骤的 ID          |   string   |
|       `context.spanID`        |          当前步骤此次执行的 Trace ID          |   string   |
|      `context.workflowName`      |                                                                  应用部署计划 Annotation 中声明的工作流名称                                                                   |   string   |
|     `context.publishVersion`     |                                                         应用部署计划 Annotation 中声明的版本                                                               |   string   |


## Kubernetes 中的 WorkflowStepDefinition

KubeVela 通过 CUE 完全可编程，同时它利用 Kubernetes 作为控制平面并与 YAML 中的 API 保持一致。

因此，CUE Definition 在应用到集群时将被转换为 Kubernetes API。

工作流步骤定义将采用以下 API 格式：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  annotations:
    definition.oam.dev/description: <Function description>
spec:
  schematic:
    cue: # Details of workflow steps defined by CUE language
      template: <CUE format template>
```


## 更多例子

你还可以在以下例子中找到更多的工作流步骤定义：

- [KubeVela 仓库](https://github.com/kubevela/kubevela/tree/master/vela-templates/definitions/internal/workflowstep) 中的内置工作流步骤定义。
- [插件 Catalog 仓库](https://github.com/kubevela/catalog/tree/master/addons) 中的更多例子。
