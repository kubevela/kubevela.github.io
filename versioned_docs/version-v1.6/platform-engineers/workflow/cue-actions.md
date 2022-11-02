---
title: Built-in Workflow Operations
---

This document introduces the CUE operations that can be used in the workflow step definitions. You need to import the `vela/op` package to use these operations.

:::tip
Before reading this section, make sure you understand how to [customize workflow](./workflow) and learn the basics of [CUE](../cue/basic)
:::

## Process Control

### ConditionalWait

Makes the workflow step wait until the condition is met.

**Parameters**

```
#ConditionalWait: {
	// +usage=If continue is false, the step will wait for continue to be true.
	continue: bool
	// +usage=Optional message that will be shown in workflow step status, note that the message might be override by other actions.
	message?: string
}
```

**Example**

```
import "vela/op"

myRead: op.#Read & {
  value: {
    kind: "Deployment"
    apiVersion: "apps/v1"
    metadata: name: "test-app"
  }
}

wait: op.#ConditionalWait & {
  continue: myRead.value.status.phase == "running"
}
```


### Fail

Make the workflow step failed.

**Parameters**

```
#Fail: {
	// +usage=Optional message that will be shown in workflow step status, note that the message might be override by other actions.
	message?: string
}
```

**Example**

```
import "vela/op"

fail: op.#Fail & {
  message: "error in the step"
}
```

### Message

Write message to the workflow step status.

**Parameters**

```
#Message: {
	// +usage=Optional message that will be shown in workflow step status, note that the message might be override by other actions.
	message?: string
}
```

### DoVar

Used to save or read user-defined data in the context of workflow.

**Parameters**

```
#DoVar: {
	// +usage=The method to call on the variable
	method: *"Get" | "Put"
	// +usage=The path to the variable
	path:   string
	// +usage=The value of the variable
	value?: _
}
```

**Example**

```
put: op.ws.#DoVar & {
  method: "Put"
  path: "foo.score"
  value: 100
}

// The user can get the data saved above through get.value (100)
get: op.ws.#DoVar & {
  method: "Get"
  path: "foo.score"
}

```

## Requests

### HTTPDo

Send HTTP request to the specified URL.

**Parameters**

```
#HTTPDo: {
	// +usage=The method of HTTP request
	method: *"GET" | "POST" | "PUT" | "DELETE"
	// +usage=The url to request
	url: string
	// +usage=The request config
	request?: {
		// +usage=The timeout of this request
		timeout?: string
		// +usage=The request body
		body?: string
		// +usage=The header of the request
		header?: [string]: string
		// +usage=The trailer of the request
		trailer?: [string]: string
		// +usage=The rate limiter of the request
		ratelimiter?: {
			limit:  int
			period: string
		}
	}
	// +usgae=The tls config of the request
	tls_config?: secret: string
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

**Example**

```
import "vela/op"

myRequest: op.#HTTPDo & {
  method: "POST"
  url:    "http://my-url.com"
  request: {
    body: {
      "hello": "body"
    }
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

```
#SendEmail {
	// +usage=The info of the sender
	from: {
		// +usage=The address of the sender
		address:  string
		// +usage=The alias of the sender
		alias?:   string
		// +usage=The password of the sender
		password: string
		// +usage=The host of the sender server
		host:     string
		// +usage=The port of the sender server
		port:     int
	}
	// +usgae=The email address list of the recievers
	to: [...string]
	// +usage=The content of the email
	content: {
		// +usage=The subject of the email
		subject: string
		// +usage=The body of the email
		body:    string
	}
}
```

**Example**

```
import "vela/op"

myEmail: op.#SendEmail & {
  from: {
		address: "hello@mail.com"
		password: "password"
		host: "myhost"
		port: 465
	}
	to: ["world@mail.com", "next@workflow.com"]
	content: {
		subject: "Hello Vela"
		body: "Hello Vela, this is a test email"
	}
}
```

## Resource Management

### Apply

Apply resources in the Kubernetes cluster.

**Parameters**

```
#Apply: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resource to apply
	value: {...}
}
```

**Example**

```
import "vela/op"
myApply: op.#Apply & {
  value: {
    kind: "Deployment"
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

```
#ApplyInParallel: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resources to apply in parallel
	value: [...{...}]
}
```

**Example**

```
import "vela/op"
myApply: op.#ApplyInParallel & {
  value: [{
    kind: "Deployment"
    apiVersion: "apps/v1"
    metadata: name: "test-app"
    spec: { 
      replicas: 2
      ...
    }
  }, {
    kind: "Deployment"
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

```
#Read: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resource to read, this field will be filled with the resource read from the cluster after the action is executed
	value?: {...}
	...
}
```

**Example**

```
import "vela/op"
myRead: op.#Read & {
  value: {
    kind: "Deployment"
    apiVersion: "apps/v1"
    metadata: name: "test-app"
  }
}
```

### List

List resources in the Kubernetes cluster.

**Parameters**

```
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
		namespace?: *"" | string
		// +usage=The label selector to filter the resources
		matchingLabels?: {...}
	}
	// +usage=The listed resources will be filled in this field after the action is executed
	list?: {...}
	...
}
```

**Example**

```
import "vela/op"
myList: op.#List & {
  resource: {
    kind: "Deployment"
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

```

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

```
import "vela/op"
myDelete: op.#Delete & {
  resource: {
    kind: "Deployment"
    apiVersion: "apps/v1"
    metadata: name: "my-app"
  }
}
```

## Application Operations

### Load

Load all the components and its traits in the application.

**Parameters**

```
#Load: {
  // +usage=If specify `app`, use specified application to load its component resources otherwise use current application
	app?: string
	// +usage=The value of the components will be filled in this field after the action is executed, you can use value[componentName] to refer a specified component
	value?: {...}
}
```

**Example**

```
import "vela/op"

// You can use `load.value.[componentName] to refer the component.
load: op.#Load & {}

mycomp: load.value["my-comp"]
```

### ApplyComponent

Create or update resources corresponding to the component in Kubernetes cluster. Note that need to use `Load` first to apply the resources.

**Parameters**

```
#ApplyComponent: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The env to use
	env: *"" | string
	// +usage=The namespace to apply
	namespace: *"" | string
	// +usage=Whether to wait healthy of the applied component
	waitHealthy: *true | bool
	// +usage=The value of the component resource
	value: {...}
	// +usage=The patcher that will be applied to the resource, you can define the strategy of list merge through comments. Reference doc here: https://kubevela.io/docs/platform-engineers/traits/patch-trait#patch-in-workflow-step
	patch?: {...}
}
```

**Example**

```
import "vela/op"
load: op.#Load & {}

apply: op.#ApplyComponent & {
  value: load.value["my-comp"]
}
```

### ApplyApplication

Create or update resources corresponding to the application in Kubernetes cluster.

**Parameters**

```
#ApplyApplication: {}
```

**Example**

```
import "vela/op"
apply: op.#ApplyApplication & {}
```

## Special Operations

### Steps

A combination of a set of operations that can be used to implement complex operation logic.

**Parameters**

```
#Steps: {}
```

**Example**

```
import "vela/op"

env: "prod"

app: op.#Steps & {
  if env == "prod" {
    load: op.#Load & {
      component: "component-name"
    }
    apply: op.#Apply & {
      value: load.value.workload
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

### Slack

Send a request to the specified Slack URL. `#Slack` is actually a secondary wrapper for `#HTTPPost`, we will deprecate this operation in the next version. You can use `#HTTPPost` instead, like:

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

Send a request to the specified DingTalk URL. `#DingTalk` is actually a secondary wrapper of `#HTTPPost`, we will deprecate this operation in the next version. You can use `#HTTPPost` instead, please refer to the example in Slack action.

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

Send a request to the specified Lark URL. `#Lark` is actually a secondary wrapper of `#HTTPPost`, we will deprecate this operation in the next version. You can use `#HTTPPost` instead, please refer to the example in Slack action.

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
