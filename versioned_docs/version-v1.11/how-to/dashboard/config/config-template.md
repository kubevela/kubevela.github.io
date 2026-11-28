---
title: Config Template
---

A config template is written in CUE. It declares a config's parameters, how the config is stored, and anything else created from it. It renders the way a definition does.

## When you need to custom the template

1. Create multiple configs with the same type. Such as the [Image Registry](./image-registry.md) and the [Helm Repository](./helm-repo.md).
2. Define certain parameters and check the validity.
3. Write the config to the Nacos server. [Reference](./nacos.md)
4. Render and generate the Secret or Other resources by the parameters. Such as the Grafana template.
5. Need to classify the configs and list them.

## How to define a template

### Write a cue template

There are many Out-of-Box templates you could refer to.

* [Helm Repository](https://github.com/kubevela/catalog/blob/master/addons/fluxcd/config-templates/helm-repository.cue)
* [Image Registry](https://github.com/kubevela/catalog/blob/master/addons/velaux/config-templates/image-registry.cue)
* [Nacos Server](https://github.com/kubevela/catalog/blob/master/addons/velaux/config-templates/nacos-server.cue)
* [Nacos Config](https://github.com/kubevela/catalog/blob/master/addons/velaux/config-templates/nacos-config.cue)
* [Alibaba Provider](https://github.com/kubevela/catalog/blob/master/addons/terraform-alibaba/config-templates/alibaba-provider.cue)

More templates let's find in the addon catalog.

A sample template should include sections:

* metadata(Required)

```cue
metadata: {
	name:        "terraform-alibaba"
	alias:       "Terraform Provider for Alibaba Cloud"
	sensitive:   true
	scope:       "system"
	description: "Terraform Provider for Alibaba Cloud"
}
```

Define the base info for this template.

* template.parameter(Required)

```cue
template: {
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

* template.output

```cue
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
```

This section is not required, If you want to specify, it must be a Secret.

* template.outputs

```cue
outputs: {
		"grafana": {
			apiVersion: "o11y.prism.oam.dev/v1alpha1"
			kind:       "Grafana"
			metadata: {
				name: context.name
			}
			spec: {
				endpoint: parameter.endpoint
				if parameter.auth != _|_ {
					access: {
						if parameter.auth.username != _|_ && parameter.auth.password != _|_ {
							username: parameter.auth.username
							password: parameter.auth.password
						}
						if parameter.auth.token != _|_ {
							token: parameter.auth.token
						}
					}
				}
			}
		}
	}
```

This section defines the output resources other than Secret. They will be created after the config is created and deleted after the config is deleted. 

* template.nacos

```cue
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
```

This section is not required if you don't want to create a Nacos config template.

### Apply to the hub cluster

1. Create or update a template

```bash
vela config-template apply -f template.cue
```

2. Show the parameters of the template

```bash
vela config-template show <Template Name>
```

## A complete example

This template stores a webhook URL and the token to call it with. Save it as `webhook.cue`:

```cue
metadata: {
	name:        "webhook"
	alias:       "Webhook"
	scope:       "system"
	description: "A webhook URL and the token to call it with"
	sensitive:   true
}

template: {
	parameter: {
		// +usage=The URL to call
		url: string
		// +usage=The token sent with each call
		token: string
	}
	output: {
		apiVersion: "v1"
		kind:       "Secret"
		metadata: {
			name:      context.name
			namespace: context.namespace
		}
		type: "Opaque"
		stringData: {
			url:   parameter.url
			token: parameter.token
		}
	}
}
```

`sensitive: true` keeps the config from being read through the API or a workflow step; Applications can still mount the Secret.

Apply the template, then create a config from it:

```bash
vela config-template apply -f webhook.cue
vela config create ci-webhook -t webhook url=https://ci.example.com/hooks/deploy token=<token>
```

`vela config-template apply` stores the template as a ConfigMap in `vela-system`. `vela config create` renders it and writes the Secret `ci-webhook` in `vela-system`, holding `url` and `token`; `vela config list` shows the new config.

## How to share the template

We could copy the cue script to others. But, The addon is a common carrier to share the user-friendly config templates to more community users.

This is an example:

```bash
├── config-templates
│   ├── image-registry.cue
│   ├── nacos-config.cue
│   └── nacos-server.cue
├── metadata.yaml
├── parameter.cue
├── readme.md
├── readme_cn.md
├── resources
│   ├── apiserver.cue
│   └── velaux.cue
```

When installing this addon, the templates will be applied to the hub cluster.
