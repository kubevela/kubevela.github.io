---
title: 使用 CUE 和 KubeVela 为任意的 Kubernetes 资源构建灵活的抽象
author: 孙健波（天元）
author_title: KubeVela Team
author_url: https://github.com/kubevela/KubeVela
author_image_url: https://KubeVela.io/img/logo.svg
tags: [ KubeVela, Abstraction]
description: ""
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

本篇博客将介绍如何使用 CUE 和 KubeVela 构建自己的抽象 API，以降低 Kubernetes 资源的复杂性。 作为平台构建者，你可以动态定制抽象，根据需求为你的开发者构建一条由浅入深的路径，适应越来越多的不同场景，满足公司长期业务发展的迭代需求。

<!--truncate-->

## 将 Kubernetes API 对象转换为自定义组件

我们以 [Kubernetes StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) 为例开始，将其转换为自定义模块并提供能力。

将官方文档中 StatefulSet 的 YAML 例子保存到本地，命名为 `my-stateful.yaml`，然后执行如下命令：

	 vela def init my-stateful -t component --desc "My StatefulSet component." --template-yaml ./my-stateful.yaml -o my-stateful.cue

查看生成的 “my-stateful.cue” 文件：

	$ cat my-stateful.cue
	"my-stateful": {
		annotations: {}
		attributes: workload: definition: {
			apiVersion: "<change me> apps/v1"
			kind:       "<change me> Deployment"
		}
		description: "My StatefulSet component."
		labels: {}
		type: "component"
	}
	
	template: {
		output: {
			apiVersion: "v1"
			kind:       "Service"
				... // omit non-critical info
		}
		outputs: web: {
			apiVersion: "apps/v1"
			kind:       "StatefulSet"
				... // omit non-critical info
		}
		parameter: {}
	}

按如下步骤修改生成的文件：

1. 官网的 StatefulSet 例子是由 `StatefulSet` 和 `Service` 两个对象组合而成的复合组件。 根据 KubeVela [自定义组件规则](https://kubevela.io/docs/platform-engineers/components/custom-component)，在复合组件中，其中一个资源（在我们的示例中是 StatefulSet）需要作为核心工作负载以 `template.output` 字段来表示，而其他辅助对象则由 `template.outputs` 表示。所以我们做一些调整，所有自动生成的 output 和 outputs 都需要被调换。

2. 然后我们将核心工作负载的 apiVersion 和 kind 数据填入带有 `<change me>` 标记的部分。

修改后可以使用 `vela def vet` 进行格式检查和验证。

	$ vela def vet my-stateful.cue
	Validation succeed.

两步修改后的文件如下：

	$ cat my-stateful.cue
	"my-stateful": {
		annotations: {}
		attributes: workload: definition: {
			apiVersion: "apps/v1"
			kind:       "StatefulSet"
		}
		description: "My StatefulSet component."
		labels: {}
		type: "component"
	}
	
	template: {
		output: {
			apiVersion: "apps/v1"
			kind:       "StatefulSet"
			metadata: name: "web"
			spec: {
				selector: matchLabels: app: "nginx"
				replicas:    3
				serviceName: "nginx"
				template: {
					metadata: labels: app: "nginx"
					spec: {
						containers: [{
							name: "nginx"
							ports: [{
								name:          "web"
								containerPort: 80
							}]
							image: "k8s.gcr.io/nginx-slim:0.8"
							volumeMounts: [{
								name:      "www"
								mountPath: "/usr/share/nginx/html"
							}]
						}]
						terminationGracePeriodSeconds: 10
					}
				}
				volumeClaimTemplates: [{
					metadata: name: "www"
					spec: {
						accessModes: ["ReadWriteOnce"]
						resources: requests: storage: "1Gi"
						storageClassName: "my-storage-class"
					}
				}]
			}
		}
		outputs: web: {
			apiVersion: "v1"
			kind:       "Service"
			metadata: {
				name: "nginx"
				labels: app: "nginx"
			}
			spec: {
				clusterIP: "None"
				ports: [{
					name: "web"
					port: 80
				}]
				selector: app: "nginx"
			}
		}
		parameter: {}
	}

将 ComponentDefinition 安装到 Kubernetes 集群中：

	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful created in namespace vela-system.

你可以通过 `vela components` 命令看到一个 `my-stateful` 组件：

	$ vela components
	NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION
	...
	my-stateful	vela-system	statefulsets.apps                    	My StatefulSet component.
	... 

当把这个自定义的组件放入 `Application` 中时，它看起来像这样：

	cat <<EOF | vela up -f -
	apiVersion: core.oam.dev/v1beta1
	kind: Application
	metadata:
	  name: website
	spec:
	  components:
	    - name: my-component
	      type: my-stateful
	EOF


## 为组件定义自定义参数

在上一节中，我们定义了一个没有参数的 ComponentDefinition。 在本节中，我们将演示如何暴露参数。

在此示例中，我们向用户暴露以下参数：

* 镜像名称，允许用户自定义镜像
* 实例名称，允许用户自定义生成的 StatefulSet 对象和 Service 对象的实例名称


		... # Omit other unmodified fields
		template: {
			output: {
				apiVersion: "apps/v1"
				kind:       "StatefulSet"
				metadata: name: parameter.name
				spec: {
					selector: matchLabels: app: "nginx"
					replicas:    3
					serviceName: "nginx"
					template: {
						metadata: labels: app: "nginx"
						spec: {
							containers: [{
								image: parameter.image
			
							    ... // Omit other unmodified fields
							}]
						}
					}
					    ... // Omit other unmodified fields
				}
			}
			outputs: web: {
				apiVersion: "v1"
				kind:       "Service"
				metadata: {
					name: "nginx"
					labels: app: "nginx"
				}
				spec: {
					... // Omit other unmodified fields	
			    }
			}
			parameter: {
				image: string
				name: string
			}
		}

修改后使用 `vela def apply` 安装到集群中：

	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful in namespace vela-system updated.

作为平台构建者，你已完成设置。 现在，让我们看看开发者的体验。

## 开发者体验

开发者唯一需要学习的是[开放应用模型](https://oam.dev/)，它始终遵循统一的格式。

### 发现组件

开发者可以通过以下方式发现和检查 `my-stateful` 组件的参数：

```
$ vela def list
NAME                            TYPE                    NAMESPACE   DESCRIPTION
my-stateful                     ComponentDefinition     vela-system My StatefulSet component.
...snip...
```

	$ vela show my-stateful
	# Properties
	+----------+-------------+--------+----------+---------+
	|   NAME   | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
	+----------+-------------+--------+----------+---------+
	| name     |             | string | true     |         |
	| image    |             | string | true     |         |
	+----------+-------------+--------+----------+---------+

更新 ComponentDefinition 不会影响现有的应用。下次更新应用后才会生效。

### 在 Application 中使用组件

开发人员可以轻松地在 application 中指定三个新的参数：

```
	apiVersion: core.oam.dev/v1beta1
	kind: Application
	metadata:
	  name: website
	spec:
	  components:
	    - name: my-component
	      type: my-stateful
	      properties:
	        image: nginx:latest
	        name: my-component
```

唯一需要做的就是通过执行 `vela up -f app-stateful.yaml` 来部署 yaml 文件（假设名为 `app-stateful.yaml`）。

然后就可以看到 StatefulSet 对象的名称、镜像和实例数都更新了。

## 用于诊断或集成的试运行

为了确保开发者的应用在这些参数下可以正确运行，你还可以使用 `vela dry-run` 命令来验证模板的试运行情况。

```shell
vela dry-run -f app-stateful.yaml
```

通过查看输出，你可以比较生成的对象是否与你的实际期望一致。 你甚至可以将这个 YAML 直接执行到 Kubernetes 集群中，并使用结果进行验证。

<details>

```
# Application(website) -- Component(my-component)
---

apiVersion: v1
kind: Service
metadata:
  labels:
    app: nginx
    app.oam.dev/appRevision: ""
    app.oam.dev/component: my-component
    app.oam.dev/name: website
    workload.oam.dev/type: my-stateful
  name: nginx
  namespace: default
spec:
  clusterIP: None
  ports:
  - name: web
    port: 80
  selector:
    app: nginx
  template:
    spec:
      containers:
      - image: saravak/fluentd:elastic
        name: my-sidecar

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: my-component
    app.oam.dev/name: website
    trait.oam.dev/resource: web
    trait.oam.dev/type: AuxiliaryWorkload
  name: web
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  serviceName: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: k8s.gcr.io/nginx-slim:0.8
        name: nginx
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - mountPath: /usr/share/nginx/html
          name: www
      terminationGracePeriodSeconds: 10
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 1Gi
      storageClassName: my-storage-class
```

</details>

你还可以使用 `vela dry-run -h` 查看更多可用的参数。

## 使用 `context` 避免重复

KubeVela 允许你通过 [`context` 关键字](https://kubevela.io/docs/platform-engineers/components/custom-component#cue-context) 引用应用的运行时信息。

在上面的例子中，properties 中的 `name` 字段和 Component 的 `name` 字段具有相同的含义，所以我们可以使用 `context` 来避免重复。 我们可以在运行时使用 `context.name` 来引用组件名称，因此不再需要 `parameter` 中的 name 参数。

只需像下面这样修改定义文件（my-stateful.cue）

	... # Omit other unmodified fields
	template: {
		output: {
			apiVersion: "apps/v1"
			kind:       "StatefulSet"
    -       metadata: name: parameter.name
	+		metadata: name: context.name

				... // Omit other unmodified field

		}
	    parameter: {
    -       name: string
			image: string
		}
	}

然后通过以下方式部署更改：

```
vela def apply my-stateful.cue
```

之后，开发人员可以立即运行应用，如下所示：

```
	apiVersion: core.oam.dev/v1beta1
	kind: Application
	metadata:
	  name: website
	spec:
	  components:
	    - name: my-component
	      type: my-stateful
	      properties:
	        image: "nginx:latest"
```

任何系统都没有升级或重新启动，它们都会根据你的需要动态地产生影响。

## 按需添加运维特征

OAM 遵循“关注点分离”的原则，在开发人员完成组件部分后，运维人员可以在应用中添加 trait 来控制部署的其它配置。例如，运维人员可以控制副本、添加 labels/annotations、注入环境变量/sidecar、添加持久卷等等。

从技术上讲，trait 有两种工作方式：

- 增补/覆盖 组件中定义的配置。
- 生成更多配置。

自定义过程与组件相同，都使用 CUE，但增补和覆盖的关键字不同，详细信息可以参考 [自定义运维特征](https://kubevela.io/docs/platform-engineers/traits/customize-trait)。

## traits 的运维经验

安装 KubeVela 后已经有一些内置的 traits。 运维人员可以使用 `vela traits` 查看，带有 `*` 的 traits 是通用的 traits，可以对常见的 Kubernetes 资源对象进行操作。

	$ vela traits
	NAME                    	NAMESPACE  	APPLIES-TO      	CONFLICTS-WITH	POD-DISRUPTIVE	DESCRIPTION
	annotations             	vela-system	*               	              	true          	Add annotations on K8s pod for your workload which follows
	                        	           	                	              	              	the pod spec in path 'spec.template'.
	configmap               	vela-system	*               	              	true          	Create/Attach configmaps on K8s pod for your workload which
	                        	           	                	              	              	follows the pod spec in path 'spec.template'.
	labels                  	vela-system	*               	              	true          	Add labels on K8s pod for your workload which follows the
	                        	           	                	              	              	pod spec in path 'spec.template'.
	scaler                  	vela-system	*               	              	false         	Manually scale K8s pod for your workload which follows the
	                        	           	                	              	              	pod spec in path 'spec.template'.
	sidecar                 	vela-system	*               	              	true          	Inject a sidecar container to K8s pod for your workload
	                        	           	                	              	              	which follows the pod spec in path 'spec.template'.
	...snip...

以 sidecar 为例，可以查看 sidecar 的使用情况：

	$ vela show sidecar
	# Properties
	+---------+-----------------------------------------+-----------------------+----------+---------+
	|  NAME   |               DESCRIPTION               |         TYPE          | REQUIRED | DEFAULT |
	+---------+-----------------------------------------+-----------------------+----------+---------+
	| name    | Specify the name of sidecar container   | string                | true     |         |
	| cmd     | Specify the commands run in the sidecar | []string              | false    |         |
	| image   | Specify the image of sidecar container  | string                | true     |         |
	| volumes | Specify the shared volume path          | [[]volumes](#volumes) | false    |         |
	+---------+-----------------------------------------+-----------------------+----------+---------+
	
	
	## volumes
	+------+-------------+--------+----------+---------+
	| NAME | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
	+------+-------------+--------+----------+---------+
	| path |             | string | true     |         |
	| name |             | string | true     |         |
	+------+-------------+--------+----------+---------+

直接使用 sidecar 注入容器，应用的描述如下：

	apiVersion: core.oam.dev/v1beta1
	kind: Application
	metadata:
	  name: website
	spec:
	  components:
	    - name: my-component
	      type: my-stateful
	      properties:
	        image: nginx:latest
	        name: my-component
	      traits:
	      - type: sidecar
	        properties:
	          name: my-sidecar
	          image: saravak/fluentd:elastic

部署并运行这个应用，可以看到 StatefulSet 中已经部署并运行了一个 fluentd sidecar。

组件和运维特征都可以在任何 KubeVela 系统上重用，我们可以将组件、运维特征与 CRD 控制器一起打包为插件。 社区中有 [越来越多的插件目录](https://github.com/kubevela/catalog)。

## 总结

本博客介绍如何通过 CUE 提供完整的模块化功能。 核心是可以根据用户需求动态地增加配置能力，逐步暴露更多的功能和用法，从而降低用户的整体学习门槛，最终提高研发效率。
KubeVela 提供开箱即用的功能，包括组件、运维特征、策略和工作流，也被设计为可插件化和可修改的功能。

