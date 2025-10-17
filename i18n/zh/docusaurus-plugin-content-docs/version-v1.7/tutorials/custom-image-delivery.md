---
title: 自定义容器交付
---

如果默认的 `webservice` 组件类型不能满足你的团队，并且你希望获得一种更简单的方式来部署业务应用。 本指南将为你提供帮助。 在此之前，你必须获得平台管理员的权限。

### 简化 `webservice` 类型

默认的 [webservice](../end-user/components/references.md#webservice) 组件类型有超过 10 个属性。 也许你的开发者只需要配置镜像路径和资源限制。 对于其他属性，团队可以设置默认值。如果是这样，你可以更改 `webservice` 定义。

1. 更改 UI schema 以隐藏某些字段

> 这种方式只适合 UI 用户。

![image](https://kubevela.io/images/1.5/custom-ui-schema.jpg)

在定义详情页面，用户可以自定义 UI schema 来设置 UI 表单。 例如，如果要隐藏 ExposeType 字段，只需要设置 disable 为 `true`。

```yaml
...
- jsonKey: exposeType
  uiType: Select
  label: ExposeType
  disable: true
...
```

更多参考: [UI Schema](../reference/ui-schema.md)

2. 更改定义并增删字段

如果要完全删除或添加某些字段，则应编辑组件定义。

> 本指南需要先学习 CUE 语言。

```bash
vela def get webservice > custom-webservice.cue
```

参考[CUE基础](../platform-engineers/cue/basic.md)和[组件定义](../platform-engineers/components/custom-component.md)文档，了解如何自定义 `custom-webservice.cue`。

编辑完成之后:

```bash
vela def apply custom-webservice.cue
```

### 创建一个新的组件类型来部署 war 包

如果你的团队使用 war 包来部署 Java 应用。 在 KubeVela 中，你可以创建一个新的组件类型来部署 War 包。

```cue
"java-war": {
	alias: ""
	annotations: {}
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
		status: {
			customStatus: #"""
				ready: {
					readyReplicas: *0 | int
				} & {
					if context.output.status.readyReplicas != _|_ {
						readyReplicas: context.output.status.readyReplicas
					}
				}
				message: "Ready:\(ready.readyReplicas)/\(context.output.spec.replicas)"
				"""#
			healthPolicy: #"""
				ready: {
					updatedReplicas:    *0 | int
					readyReplicas:      *0 | int
					replicas:           *0 | int
					observedGeneration: *0 | int
				} & {
					if context.output.status.updatedReplicas != _|_ {
						updatedReplicas: context.output.status.updatedReplicas
					}
					if context.output.status.readyReplicas != _|_ {
						readyReplicas: context.output.status.readyReplicas
					}
					if context.output.status.replicas != _|_ {
						replicas: context.output.status.replicas
					}
					if context.output.status.observedGeneration != _|_ {
						observedGeneration: context.output.status.observedGeneration
					}
				}
				isHealth: (context.output.spec.replicas == ready.readyReplicas) && (context.output.spec.replicas == ready.updatedReplicas) && (context.output.spec.replicas == ready.replicas) && (ready.observedGeneration == context.output.metadata.generation || ready.observedGeneration > context.output.metadata.generation)
				"""#
		}
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: {
			name:      context.name
			namespace: context.namespace
		}
		spec: {
			replicas: parameter.replicas
			selector: {
				matchLabels: {
					"app.oam.dev/component": context.name
				}
			}
			template: {
				metadata: {
					labels: {
						"app.oam.dev/name":      context.appName
						"app.oam.dev/component": context.name
						"app.oam.dev/revision":  context.revision
					}
				}
				spec: {
					initContainers: [{
						name:  "prepare-war"
						image: "busybox"
						if parameter["deployToRoot"] != _|_ {
							if parameter["deployToRoot"] {
								command: ["wget", "-O", "/usr/local/tomcat/webapps/ROOT.war", parameter["warURL"]]
							}
						}
						if parameter["deployToRoot"] == _|_ {
							command: ["wget", "-P", "/usr/local/tomcat/webapps/", parameter["warURL"]]
						}
						volumeMounts: [{
							name:      "webapps"
							mountPath: "/usr/local/tomcat/webapps"
						}]
					}]
					containers: [{
						name:  context.name
						image: "tomcat:" + parameter["envVersion"]
						if parameter["cpu"] != _|_ {
							resources: {
								limits: cpu:   parameter.cpu
								requests: cpu: parameter.cpu
							}
						}
						if parameter["memory"] != _|_ {
							resources: {
								limits: memory:   parameter.memory
								requests: memory: parameter.memory
							}
						}
						ports: [{
							containerPort: 8080
							name:          "webapp"
						}]
						_envs: {
							custom: *parameter["env"] | []
							inner: [
								if parameter["javaOpts"] != _|_ {
									{
										name:  "JAVA_OPTS"
										value: parameter.javaOpts
									}
								},
							]
						}
						env: _envs.custom + _envs.inner
						volumeMounts: [{
							name:      "webapps"
							mountPath: "/usr/local/tomcat/webapps"
						}]
					}]
					volumes: [{
						name: "webapps"
						emptyDir: {}
					}]
				}
			}
		}
	}

	outputs: {
		services: {
			kind:       "Service"
			apiVersion: "v1"
			metadata: {
				name:      context.name
				namespace: context.namespace
			}
			spec: {
				selector: "app.oam.dev/component": context.name
				ports: [{
					port: 8080
				}]
				type: "ClusterIP"
			}
		}
	}

	parameter: {
		// +usage=The URL of the war package.
		warURL: string
		// +usage=Select a environment version([tomcat version]-[jdk version])
		envVersion: *"8-jdk8" | "9-jdk8" | "10-jdk8" | "8-jdk11" | "9-jdk11" | "10-jdk11" | "8-jdk17" | "9-jdk17" | "10-jdk17"
		// +usage=Specifies the number of replicas.
		replicas: *1 | int
		// +usage=Define arguments by using environment variables
		env?: [...{
			name:   string
			value?: string
		}]
		// +usage=Setting the Java Opts configuration.
		javaOpts?: string
		// +usage=Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)
		cpu?: string
		// +usage=Specifies the attributes of the memory resource required for the container.
		memory?:       =~"^([1-9][0-9]{0,63})(E|P|T|G|M|K|Ei|Pi|Ti|Gi|Mi|Ki)$"
		deployToRoot?: bool
	}
}
```

复制上面的定义来创建一个文件 `java-war.cue`，然后：

```bash
vela def apply java-war.cue
```

现在，其他开发人员可以使用 war URL 创建应用，例如：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: nanoservice
  namespace: e2e-test
spec:
  components:
  - name: catalog
    properties:
      envVersion: 8-jdk8
      replicas: 1
      warURL: https://kubevela.io/example/java-example/nanoservice/catalog.war
    type: java-war
  - name: customer
    properties:
      envVersion: 8-jdk8
      replicas: 1
      warURL: https://kubevela.io/example/java-example/nanoservice/customer.war
    type: java-war
  - dependsOn:
    - catalog
    - customer
    name: order
    properties:
      env:
      - name: CATALOG_HOST
        value: catalog
      - name: CUSTOMER_HOST
        value: customer
      envVersion: 8-jdk8
      javaOpts: -Xms512m -Xmx512m -Xss256K
      replicas: 1
      warURL: https://kubevela.io/example/java-example/nanoservice/order.war
    traits:
    - properties:
        domains:
        - nanoservice.beijing.kubevela.net
        rules:
        - path:
            type: PathPrefix
            value: /order
          port: 8080
      type: http-route
    type: java-war
  policies:
  - name: e2e-test
    properties:
      clusters:
      - local
      namespace: e2e-test
    type: topology
  workflow:
    steps:
    - name: deploy2-e2e-test
      properties:
        policies:
        - e2e-test
      type: deploy
```

![java-app](https://kubevela.io/images/1.5/java-war.jpg)

这个例子包括三个组件，order 服务依赖 catalog 和 customer 服务。 开发者只需要关心 war 包 URL 和 tomcat/JRE 版本，Java开发者对此都很熟悉。 开发人员应将 war 包上传到仓库，例如 Jfrog。 获取下载 URL 以分配给 `warURL` 字段。

同样，你可以创建一个组件类型来部署 Jar 包和其他二进制包。
