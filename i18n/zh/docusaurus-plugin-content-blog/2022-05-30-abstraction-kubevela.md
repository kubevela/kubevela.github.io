---
title: 使用 CUE 和 KubeVela 为任何 Kubernetes 资源构建灵活的抽象
author: Jianbo Sun
author_title: KubeVela Team
author_url: https://github.com/kubevela/KubeVela
author_image_url: https://KubeVela.io/img/logo.svg
tags: [ KubeVela, Abstraction]
description: ""
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

这篇博客会介绍如何使用 CUE 和 KubeVela 构建你自己的抽象 API，来降低 Kubernetes 资源的复杂度。作为平台搭建者，你可以动态定制抽象，根据需求为你的开发者构建由浅入深的路径，适应越来越多的不同场景，满足公司长期业务发展的迭代需求。

## 把 Kubernetes API 对象转换为自定义组件


让我们使用 [Kubernetes StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) 作为例子来开始我们的探索之旅, 我们会把它转换成为一个自定义的模块并赋予一些能力。

把官方 StatefulSet 的文档中的 YAML 示例保存到本地并命名为`my-stateful.yaml`，然后执行下面的命令：

	 vela def init my-stateful -t component --desc "My StatefulSet component." --template-yaml ./my-stateful.yaml -o my-stateful.cue

查看命令生成的 "my-stateful.cue" 文件的内容：

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

按照下面的步骤修改生成的文件：

1. StatefulSet 官网的例子是一个由`StatefulSet`和`Service`两个对象组成的复合组件。依照 KubeVela [自定义组件规范](https://kubevela.io/docs/platform-engineers/components/custom-component) 对复合组件的规定，其中一个资源（在我们的示例中为 StatefulSet）需要通过 `template.output` 字段表示为核心工作负载，而其他辅助对象则通过 `template.outputs` 表示，因此我们进行一些调整，把自动生成的`output`和`outputs`互换了一下。
2. 然后我们需要编辑核心工作负载中被局部标记为`<change me>`的 apiVersion 和 kind 字段。

修改完成之后，你可以使用`vela def vet`来进行格式检查和验证。

	$ vela def vet my-stateful.cue
	Validation succeed.

下面是经历两个步骤修改之后的文档：

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

把 ComponentDefinition 安装到 Kubernetes 集群中：

	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful created in namespace vela-system.

你可以通过`vela components`命令观察到`my-stateful`组件已被成功安装到集群中：

	$ vela components
	NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION
	...
	my-stateful	vela-system	statefulsets.apps                    	My StatefulSet component.
	... 

当你使用它创建一个`Application`时，可以这样写：

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

在上面我们定义了一个没有参数的 ComponentDefinition。 这部分我们来演示下如何暴露参数出来。

在这个例子里，我们将会暴露下面的参数给用户：

* 镜像名称，允许用户自定义镜像
* 实例名称，允许用户自定义生成的 StatefulSet 对象和 Service 对象的实例名称


		... # 跳过其他无修改的字段
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
			
							    ... // 跳过其他无修改的字段
							}]
						}
					}
					    ... // 跳过其他无修改的字段
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
					... // 跳过其他无修改的字段
			    }
			}
			parameter: {
				image: string
				name: string
			}
		}

修改完成之后，使用`vela def apply` 命令来把它安装到集群中：

	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful in namespace vela-system updated.

作为一个平台建设者，你已经完成你的设置。 接下来，让我们来看看开发人员如何使用它。

## 开发者体验

你的开发人员唯一需要做的事情是学习始终遵循统一格式的 [Open Application Model](https://oam.dev/)。

### 发现组件

开发人员可以通过下面的方式来发现组件和查看`my-stateful`组件的参数：

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


更新 ComponentDefinition 不会对已经创建的应用生效。只有应用在下次更新的时候，才会生效。

### 在应用中使用组件

开发人员可以在应用定义中轻松的指定这三个新增的参数：

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

唯一剩下的事情就是部署这个 yaml 文件了，执行`vela up -f app-stateful.yaml`命令即可。

然后你会看到一些 StatefulSet 的名称，镜像已经更新了。

## 用于诊断或集成的试运行

为了确保开发人员的应用可以使用传递过来的参数正常运行，你可以使用`vela dry-run`命令来检查和试运行你的模板文件。

```shell
vela dry-run -f app-stateful.yaml
```

通过观察运行输出，你可以比较生成的对象是否与你预期的一致。你甚至可以直接提交这个 YAML 文件到你的 Kubernetes 集群中，用提交结果来做验证。

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

你也可以使用`vela dry-run -h`命令来查看更多可用的试运行参数。


## 使用`context`来避免重复

KubeVela 允许你通过[`context` 关键词](https://kubevela.io/docs/platform-engineers/components/custom-component#cue-context)来引用你的应用运行时的信息。

在我们上面的例子中，属性中的字段`name`和组件中的`name`有相同的意思，所以，我们可以使用`context`来避免重复。我们可以用`context.name`来引用运行时的组件名称，所以参数列表中的 name 参数就不在需要了。

只需要按照下面来修改一下定义文件（my-stateful.cue）：


	... # 跳过其他无修改的字段
	template: {
		output: {
			apiVersion: "apps/v1"
			kind:       "StatefulSet"
    -       metadata: name: parameter.name
	+		metadata: name: context.name

				... // 跳过其他无修改的字段

		}
	    parameter: {
    -       name: string
			image: string
		}
	}

然后按照下面的命令重新部署：

```
vela def apply my-stateful.cue
```

之后开发人员可以通过下面的方式立即运行应用：

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

任何系统都没有升级或重新启动，它们都会根据你的需要动态地运行。

## 按需添加操作特征

OAM 遵循“关注点分离”原则，开发人员完成应用组件部分，运维人员可以向这些应用添加特征来控制部署过程中剩余的配置部分。举个例子来说，运维人员可以控制副本个数，添加标签/注解，注入环境变量/边车，添加持久化存储卷等等。


从技术上讲，特征系统有两种工作方式：

- 修改/覆盖组件中的定义的配置值。
- 生成更多的配置。


自定义过程与组件相同，它们都使用 CUE，但路径和覆盖有一些不同的关键字，你可以参考[自定义特征](https://kubevela.io/docs/platform-engineers/traits/customize-trait)了解详情。

## 特征的 Operator 体验

KubeVela 安装完成之后，会安装一些内置的特征到集群中。可以通过`vela traits`命令来查看，这些被打`*`的特征是一些通用特征，它们可以操作通用的 Kubernetes 资源对象。


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

拿边车来举个例子，你可以查看边车的使用帮助：


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

直接使用边车注入一个容器，可以参考下面的声明：

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

部署和运行这个应用，你会看到一个 fluentd 的边车已经被创建并在 StatefulSet 中运行。

在任何的 KubeVela 系统里， 组件和特征是可以复用的，我们可以把组件特征组合到一起作为一个插件。在社区中有一个不断丰富的[插件目录](https://github.com/kubevela/catalog)。

## 总结

这篇博客介绍了如何通过 CUE 来提供完整的模块化功能。核心是可以根据用户需求动态增加配置能力，逐步暴露更多的功能和用法，从而降低用户的整体学习门槛，最终提高研发效率。

KubeVela 提供了开箱即用功能，包括组件、特征、策略和工作流，都被设计为可插入和可修改的。
