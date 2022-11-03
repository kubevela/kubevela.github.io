---
title: 配置模版
---

## 什么是配置模版？

有很多的场景需要用户输入格式化的数据，通常称之为配置。配置模版是用来定义配置的输入参数的类型和要求以及配置内容的结构。KubeVela 通过模版引导用户提供正确的配置数据。

配置数据默认存储为 Secret，但也可以通过配置模版定义多种输出资源类型和结构。甚至，你也可以通过定义扩展输出将配置内容输出到第三方 Nacos 配置管理服务中。

## 配置模版的规范

配置模版采用 CUE 语言进行定义，它的规范结构如下：

```cue

metadata: {
	name:         string
	alias?:       string
	description?: string
	scope:        "project" | "system"
	sensitive:    bool
}

template: {
	parameter: {...}
	output?: #Secret
	outputs?: {#AnyResources}
	nacos?: {
		// The endpoint can not references the parameter.
		endpoint: {
			// Users must create a config base the nacos-server template firstly.
			name: string
		}
		format: "json" | "yaml" | "properties" | "toml"
		// could references the parameter
		metadata: {
			dataId:      string
			group:       string
			appName:     string
			namespaceId: string
			tenant:      string
			tag:         string
		}
		content: {...}
	}
}
```

### Metadata（元数据）

* `metadata.name` 这是必填字段，指明该模版的名称。
* `metadata.alias` 指定该模版的别名。
* `metadata.description` 指定该模版的描述信息。
* `metadata.scope` 指定由该模版创建的配置生效范围。可选值包括 “system” 和 "project"。在 VelaUX 中，定义为 "project" 范围的模版可以在项目下创建配置，同时如果在系统层面创建的配置可以被所有项目共享分发和使用。
* `metadata.sensitive` 指定由该模版创建的配置的敏感性，如果为 True 则代表该配置一旦创建不能二次读取和修改。只能通过挂载 Secret 的方式使用。

### Template（模版）

* `template.parameter` 定义该配置需要用户输入的参数，以 CUE 的方式进行定义。

* `template.output` 该字段不是必须的。如果你需要自定义 Secret 的存储结构时使用。默认情况下根据用户输入参数结构进行存储。

* `template.outputs` 该字段不是必须的。如果你需要基于该配置生成除 Secret 以外的任何资源时进行定义。

* `template.nacos` 该字段不是必须的，如果你需要将配置写入第三方 Nacos 服务时进行定义。其中 `template.nacos.name` 字段代表使用的 Nacos 服务，由内置的 `nacos-server` 类型的模版创建服务端点配置。

## 模版管理

* 查询所有模版，默认从 `vela-system` 命名空间下获取。

```bash
vela config-template list
```

* 创建一个模版

```bash
vela config-template apply -f example.cue
```

* 查询创建配置需要的参数及说明

```bash
vela config-template show <Template Name>
```

* 删除模版

```bash
vela config-template delete <Template Name>
```

更多的操作方式，请参考：

```bash
vela config-template --help
```

## 用例

### Image Registry

该用例自定义了 Secret，以符合 Kubernetes 使用该配置拉取私有镜像的要求。

```cue
import (
	"encoding/base64"
	"encoding/json"
	"strconv"
)

metadata: {
	name:        "image-registry"
	alias:       "Image Registry"
	scope:       "project"
	description: "Config information to authenticate image registry"
	sensitive:   false
}

template: {
	output: {
		apiVersion: "v1"
		kind:       "Secret"
		metadata: {
			name:      context.name
			namespace: context.namespace
			labels: {
				"config.oam.dev/catalog": "velacore-config"
				"config.oam.dev/type":    "image-registry"
			}
		}
		if parameter.auth != _|_ {
			type: "kubernetes.io/dockerconfigjson"
		}
		if parameter.auth == _|_ {
			type: "Opaque"
		}
		stringData: {
			if parameter.auth != _|_ && parameter.auth.username != _|_ {
				".dockerconfigjson": json.Marshal({
					"auths": (parameter.registry): {
						"username": parameter.auth.username
						"password": parameter.auth.password
						if parameter.auth.email != _|_ {
							"email": parameter.auth.email
						}
						"auth": base64.Encode(null, (parameter.auth.username + ":" + parameter.auth.password))
					}
				})
			}
			if parameter.insecure != _|_ {
				"insecure-skip-verify": strconv.FormatBool(parameter.insecure)
			}
			if parameter.useHTTP != _|_ {
				"protocol-use-http": strconv.FormatBool(parameter.useHTTP)
			}
		}
	}

	parameter: {
		// +usage=Image registry FQDN, such as: index.docker.io
		registry: *"index.docker.io" | string
		// +usage=Authenticate the image registry
		auth?: {
			// +usage=Private Image registry username
			username: string
			// +usage=Private Image registry password
			password: string
			// +usage=Private Image registry email
			email?: string
		}
		// +usage=For the registry server that uses the self-signed certificate
		insecure?: bool
		// +usage=For the registry server that uses the HTTP protocol
		useHTTP?: bool
	}
}
```

### Nacos Server

该用例作为一个最简配置用例，支持用户集成 Nacos 服务，服务于模版定义中的 Nacos 部分。

```cue
metadata: {
	name:        "nacos-server"
	alias:       "Nacos Server"
	description: "Config the Nacos server connectors"
	sensitive:   false
	scope:       "system"
}

template: {
	parameter: {
		// +usage=Directly configure the Nacos server address
		servers?: [...{
			// +usage=the nacos server address
			ipAddr: string
			// +usage=nacos server port
			port: *8849 | int
			// +usage=nacos server grpc port, default=server port + 1000, this is not required
			grpcPort?: int
		}]
		// +usage=Discover the Nacos servers by the client.
		client?: {
			// +usage=the endpoint for get Nacos server addresses
			endpoint: string
			// +usage=the AccessKey for kms
			accessKey?: string
			// +usage=the SecretKey for kms
			secretKey?: string
			// +usage=the regionId for kms
			regionId?: string
			// +usage=the username for nacos auth
			username?: string
			// +usage=the password for nacos auth
			password?: string
			// +usage=it's to open kms,default is false. https://help.aliyun.com/product/28933.html
			openKMS?: bool
		}
	}
}

```

### Generic Nacos Config

该用例提供了如何将配置写入 Nacos 的参考，你可以根据需要进一步的定义配置具体类型的结构。

```cue
metadata: {
	name:        "nacos-config"
	alias:       "Nacos Configuration"
	description: "Write the configuration to the nacos"
	sensitive:   false
	scope:       "system"
}

template: {
	nacos: {
		// The endpoint can not references the parameter.
		endpoint: {
			// Users must create a config base the nacos-server template firstly.
			name: "nacos"
		}
		format: parameter.contentType

		// could references the parameter
		metadata: {
			dataId: parameter.dataId
			group:  parameter.group
			if parameter.appName != _|_ {
				appName: parameter.appName
			}
			if parameter.namespaceId != _|_ {
				namespaceId: parameter.namespaceId
			}
			if parameter.tenant != _|_ {
				tenant: parameter.tenant
			}
			if parameter.tag != _|_ {
				tag: parameter.tag
			}
		}
		content: parameter.content
	}
	parameter: {
		// +usage=Configuration ID
		dataId: string
		// +usage=Configuration group
		group: *"DEFAULT_GROUP" | string
		// +usage=The configuration content.
		content: {
			...
		}
		contentType: *"json" | "yaml" | "properties" | "toml"
		// +usage=The app name of the configuration
		appName?: string
		// +usage=The namespaceId of the configuration
		namespaceId?: string
		// +usage=The tenant, corresponding to the namespace ID field of Nacos
		tenant?: string
		// +usage=The tag of the configuration
		tag?: string
	}
}

```

### Alibaba Cloud Provider

该用例提供了生成其他类型资源的参考。这里生成了 Terraform 控制器可用的 Provider 资源。

```cue
import "strings"

metadata: {
	name:        "terraform-alibaba"
	alias:       "Terraform Provider for Alibaba Cloud"
	sensitive:   true
	scope:       "system"
	description: "Terraform Provider for Alibaba Cloud"
}

template: {
	outputs: {
		"provider": {
			apiVersion: "terraform.core.oam.dev/v1beta1"
			kind:       "Provider"
			metadata: {
				name:      parameter.name
				namespace: "default"
				labels:    l
			}
			spec: {
				provider: "alibaba"
				region:   parameter.ALICLOUD_REGION
				credentials: {
					source: "Secret"
					secretRef: {
						namespace: "vela-system"
						name:      context.name
						key:       "credentials"
					}
				}
			}
		}
	}

	output: {
		apiVersion: "v1"
		kind:       "Secret"
		metadata: {
			name:      context.name
			namespace: context.namespace
		}
		type: "Opaque"
		stringData: credentials: strings.Join([creds1, creds2], "\n")
	}

	creds1: "accessKeyID: " + parameter.ALICLOUD_ACCESS_KEY
	creds2: "accessKeySecret: " + parameter.ALICLOUD_SECRET_KEY

	l: {
		"config.oam.dev/catalog":  "velacore-config"
		"config.oam.dev/type":     "terraform-provider"
		"config.oam.dev/provider": "terraform-alibaba"
	}

	parameter: {
		//+usage=The name of Terraform Provider for Alibaba Cloud, default is `default`
		name: *"default" | string
		//+usage=Get ALICLOUD_ACCESS_KEY per this guide https://help.aliyun.com/knowledge_detail/38738.html
		ALICLOUD_ACCESS_KEY: string
		//+usage=Get ALICLOUD_SECRET_KEY per this guide https://help.aliyun.com/knowledge_detail/38738.html
		ALICLOUD_SECRET_KEY: string
		//+usage=Get ALICLOUD_REGION by picking one RegionId from Alibaba Cloud region list https://www.alibabacloud.com/help/doc-detail/72379.htm
		ALICLOUD_REGION: string
	}
}
```

## 分享模版

模版配置作为 [插件](../platform-engineers/addon/intro) 的一部分. 你可以在安装插件时获得已有的配置模版，也可以通过制作插件来分享配置模版。
