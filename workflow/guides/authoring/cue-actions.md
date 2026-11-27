---
title: Built-in Workflow Operations
---

This page is the reference for `vela/op`, the legacy package of workflow operations. It is kept so existing step definitions keep working. New steps import the per-concern packages instead (`vela/kube`, `vela/http`, `vela/builtin` and the rest, listed below), which take their inputs under `$params` and return their results under `$returns`. [Workflow Step Definition](step-definition.md) shows a step written that way.

:::tip
Before reading this section, make sure you understand how to [customize workflow](step-definition.md) and learn the basics of [CUE](/docs/next/platform-engineers/cue/basic)
:::

## Packages a step can import

A workflow step template can import CUE's own [builtin packages](https://cuelang.org/docs/concepts/packages/#builtin-packages) and the packages below. The workflow engine provides these, so they work in an Application's workflow and in a WorkflowRun:

| Package | What it does |
| --- | --- |
| `vela/kube` | Apply, patch, read, list and delete Kubernetes objects: `#Apply`, `#Patch`, `#ApplyInParallel`, `#Read`, `#List`, `#Delete`. |
| `vela/http` | Send HTTP requests: `#HTTPDo`, `#HTTPGet`, `#HTTPPost`, `#HTTPPut`, `#HTTPDelete`. |
| `vela/builtin` | Control the step: `#ConditionalWait`, `#Suspend`, `#Break`, `#Fail`, `#Message`, `#Steps`, and `#DoVar` for workflow variables. |
| `vela/email` | Send email: `#SendEmail`. |
| `vela/util` | `#Log`, `#ConvertString` (bytes to string) and `#PatchK8sObject`. |
| `vela/metrics` | Check a Prometheus query: `#PromCheck`. |
| `vela/time` | Convert between dates and timestamps: `#DateToTimestamp`, `#TimestampToDate`. |
| `vela/config` | Create, read, list and delete KubeVela configs. |
| `vela/op` | The legacy package this page describes: most of the above in one flat package, without `$params` and `$returns`. |

vela-core adds these for an Application's workflow. A WorkflowRun reconciled by the `vela-workflow` controller can't import them:

| Package | What it does |
| --- | --- |
| `vela/oam` | Load, render and apply the Application's components: `#LoadComponets`, `#ApplyComponent`, `#RenderComponent` and more. |
| `vela/multicluster` | List clusters, work out placements from topology policies, and `#Deploy`. |
| `vela/query` | Query the resources, pods, services, events and logs of an Application. |
| `vela/terraform` | Load Terraform components and read their connection status. |
| `vela/helm` | Render a Helm chart: `#Render`. |

In vela-core, `vela/addon`, `vela/module`, `vela/registry` and `vela/velaconfig` also compile in a step template, but they are meant for component and source definitions.

The shipped step definitions in the [KubeVela repo](https://github.com/kubevela/kubevela/tree/master/vela-templates/definitions/internal/workflowstep) are the best worked examples of each package.

## Process Control

### ConditionalWait

Makes the workflow step wait until the condition is met.

**Parameters**

```cue
#ConditionalWait: {
	// +usage=If continue is false, the step will wait for continue to be true.
	continue: *false | bool
	// +usage=Optional message that will be shown in workflow step status, note that the message might be override by other actions.
	message?: string
}
```

**Example**

```cue
import "vela/op"

myRead: op.#Read & {
	value: {
		kind:       "Deployment"
		apiVersion: "apps/v1"
		metadata: name: "test-app"
	}
}

// Kubernetes omits readyReplicas while it is zero.
let ready = [if myRead.value.status.readyReplicas != _|_ {myRead.value.status.readyReplicas}, 0][0]

wait: op.#ConditionalWait & {
	continue: ready == myRead.value.spec.replicas
}
```

### Fail

Make the workflow step failed.

**Parameters**

```cue
#Fail: {
	// +usage=Optional message that will be shown in workflow step status, note that the message might be override by other actions.
	message?: string
}
```

**Example**

```cue
import "vela/op"

fail: op.#Fail & {
	message: "error in the step"
}
```

## Data Control

### Log

Output the log or configure the log source for this step. If `op.#Log` is used in a step definition, then you can use `vela workflow logs <name>` to view the log for that step.

**Parameters**

```cue
#Log: {
	// +usage=The data to print in the controller logs
	data?: {...} | string
	// +usage=The log level of the data
	level: *3 | int
	// +usage=The log source of this step. You can specify it from a url or resources. Note that if you set source in multiple op.#Log, only the latest one will work
	source?: close({
		// +usage=Specify the log source url of this step
		url: string
	}) | close({
		// +usage=Specify the log resources of this step
		resources?: [...{
			// +usage=Specify the name of the resource
			name?: string
			// +usage=Specify the cluster of the resource
			cluster?: string
			// +usage=Specify the namespace of the resource
			namespace?: string
			// +usage=Specify the label selector of the resource
			labelSelector?: {...}
		}]
	})
}
```

**Example**

```cue
import "vela/op"

myLog: op.#Log & {
	data: "my custom log"
	source: resources: [{
		labelSelector: {"test-key": "test-value"}
	}]
}
```

### Message

Write message to the workflow step status.

**Parameters**

```cue
#Message: {
	// +usage=Optional message that will be shown in workflow step status, note that the message might be override by other actions.
	message?: string
}
```

**Example**

```cue
import "vela/op"

msg: op.#Message & {
	message: "custom message"
}
```

### DoVar

Used to save or read user-defined data in the context of workflow.

**Parameters**

```cue
#DoVar: {
	// +usage=The method to call on the variable
	method: *"Get" | "Put"
	// +usage=The path to the variable
	path: string
	// +usage=The value of the variable
	value?: _
}
```

**Example**

```cue
import "vela/op"

put: op.#DoVar & {
	method: "Put"
	path:   "foo.score"
	value:  100
}

// The user can get the data saved above through get.value (100)
get: op.#DoVar & {
	method: "Get"
	path:   "foo.score"
}
```

## Requests

### HTTPDo

Send HTTP request to the specified URL.

**Parameters**

```cue
#HTTPDo: {
	// +usage=The method of HTTP request
	method: *"GET" | "POST" | "PUT" | "DELETE"
	// +usage=The url to request
	url: string
	// +usage=The request config
	request?: {
		// +usage=The timeout of this request, greater than 0 and at most the controller's maximum (60s by default); 3s when unset, or the maximum when that is lower
		timeout?: string
		// +usage=The request body
		body?: string
		// +usage=The header of the request
		header?: [string]: string
		// +usage=The trailer of the request
		trailer?: [string]: string
		// +usage=The rate limiter of the request
		ratelimiter?: {
			limit:  int & >0
			period: string
		}
	}
	// +usage=The tls config of the request
	tls_config?: {
		secret:     string
		namespace?: string
	}
	// +usage=The response of the request will be filled in this field after the action is executed
	response: {
		// +usage=The body of the response
		body: string
		// +usage=The header of the response
		header?: [string]: [...string]
		// +usage=The trailer of the response
		trailer?: [string]: [...string]
		// +usage=The status code of the response
		statusCode: int
	}
}
```

`request.body` is a string, so marshal a struct with `json.Marshal` before you send it.

`tls_config.secret` names a Secret holding `ca.crt` to trust the server, and `client.crt` with `client.key` for a client certificate. The Secret is read from the step's namespace unless `tls_config.namespace` names another one. A Secret in another namespace is only read when the Application runs as a user (with authentication on) who may get it there; otherwise the step fails.

Every request is bounded by the controller: it times out after 3s unless `request.timeout` says otherwise, and a timeout over the maximum, or a response body over the size limit, fails the step. See [HTTP limits](step-definition.md#http-limits) for the defaults, the flags that change them and the hosts a request can never reach.

**Example**

```cue
import (
	"vela/op"
	"encoding/json"
)

myRequest: op.#HTTPDo & {
	method: "POST"
	url:    "http://my-url.com"
	request: {
		body: json.Marshal({"hello": "body"})
		header: "Content-Type": "application/json"
	}
}
```

### HTTPGet

Send HTTP GET request to the specified URL.

**Parameters**

Same as HTTPDo, but `method` has been specified as GET.

**Example**

Please refer the example in HTTPDo.

### HTTPPost

Send HTTP POST request to the specified URL.

**Parameters**

Same as HTTPDo, but `method` has been specified as POST.

**Example**

Please refer the example in HTTPDo.

### HTTPPut

Send HTTP PUT request to the specified URL.

**Parameters**

Same as HTTPDo, but `method` has been specified as PUT.

**Example**

Please refer the example in HTTPDo.

### HTTPDelete

Send HTTP DELETE request to the specified URL.

**Parameters**

Same as HTTPDo, but `method` has been specified as DELETE.

**Example**

Please refer the example in HTTPDo.

### SendEmail

Send emails.

**Parameters**

```cue
#SendEmail: {
	// +usage=The info of the sender
	from: {
		// +usage=The address of the sender
		address: string
		// +usage=The alias of the sender
		alias?: string
		// +usage=The password of the sender
		password: string
		// +usage=The host of the sender server
		host: string
		// +usage=The port of the sender server
		port: int
	}
	// +usage=The email address list of the receivers
	to: [...string]
	// +usage=The content of the email
	content: {
		// +usage=The subject of the email
		subject: string
		// +usage=The body of the email
		body: string
	}
}
```

**Example**

Keep the SMTP password in a Secret, not in the definition: a definition is stored in the cluster as plain text, and anyone who can read it would have the password. The step reads the Secret, decodes the value and passes it on.

```cue
import (
	"vela/op"
	"encoding/base64"
)

smtpSecret: op.#Read & {
	value: {
		apiVersion: "v1"
		kind:       "Secret"
		metadata: {
			name:      "smtp-credentials"
			namespace: context.namespace
		}
	}
}

smtpPassword: op.#ConvertString & {
	bt: base64.Decode(null, smtpSecret.value.data["password"])
}

myEmail: op.#SendEmail & {
	from: {
		address:  "hello@mail.com"
		password: smtpPassword.str
		host:     "myhost"
		port:     465
	}
	to: ["world@mail.com", "next@workflow.com"]
	content: {
		subject: "Hello Vela"
		body:    "Hello Vela, this is a test email"
	}
}
```

The shipped `notification` step does the same through its `email.from.password.secretRef` parameter.

## Resource Management

### Apply

Apply resources in the Kubernetes cluster.

**Parameters**

```cue
#Apply: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resource to apply
	value: {...}
	// +usage=The patcher that will be applied to the resource, you can define the strategy of list merge through comments
	patch?: {...}
}
```

**Example**

```cue
import "vela/op"

myApply: op.#Apply & {
	value: {
		kind:       "Deployment"
		apiVersion: "apps/v1"
		metadata: name: "test-app"
		spec: {
			replicas: 2
			...
		}
	}
}
```

### ApplyInParallel

Apply resources in parallel in the Kubernetes cluster.

**Parameters**

```cue
#ApplyInParallel: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resources to apply in parallel
	value: [...{...}]
}
```

**Example**

```cue
import "vela/op"

myApply: op.#ApplyInParallel & {
	value: [{
		kind:       "Deployment"
		apiVersion: "apps/v1"
		metadata: name: "test-app"
		spec: {
			replicas: 2
			...
		}
	}, {
		kind:       "Deployment"
		apiVersion: "apps/v1"
		metadata: name: "test-app2"
		spec: {
			replicas: 2
			...
		}
	}]
}
```

### Read

Read resources in the Kubernetes cluster.

**Parameters**

```cue
#Read: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resource to read, this field will be filled with the resource read from the cluster after the action is executed
	value: {...}
	...
}
```

**Example**

```cue
import "vela/op"

myRead: op.#Read & {
	value: {
		kind:       "Deployment"
		apiVersion: "apps/v1"
		metadata: name: "test-app"
	}
}
```

### List

List resources in the Kubernetes cluster.

**Parameters**

```cue
#List: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resource to list
	resource: {
		// +usage=The api version of the resource
		apiVersion: string
		// +usage=The kind of the resource
		kind: string
	}
	// +usage=The filter to list the resources
	filter?: {
		// +usage=The namespace to list the resources
		namespace: *"" | string
		// +usage=The label selector to filter the resources
		matchingLabels?: {...}
	}
	// +usage=The listed resources will be filled in this field after the action is executed
	list?: {...}
	...
}
```

**Example**

```cue
import "vela/op"

myList: op.#List & {
	resource: {
		kind:       "Deployment"
		apiVersion: "apps/v1"
	}
	filter: {
		matchingLabels: {
			"mylabel": "myvalue"
		}
	}
}
```

### Delete

Delete resources in the Kubernetes cluster.

**Parameters**

```cue
#Delete: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resource to delete
	value: {
		// +usage=The api version of the resource
		apiVersion: string
		// +usage=The kind of the resource
		kind: string
		// +usage=The metadata of the resource
		metadata: {
			// +usage=The name of the resource
			name?: string
			// +usage=The namespace of the resource
			namespace: *"default" | string
		}
	}
	// +usage=The filter to delete the resources
	filter?: {
		// +usage=The namespace to list the resources
		namespace?: string
		// +usage=The label selector to filter the resources
		matchingLabels?: {...}
	}
}
```

**Example**

```cue
import "vela/op"

myDelete: op.#Delete & {
	value: {
		kind:       "Deployment"
		apiVersion: "apps/v1"
		metadata: name: "my-app"
	}
}
```

## Application Operations

`#Load`, `#ApplyComponent` and `#ApplyApplication` work on the Application the workflow belongs to, so they come from vela-core and only work in an Application's workflow. They are in [Built-in Workflow Operations](/docs/next/platform-engineers/workflow/cue-actions#application-operations) in the KubeVela docs.

## Special Operations

### Steps

A combination of a set of operations that can be used to implement complex operation logic.

**Parameters**

```cue
#Steps: {}
```

**Example**

```cue
import "vela/op"

env: "prod"

app: op.#Steps & {
	if env == "prod" {
		apply: op.#Apply & {
			value: {
				apiVersion: "v1"
				kind:       "ConfigMap"
				metadata: name: "prod-settings"
				data: env: "prod"
			}
		}
	}
	if env != "prod" {
		request: op.#HTTPGet & {
			url: "http://my-url.com"
		}
	}
}
```

## Deprecated Operations

:::caution
`#Slack`, `#DingTalk` and `#Lark` were removed from the `vela/op` package in KubeVela 1.10. Use `#HTTPPost` instead, as shown below. The sections are kept for reference when migrating old definitions.
:::

### Slack

Send a request to the specified Slack URL. `#Slack` is actually a secondary wrapper for `#HTTPPost`. You can use `#HTTPPost` instead, like:

```
import (
	"vela/op"
	"encoding/json"
)

message: {
	"hello": "world"
}

mySlack: op.#HTTPPost & {
	url:    "slackURL"
	request: {
		body: json.Marshal(message)
		header: "Content-Type": "application/json"
	}
}
```

**Parameters**

```
#Slack: {
	message: {...}
	slackUrl: string
}
```

**Example**

```
import "vela/op"


myMessage: {
	"hello": "world"
}

myRequest: op.#Slack & {
  message: myMessage
	slackUrl: "slackURL"
}
```

### DingTalk

Send a request to the specified DingTalk URL. `#DingTalk` is actually a secondary wrapper of `#HTTPPost`. You can use `#HTTPPost` instead, please refer to the example in Slack action.

**Parameters**

```
#DingTalk: {
	message: {...}
	dingUrl: string
}
```

**Example**

```
import "vela/op"


myMessage: {
	"hello": "world"
}

myRequest: op.#DingTalk & {
  message: myMessage
	dingUrl: "dingURL"
}
```

### Lark

Send a request to the specified Lark URL. `#Lark` is actually a secondary wrapper of `#HTTPPost`. You can use `#HTTPPost` instead, please refer to the example in Slack action.

**Parameters**

```
#Lark: {
	message: {...}
	larkUrl: string
}
```

**Example**

```
import "vela/op"


myMessage: {
	"hello": "world"
}

myRequest: op.#Lark & {
  message: myMessage
	larkUrl: "larkURL"
}
```
