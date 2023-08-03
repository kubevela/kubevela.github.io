---
title:  CUE 操作符
---

这个文档介绍在工作流步骤的定义过程中，可以使用的 CUE 操作符。你需要引用 `vela/op` 包来使用这些操作符。

:::tip
在阅读本部分之前，请确保你已经了解如何[自定义工作流](./workflow.md) 且学习掌握了 [CUE 的基本知识](../cue/basic.md)
:::

## 流程控制

### ConditionalWait

让该工作流步骤处于等待状态，直到条件被满足。

**参数定义**

```
#ConditionalWait: {
	// +usage=If continue is false, the step will wait for continue to be true.
	continue: bool
	// +usage=Optional message that will be shown in workflow step status, note that the message might be override by other actions.
	message?: string
}
```

**用法示例**

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

让该工作流步骤处于失败状态。

**参数定义**

```
#Fail: {
	// +usage=Optional message that will be shown in workflow step status, note that the message might be override by other actions.
	message?: string
}
```

**用法示例**

```
import "vela/op"

fail: op.#Fail & {
  message: "error in the step"
}
```

## 数据控制

### Log

在该步骤中输出日志，或者配置该步骤的日志来源。如果某个步骤定义中使用了 `op.#Log`，那么你可以使用 `vela workflow logs <name>` 来查看该步骤的日志。

**参数定义**

```
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
			name?:      string
			// +usage=Specify the cluster of the resource
			cluster?:   string
			// +usage=Specify the namespace of the resource
			namespace?: string
			// +usage=Specify the label selector of the resource
			labelSelector?: {...}
		}]
	})
}
```

**用法示例**

```
import "vela/op"

myLog: op.#Log & {
  data: "my custom log"
	resources: [{
		labelsSelector: {"test-key": "test-value"}
	}]
}
```

### Message

往该工作流步骤状态的 Message 中写入信息。

**参数定义**

```
#Message: {
	// +usage=Optional message that will be shown in workflow step status, note that the message might be override by other actions.
	message?: string
}
```

**用法示例**

```
import "vela/op"

msg: op.#Message & {
  message: "custom message"
}
```

### DoVar

用来在 workflow 的上下文中保存或者读取用户定义的数据

**参数定义**

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

**用法示例**

```
put: op.ws.#DoVar & {
  method: "Put"
  path: "foo.score"
  value: 100
}

// 用户可以通过get.value拿到上面保存的数据(100)
get: op.ws.#DoVar & {
  method: "Get"
  path: "foo.score"
}

```

## 网络请求

### HTTPDo

向指定 URL 发送 HTTP 请求。

**参数定义**

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

**用法示例**

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

向指定 URL 发送 HTTP GET 请求。

**参数定义**

同 HTTPDo，但是 `method` 已被指定为 GET。

**用法示例**

参考 HTTPDo。

### HTTPPost

向指定 URL 发送 HTTP POST 请求。

**参数定义**

同 HTTPDo，但是 `method` 已被指定为 POST。

**用法示例**

参考 HTTPDo。

### HTTPPut

向指定 URL 发送 HTTP PUT 请求。

**参数定义**

同 HTTPDo，但是 `method` 已被指定为 PUT。

**用法示例**

参考 HTTPDo。

### HTTPDelete

向指定 URL 发送 HTTP DELETE 请求。

**参数定义**

同 HTTPDo，但是 `method` 已被指定为 DELETE。

**用法示例**

参考 HTTPDo。

### SendEmail

发送邮件。

**参数定义**

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

**用法示例**

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

## 资源操作

### Apply

在 Kubernetes 集群中创建或者更新资源。

**参数定义**

```
#Apply: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resource to apply
	value: {...}
}
```

**用法示例**

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

在 Kubernetes 集群中批量创建或者更新资源。

**参数定义**

```
#ApplyInParallel: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resources to apply in parallel
	value: [...{...}]
}
```

**用法示例**

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

在 Kubernetes 集群中读取资源。

**参数定义**

```
#Read: {
	// +usage=The cluster to use
	cluster: *"" | string
	// +usage=The resource to read, this field will be filled with the resource read from the cluster after the action is executed
	value?: {...}
	...
}
```

**用法示例**

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

在 Kubernetes 集群中列出资源。

**参数定义**

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

**用法示例**

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

在 Kubernetes 集群中删除资源。

**参数定义**

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

**用法示例**

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

## 对当前应用的操作

### Load

获取当前应用部署计划中所有组件对应的资源数据。

**参数定义**

```
#Load: {
  // +usage=If specify `app`, use specified application to load its component resources otherwise use current application
	app?: string
	// +usage=The value of the components will be filled in this field after the action is executed, you can use value[componentName] to refer a specified component
	value?: {...}
}
```

**用法示例**

```
import "vela/op"

// 该操作完成后，你可以使用 `load.value[componentName]` 来获取到对应组件的资源数据
load: op.#Load & {}

mycomp: load.value["my-comp"]
```

### ApplyComponent

在 Kubernetes 集群中创建或者更新组件对应的所有资源。注意，在使用该操作前需要先用 `Load` 加载资源。

**参数定义**

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

**用法示例**

```
import "vela/op"
load: op.#Load & {}

apply: op.#ApplyComponent & {
  value: load.value["my-comp"]
}
```

### ApplyApplication

在 Kubernetes 集群中创建或者更新应用对应的所有资源。

**参数定义**

```
#ApplyApplication: {}
```

**用法示例**

```
import "vela/op"
apply: op.#ApplyApplication & {}
```

## 特殊操作

### Steps

用于一组操作的组合，可以用于实现复杂的操作逻辑。

**参数定义**

```
#Steps: {}
```

**用法示例**

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

## 废弃操作

### Slack

向指定 Slack URL 发送请求。`#Slack` 实际上是对 `#HTTPPost` 的二次封装，我们将在下个版本废弃这个操作。你可以使用 `#HTTPPost` 替代，如：

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

**参数定义**

```
#Slack: {
	message: {...}
	slackUrl: string
}
```

**用法示例**

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

向指定 DingTalk URL 发送请求。`#DingTalk` 实际上是对 `#HTTPPost` 的二次封装，我们将在下个版本废弃这个操作。你可以使用 `#HTTPPost` 替代，请参考 Slack 操作中的例子。

**参数定义**

```
#DingTalk: {
	message: {...}
	dingUrl: string
}
```

**用法示例**

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

向指定 Lark URL 发送请求。`#Lark` 实际上是对 `#HTTPPost` 的二次封装，我们将在下个版本废弃这个操作。你可以使用 `#HTTPPost` 替代，请参考 Slack 操作中的例子。

**参数定义**

```
#Lark: {
	message: {...}
	larkUrl: string
}
```

**用法示例**

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