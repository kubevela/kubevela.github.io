---
title: Write Config To Nacos
---

Nacos /nɑ:kəʊs/ is the acronym for 'Dynamic Naming and Configuration Service', an easy-to-use dynamic service discovery, configuration and service management platform for building cloud-native applications。

Nacos is committed to help you discover, configure, and manage your microservices. It provides a set of simple and useful features enabling you to realize dynamic service discovery, service configuration, service metadata and traffic management.

Nacos makes it easier and faster to construct, deliver and manage your microservices platform. It is the infrastructure that supports a service-centered modern application architecture with a microservices or cloud-native approach.

## Nacos Integration

By default, KubeVela saves the config as a Secret. We could define the template and write the config to the Nacos server. In this case, the role of KubeVela is to check the config content and generate the configuration in a certain format and synchronize it to Nacos. Then, you could write the config to Nacos in Workflow and Pipeline.

## Connector a Nacos server

Make sure there is a config template named `nacos-server`.

```bash
vela config-template show nacos-server
```

<details>
  <summary>Expected Outputs</summary>

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

Then create a config to connect the Nacos server:

```bash
vela config create nacos --template nacos-server servers[0].ipAddr=127.0.0.1 servers[0].port=8849
```

## Define a template

There is a default template to help you publish the config to the Nacos:

```bash
vela config-template show nacos-config
```
<details>
  <summary>Expected Outputs</summary>

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

This template cue is like this:

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

* `template.nacos.endpoint` KubeVela will read the Nacos server connector info from the provided config.
* `template.nacos.format` KubeVela will generate the configuration content with the provided format. Supported options include `json`, `yaml`, `properties`, and `toml`.

You could refer to this template to custom the scene template. Expose the required parameters.

## Write a config to Nacos

```bash
vela config create db-config --template nacos-config dataId=db group="DEFAULT_GROUP" contentType="properties" content.host=127.0.0.1 content.port=3306 content.username=root
```

Then, the content will be written to the Nacos server.

```properties
host = 127.0.0.1
port = 3306
username = root
```

After the command is executed successfully, let's check the config in the Nacos Dashboard.
