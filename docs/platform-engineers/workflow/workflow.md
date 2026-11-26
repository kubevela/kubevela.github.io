---
title: Workflow Step Definition
slug: /platform-engineers/workflow/workflow
---

:::tip
Before reading this section, make sure you have understood the concept of [WorkflowStepDefinition](../oam/x-definition.md#workflowstepdefinition) in KubeVela and learned the [basic knowledge of CUE](../cue/basic.md).
:::


In this section, we will introduce how to customize the workflow step in Application by using [CUE](../cue/basic.md) through `WorkflowStepDefinition`.

## Deliver a simple workflow step

We can generate a `WorkflowStepDefinition` CUE file with the command `vela def init <def-name> --type workflow-step > <def-name>.cue`.

Let's take a custom step for sending an HTTP request as an example. KubeVela already ships a step called `request`, so we call ours `my-request` to keep from overwriting it. First, initialize the Definition file:

```shell
vela def init my-request --type workflow-step --desc "Send request to the url" > my-request.cue
```

After initialization, we can see the following in `my-request.cue`:

```cue
"my-request": {
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

KubeVela adds its own packages for the things a step does: `vela/http` sends HTTP requests, `vela/kube` reads and writes Kubernetes objects, `vela/builtin` waits, fails or groups actions, and so on. [Built-in Workflow Operations](./cue-actions.md#packages-a-step-can-import) lists them all. Every action in these packages takes its inputs under `$params` and fills in its results under `$returns`.

Now we can import `vela/http` and CUE's `encoding/json`, use `http.#HTTPDo` to send the request the user asked for, and use `json.Marshal()` to turn the body into a string:

```cue
import (
	"vela/http"
	"encoding/json"
)

"my-request": {
	alias: ""
	annotations: {}
	attributes: {}
	description: "Send request to the url"
	labels: {}
	type: "workflow-step"
}

template: {
	req: http.#HTTPDo & {
		$params: {
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
	}
	parameter: {
		url:    string
		method: *"GET" | "POST" | "PUT" | "DELETE"
		body?: {...}
		header?: [string]: string
	}
}
```

If the HTTP request returns a status code of 400 or above, we want this step to fail, and when the response is JSON we want it parsed so later steps can read it. Before any of that, the step has to wait for the response.

The controller runs a step by evaluating its template, and each action runs as the evaluation reaches it. A `builtin.#ConditionalWait` whose `continue` is false stops the step there and leaves it running. On a later reconcile the controller evaluates the whole template again, from the top, and keeps doing so until the step succeeds or fails. So the wait on `req.$returns` holds the step until the response is in, and nothing below it reads the status code or body before then. Because the template runs again, an action before a wait runs again too: keep it safe to repeat.

`builtin.#Fail` fails the step, and `builtin.#Steps` groups actions so they only run when the `if` holds:

```cue
import (
	"vela/builtin"
	"vela/http"
	"encoding/json"
)

"my-request": {
	alias: ""
	annotations: {}
	attributes: {}
	description: "Send request to the url"
	labels: {}
	type: "workflow-step"
}

template: {
	req: http.#HTTPDo & {
		$params: {
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
	}

	wait: builtin.#ConditionalWait & {
		$params: {
			continue: req.$returns != _|_
			message:  "Waiting for response from \(parameter.url)"
		}
	}

	fail: builtin.#Steps & {
		if req.$returns.statusCode >= 400 {
			requestFail: builtin.#Fail & {
				$params: message: "request of \(parameter.url) is fail: \(req.$returns.statusCode)"
			}
		}
	}

	if req.$returns != _|_ {
		if json.Valid(req.$returns.body) {
			response: json.Unmarshal(req.$returns.body)
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

Use `vela def apply my-request.cue` to deploy this Definition to the cluster, then we can use this custom step directly in the Application.

Deploy the following Application: The first step of the workflow will send an HTTP request to get the information of the KubeVela repository; at the same time, this step will use the star number of the KubeVela repository as the Output, the next step will use this Output as a parameter, and sent it as message to the Slack:

:::tip
Please refer to [Inputs and Outputs](../../end-user/workflow/component-dependency-parameter.md#inputs-and-outputs) for more information of data passing between steps.
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
      type: my-request
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

The shipped [`request` step](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/workflowstep/request.cue) is this definition with a few more parameters (`timeout`, `headersFromSecret`, `ratelimiter`).

:::tip
A workflow step can be tested without an Application or a real cluster: `vela def test` runs it
against a local API server, with calls that would leave it, such as HTTP, answered by mocks. See
[Testing workflow steps](../cue/definition-testing.md#testing-workflow-steps).
:::

## HTTP limits

The controller bounds every HTTP request a workflow step makes, whether through `vela/http`, the legacy `vela/op` or shipped steps such as `request` and `webhook`:

| Limit | Default | Change it with |
| --- | --- | --- |
| Timeout when the request sets none | 3s, or the maximum when that is lower | Set `timeout` on the request |
| Longest timeout a request may set | 60s | `--max-workflow-http-timeout`, Helm value `workflow.http.maxTimeout` (a Go duration such as `90s`) |
| Largest response body | 1048576 bytes (1MiB) | `--max-workflow-http-response-bytes`, Helm value `workflow.http.maxResponseBytes` (a whole number of bytes) |

A request that asks for a timeout of 0, a negative one or one over the maximum fails rather than being clamped, and so does a response over the size limit. A request holds a controller worker for as long as it runs, which is why the timeout has a ceiling.

Component and trait templates that call `vela/http` through CueX have no timeout parameter: their requests may run up to the maximum, and they share the response limit and the destination rules below.

Some destinations can never be reached:

- loopback addresses, which are the controller's own metrics, health and webhook ports;
- `0.0.0.0/8`, `::/128` and the NAT64 prefix `64:ff9b:1::/48`;
- the cloud metadata endpoints: `169.254.0.0/16`, `fe80::/10`, `fd00:ec2::254`, `100.100.100.200` and `metadata.google.internal`.

Private addresses (RFC 1918 and IPv6 ULA) are allowed by default, since steps often call in-cluster services. Turn on the `BlockPrivateHTTPAddresses` feature gate (Helm value `featureGates.blockPrivateHTTPAddresses`) to block them too.

To deny more destinations, add a ConfigMap in the controller's namespace labelled `config.oam.dev/type: vela-core-http-deny`, with one host or CIDR per line. Hosts may be exact names, IP addresses or `*.suffix` wildcards. The controller watches these ConfigMaps and merges every one it finds; they can only add to the list, never remove the entries above.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: extra-http-deny
  namespace: vela-system
  labels:
    config.oam.dev/type: vela-core-http-deny
data:
  denyHosts: |-
    internal.example.com
    *.corp.example.com
  denyCIDRs: |-
    10.20.0.0/16
```

The label value is the Helm value `workflow.httpDeny.configTemplateName` (flag `--workflow-http-deny-config-template-name`), `vela-core-http-deny` by default. The chart also installs a ConfigTemplate of that name, for managing the list as a KubeVela config rather than a raw ConfigMap.

## Wait for a condition

If you want a workflow step to wait until a certain condition is met, or until the status of a resource becomes ready, use `builtin.#ConditionalWait`.

Take waiting for a Deployment as an example: use `kube.#Apply` to deploy a Deployment, then use `builtin.#ConditionalWait` to wait until its replicas are ready:

```cue
import (
	"vela/builtin"
	"vela/kube"
)

"apply-my-deployment": {
	alias: ""
	annotations: {}
	attributes: {}
	description: "Apply a Deployment and wait for it to be ready"
	labels: {}
	type: "workflow-step"
}

template: {
	apply: kube.#Apply & {
		$params: value: {
			apiVersion: "apps/v1"
			kind:       "Deployment"
			metadata: {
				name:      context.stepName
				namespace: context.namespace
			}
			spec: {
				replicas: parameter.replicas
				selector: matchLabels: "app.oam.dev/name": context.appName
				template: {
					metadata: labels: "app.oam.dev/name": context.appName
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
	// Kubernetes omits readyReplicas while it is zero.
	let readyReplicas = [if apply.$returns.value.status.readyReplicas != _|_ {apply.$returns.value.status.readyReplicas}, 0][0]
	wait: builtin.#ConditionalWait & {
		$params: continue: readyReplicas == parameter.replicas
	}
	parameter: {
		image:    string
		replicas: *1 | int
		cmd?: [...string]
	}
}
```

## Full available `context` in Workflow Step {#full-available-context-in-workflow-step}

A workflow step reads the Application's name, namespace and revision, the step's own name and session ID, and the workflow name and publish version from the Application's annotations. In a step, `context.name` is the Application's name, not the step's. Every field, and which definition kinds can read it, is in the [Context Reference](../context-reference.md).

## Legacy `vela/op`

Step definitions written for older releases import `vela/op`, a single package holding most of the actions above without `$params` and `$returns` (`op.#HTTPDo & {method: ..., url: ...}`, then `response.statusCode`). It still works, so existing steps need no change; write new steps on the packages above. [Built-in Workflow Operations](./cue-actions.md) is its reference.

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
