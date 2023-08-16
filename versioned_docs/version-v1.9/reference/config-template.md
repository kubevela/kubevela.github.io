---
title: Config Template
---

## What is Config Template?

There are many scenarios to need users to provide structured data which is a config. `Config Template` could define the schema and the structure of the config data. KubeVela could base the `Config Template` help users to create a valid config.

The config data save as a Secret default, but you also could generate resources of any type by defining the template. Even, you can define the extend writer to write the config data to the Nacos server.

## Config Template Specification

`Config Template` defined with the CUE file. The schema of the specification:

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

### Metadata

* `metadata.name` This is required. Specify the name of the template.
* `metadata.alias` Specify the alias of the template.
* `metadata.description` Specify the description of the template.
* `metadata.scope` Specify the scope of the config created by this template. In VelaUX, the template belonging to the project scope means this template could be used to create the config in the project. If created in the system, this config could be shared with all projects.
* `metadata.sensitive` Is it sensitive the config created by this template? If the config is sensitive, it can not be read directly and could only mount the Secret.

### Template

* `template.parameter` Specify the parameters of the config. KubeVela will generate the schema by this definition and validate the user's input.

* `template.output` This is not required. You could specify if you want to customize the data structure of the Secret.

* `template.outputs` This is not required. You could specify any resources that you want to generate by this config.

* `template.nacos` This is not required. You could specify the Nacos config metadata if you want to write the config data to the Nacos server. `template.nacos.name` This is the name of the config created by the built-in template `nacos-server`.

## Config Template Management

* List the Config Templates

```bash
vela config-template list
```

* Create a Config Template

```bash
vela config-template apply -f example.cue
```

* Show the schema and document of the Config Template

```bash
vela config-template show <Template Name>
```

* Delete a Config Template

```bash
vela config-template delete <Template Name>
```

More usages, refer to:

```bash
vela config-template --help
```

## Examples

### Image Registry

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

## Share the Template

The Config Template is part of the [Addon](../platform-engineers/addon/intro.md). You could get or share the templates via addons.
