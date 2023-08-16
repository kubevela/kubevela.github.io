---
title: 将配置写往 Nacos 服务
---

Nacos /nɑ:kəʊs/ 是 Dynamic Naming and Configuration Service的首字母简称，一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台。

Nacos 致力于帮助您发现、配置和管理微服务。Nacos 提供了一组简单易用的特性集，帮助您快速实现动态服务发现、服务配置、服务元数据及流量管理。

Nacos 帮助您更敏捷和容易地构建、交付和管理微服务平台。 Nacos 是构建以“服务”为中心的现代应用架构 (例如微服务范式、云原生范式) 的服务基础设施。

## Nacos 集成

默认情况下，KubeVela 将配置存储为 Secret。但支持通过定义模版将配置内容直接存储到 Nacos 配置中心。在这个场景中，KubeVela 的角色是生成配置内容（例如通过工作流获取动态数据）并以标准格式检查数据封装为目标格式同步到 Nacos 服务中。通过该能力，通常用法是通过 应用工作流 或独立流水线将动态配置写往 Nacos 配置中心。使用 Nacos 为配置管理的微服务系统即可通过 Nacos 服务发现和读取配置。而不依赖于 KubeVela 提供的 Secret 挂载方式。

## 连接一个 Nacos 服务

先确保名称为 `nacos-server` 的配置模版存在。

```bash
vela config-template show nacos-server
```

<details>
  <summary>预期输出</summary>

```
+---------+--------+--------------------------------+----------+---------+---------+
|  NAME   |  TYPE  |          DESCRIPTION           | REQUIRED | OPTIONS | DEFAULT |
+---------+--------+--------------------------------+----------+---------+---------+
| client  | object | Discover the Nacos servers by  | false    |         |         |
|         |        | the client.                    |          |         |         |
| servers | array  | Directly configure the Nacos   | false    |         |         |
|         |        | server address                 |          |         |         |
+---------+--------+--------------------------------+----------+---------+---------+
client
+--------------------+---------+--------------------------------------------+----------+---------+---------+
|        NAME        |  TYPE   |                DESCRIPTION                 | REQUIRED | OPTIONS | DEFAULT |
+--------------------+---------+--------------------------------------------+----------+---------+---------+
| (client).password  | string  | the password for nacos auth                | false    |         |         |
| (client).regionId  | string  | the regionId for kms                       | false    |         |         |
| (client).secretKey | string  | the SecretKey for kms                      | false    |         |         |
| (client).username  | string  | the username for nacos auth                | false    |         |         |
| (client).accessKey | string  | the AccessKey for kms                      | false    |         |         |
| (client).endpoint  | string  | the endpoint for get Nacos                 | true     |         |         |
|                    |         | server addresses                           |          |         |         |
| (client).openKMS   | boolean | it's to open kms,default is false.         | false    |         |         |
|                    |         | https://help.aliyun.com/product/28933.html |          |         |         |
+--------------------+---------+--------------------------------------------+----------+---------+---------+
```

</details>

然后同样通过配置系统创建一个 Nacos 服务的配置:

```bash
vela config create nacos --template nacos-server servers[0].ipAddr=127.0.0.1 servers[0].port=8849
```

## 定义一个 Nacos 配置的模版

系统中默认存在一个通用的 Nacos 配置模版：

```bash
vela config-template show nacos-config
```

<details>
  <summary>预期输出</summary>

```
+-------------+--------+--------------------------------+----------+------------------------+---------------+
|    NAME     |  TYPE  |          DESCRIPTION           | REQUIRED |        OPTIONS         |    DEFAULT    |
+-------------+--------+--------------------------------+----------+------------------------+---------------+
| tag         | string | The tag of the configuration   | false    |                        |               |
| tenant      | string | The tenant, corresponding      | false    |                        |               |
|             |        | to the namespace ID field of   |          |                        |               |
|             |        | Nacos                          |          |                        |               |
| appName     | string | The app name of the            | false    |                        |               |
|             |        | configuration                  |          |                        |               |
| content     | object | The configuration content.     | true     |                        |               |
| contentType | string |                                | true     | json,yaml,properties,toml | json          |
| dataId      | string | Configuration ID               | true     |                        |               |
| group       | string | Configuration group            | true     |                        | DEFAULT_GROUP |
| namespaceId | string | The namespaceId of the         | false    |                        |               |
|             |        | configuration                  |          |                        |               |
+-------------+--------+--------------------------------+----------+------------------------+---------------+
```

</details>

该模版的定义方式参考如下:

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

The template includes the `template.nacos` section means the config created with this template should be written to the Nacos, There are some important sections:

该模版的特点是包括了 `template.nacos` 部分，这意味着由该模版生成的配置即可写往 Nacos 服务。这里有两个关键定义：

* `template.nacos.endpoint` KubeVela 会根据这里配置的 Nacos 服务的配置名称获取实际的连接信息。
* `template.nacos.format` KubeVela 会将配置数据转化为指定的格式，支持的格式包括： `json`, `yaml`, `properties`, and `toml`.

该模版未定义具体的配置数据格式，属于通用的 Nacos 配置模版。你可以参考该定义增加具体的配置数据字段定义，同时通过固定某些配置的方式减少 Nacos 元数据字段。仅暴露必要的参数提供场景化配置类型。

## 写配置的 Nacos 服务

```bash
vela config create db-config --template nacos-config dataId=db group="DEFAULT_GROUP" contentType="properties" content.host=127.0.0.1 content.port=3306 content.username=root
```

该命令代表将下述格式的数据写往 Nacos 服务。

```properties
host = 127.0.0.1
port = 3306
username = root
```

当命令执行成功后，你可以在 Nacos 的 Dashboard 中确认配置是否正常写入。如果配置的 Nacos 服务无法连接，执行命令时将报错。同理我们可以参考 [在流水线中读写配置](./read-write-config-in-pipeline.md) 使用 nacos-config 模版写入配置。
