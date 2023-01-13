---
title: Workflow Step Definition
slug: /platform-engineers/workflow/workflow
---

:::tip
Before reading this section, make sure you have understood the concept of [WorkflowStepDefinition](../oam/x-definition#WorkflowStepDefinition) in KubeVela and learned the [basic knowledge of CUE](../cue/basic).
:::


In this section, we will introduce how to customize the workflow step in Application by using [CUE](../cue/basic) through `WorkflowStepDefinition`.

## Deliver a simple workflow step

We can generate `WorkflowStepDefinition` CUE file with command `vela def <def-name> --type workflow-step > <def-name>.cue`.

Let's take a custom step for sending an HTTP request as an example, first, initialize the Definition file:

```shell
vela def init request --type workflow-step --desc "Send request to the url" > request.cue
```

After initialization, we can see the following in `request.cue`:

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

Inside the `template` is the execution logic for this workflow step. We can define `parameter` in `template` to receive the parameters passed in by the user:

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

CUE provides a series of [basic builtin packages](https://cuelang.org/docs/concepts/packages/#builtin-packages), such as: `regexp`, `json`, `strings`, `math`, etc.

At the same time, KubeVela also provides the `vela/op` package by default, which contains a series of built-in workflow [CUE actions](./cue-actions), such as: sending HTTP requests, operating K8s resources, printing logs, etc.

Now we can import KubeVela's built-in `vela/op` package and CUE's official `encoding/json`, use `op.#HTTPDo` to send HTTP requests according to the user's parameters, and use `json.Marshal()` to marshal the data.

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

If the HTTP request returns a status code greater than 400, we expect this step to be failed. Use `op.#Fail` to fail this step, and the definition is like:

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

Use `vela def apply -f request.cue` to deploy this Definition to the cluster, then we can use this custom step directly in the Application.

Deploy the following Application: The first step of the workflow will send an HTTP request to get the information of the KubeVela repository; at the same time, this step will use the star number of the KubeVela repository as the Output, the next step will use this Output as a parameter, and sent it as message to the Slack:

:::tip
Please refer to [Inputs and Outputs](../../end-user/workflow/component-dependency-parameter#inputs-and-outputs) for more information of data passing between steps.
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

## Custom Health Checks

If you want to wait a period of time in a workflow step until a certain condition is met, or until the status of a resource becomes ready, you can use `op.#ConditionalWait`.

Take the status of waiting for a Deployment as an example, use `op.#Apply` to deploy a Deployment, and then use `op.#ConditionalWait` to wait for the status of the Deployment to become ready:

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

## Full available `context` in Workflow Step

KubeVela allows you to reference some runtime data via the `context` keyword.

In a workflow step definition, you can use the following context data:

|     Context Variable     |                         Description                          |  Type  |
| :----------------------: | :----------------------------------------------------------: | :----: |
|      `context.name`      |                 The name of the Application.                 | string |
|    `context.appName`     |                 The name of the Application.                 | string |
|   `context.namespace`    |              The namespace of the Application.               | string |
|  `context.appRevision`   |               The revision of the Application.               | string |
|    `context.stepName`    |                  The name of current step.                   | string |
| `context.stepSessionID`  |                   The ID of current step.                    | string |
|     `context.spanID`     |      The trace ID of current step in this reconcile.      | string |
|  `context.workflowName`  |          The workflow name specified in annotation.          | string |
| `context.publishVersion` | The version of application instance specified in annotation. | string |


## Kubernetes API for WorkflowStepDefinition

KubeVela is fully programmable through CUE, while it leverages Kubernetes as a control plane and is consistent with the API in YAML.

Therefore, the CUE Definition will be translated into the Kubernetes API when applied to the cluster.

Workflow step definitions will be in the following API format:

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


## More examples to learn

You can check the following resources for more examples:

- Builtin workflow step definitions in the [KubeVela github repo](https://github.com/kubevela/kubevela/tree/master/vela-templates/definitions/internal/workflowstep).
- Definitions defined in addons in the [catalog repo](https://github.com/kubevela/catalog/tree/master/addons).
