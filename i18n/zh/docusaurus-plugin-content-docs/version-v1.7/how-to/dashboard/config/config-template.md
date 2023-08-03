---
title: 配置模版
---

配置模版是通过 CUE 语言定义，用来描述配置的输入参数，存储结构和其他扩展能力。它的渲染工作方式与 Definition 比较类似。每一个配置模版也代表一种配置类型，可以统一管理配置。

## 什么时候需要自定义模版

1. 创建多个同类型的配置，例如 [镜像仓库集成](./image-registry.md) 和 [Helm 仓库集成](./helm-repo.md)
2. 需要确定配置的输入参数结构并需要进行校验。
3. 需要将配置同时写往 Nacos 配置中心。[参考](./nacos.md)
4. 需要根据用户输入按需渲染 Secret 或其他资源。例如 Grafana 配置可以输出 Secret 和 Grafana CR。
5. 需要对配置进行分类支持 list 查询。

## 如何定义模版

### 定义一个模版

系统中已经存在一些开箱即用的模版可以供大家参考：

* [Helm Repository](https://github.com/kubevela/catalog/blob/master/addons/fluxcd/config-templates/helm-repository.cue)
* [Image Registry](https://github.com/kubevela/catalog/blob/master/addons/velaux/config-templates/image-registry.cue)
* [Nacos Server](https://github.com/kubevela/catalog/blob/master/addons/velaux/config-templates/nacos-server.cue)
* [Nacos Config](https://github.com/kubevela/catalog/blob/master/addons/velaux/config-templates/nacos-config.cue)
* [Alibaba Provider](https://github.com/kubevela/catalog/blob/master/addons/terraform-alibaba/config-templates/alibaba-provider.cue)

更多的配置模版可以在插件仓库中找到。

模版应该包括以下几部分定义：

* metadata(必需)

```cue
metadata: {
	name:        "terraform-alibaba"
	alias:       "Terraform Provider for Alibaba Cloud"
	sensitive:   true
	scope:       "system"
	description: "Terraform Provider for Alibaba Cloud"
}
```

模版的元数据描述。`sensitive` 代表该模版生成的数据是否是敏感数据，为 True 时该模版生成的配置不同进行二次编辑和直接读取。只能通过挂载 Secret使用。`scope` 代表配置的生效范围，有两个可选项 `system` 和 `project`。前者代表该配置只能在系统级别读写，后者代表配置可以在项目级别进行读写和共享。这种控制模式只在 UI 中有效。

* template.parameter(必需)

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

定义配置的输入参数。

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

该部分不是必需的，如果希望自定义 Secret 的存储结构时可以指定。

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

该部分定义输出非 Secret 的其他资源，这些资源随着配置的创建而创建，删除而删除。

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

该部分不是必需的，如果定义则代表这是 Nacos 配置的类型。

### 加载到管控集群

1. 创建或更新模版

```bash
vela config-template apply -f template.cue
```

2. 查看配置的输入参数

```bash
vela config-template show <Template Name>
```

## 如何分享配置模版

我们可以直接将 CUE 脚本复制给其他平台或用户以实现分享。但更常见的分享好用的配置模版给其他社区用户的载体是插件。

这里有一个插件的目录结构，其中 `config-templates` 目录中存放配置模版:

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

当安装该插件后，这些配置模版即可被加载到集群中。
