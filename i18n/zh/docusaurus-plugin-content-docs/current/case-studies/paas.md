---
title:  易用可扩展的 PaaS
---

以 Kubernetes 为核心的云原生技术大多是围绕基础设施向上为平台构建者提供服务的，其功能的多样性和灵活性决定了用户学习使用这些技术有很高的门槛。传统 PaaS 的做法是将复杂的 API 进行固定的封装，以达到降低使用复杂度的目的。但是云原生时代用户的需求不再一成不变，会频繁随着复杂的使用场景不断改变。

KubeVela 针对这种使用需求，为平台管理员提供了一个易用可扩展的 PaaS 引擎，可以随着用户需求变化动态扩展 PaaS 层的能力。使得你的 PaaS 平台可以适应各类用户和场景，满足公司业务长期发展的迭代诉求。

> 注意：此用户案例的学习对象为期望构建可扩展 PaaS 的平台管理员。开始之前请确保你已经了解了[OAM 模型][1]和[模块定义（X-Definition ）][2]的概念。

## 将 Kubernetes API 对象转化为自定义组件

KubeVela 使用 [CUE][3] 构建用户抽象，也就是将复杂的 Kubernetes API 遮挡，只暴露简单的参数，同时也围绕 CUE 提供了管理工具来[编辑和生成 KubeVela 的模块定义对象][4]。

下面我们以 Kubernetes 官方的 [StatefulSet 对象][5]为例，来具体看 KubeVela 是如何构建用户抽象的。我们将官方文档中 StatefulSet 的 YAML 例子保存在本地，并命名为 `my-stateful.yaml`

然后执行如下命令，生成一个名为 “my-stateful” 的 Component 模块定义，并输出到 “my-stateful.cue” 文件中：

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
				... // 省略一些非重要信息
		}
		outputs: web: {
			apiVersion: "apps/v1"
			kind:       "StatefulSet"
				... // 省略一些非重要信息
		}
		parameter: {}
	}

下面我们来对这个自动生成的自定义组件做一些修改：

1. 根据 KubeVela [自定义组件的规则][6]，StatefulSet 官网的例子是由 `StatefulSet`和 `Service` 两个对象构成的一个复合组件，复合组件中，核心工作负载由 `template.output`字段表示，其他辅助对象用 `template.outputs`表示，所以我们将内容做一些调整，将自动生成的 output 和 outputs 中的全部调换。
2. 然后我们将核心工作负载的 apiVersion 和 kind 数据填写到标注为 `<change me>`的部分

修改后可以用 `vela def vet`做一下格式检查和校验。

	$ vela def vet my-stateful.cue
	Validation succeed.

经过两步改动后的文件如下：

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

将该组件定义安装到 Kubernetes 集群中：

	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful created in namespace vela-system.

此时平台的最终用户已经可以通过 `vela components`命令看到有一个 `my-stateful`组件可以使用了。

	$ vela components
	NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION
	...
	my-stateful	vela-system	statefulsets.apps                    	My StatefulSet component.
	... 

通过 KubeVela 的应用部署计划发布到集群中，就可以拉起我们刚刚定义的 StatefulSet 和 Service 对象。

	cat <<EOF | kubectl apply -f -
	apiVersion: core.oam.dev/v1beta1
	kind: Application
	metadata:
	  name: website
	spec:
	  components:
	    - name: my-component
	      type: my-stateful
	EOF



## 为组件定义定制化参数

为了满足用户变化的需求，我们需要在最后的 `parameter` 里暴露一些参数，在 [CUE 基础入门文档][7]中你可以了解到参数相关的语法。在本例中，我们为用户暴露一下参数：

* 镜像名称，允许用户自定义镜像
* 实例名，允许用户自定义生成的 StatefulSet 对象和 Service 对象的实例名称
* 副本数，生成对象的副本数


	... # 省略其他没有修改的字段 
	template: {
		output: {
			apiVersion: "apps/v1"
			kind:       "StatefulSet"
			metadata: name: parameter.name
			spec: {
				selector: matchLabels: app: "nginx"
				replicas:    parameter.replicas
				serviceName: "nginx"
				template: {
					metadata: labels: app: "nginx"
					spec: {
						containers: [{
							image: parameter.image
			
						    ... // 省略其他没有修改的字段	
						}]
					}
				}
				    ... // 省略其他没有修改的字段
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
				... // 省略其他没有修改的字段		
	        }
		}
		parameter: {
			image: string
			name: string
			replicas: int
		}
	}

修改后同样使用 `vela def apply`安装到集群中：

	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful in namespace vela-system updated.

这个修改过程是实时生效的，用户立即可以看到系统中的 my-stateful 组件增加了新的参数。

	$ vela show my-stateful
	# Properties
	+----------+-------------+--------+----------+---------+
	|   NAME   | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
	+----------+-------------+--------+----------+---------+
	| name     |             | string | true     |         |
	| replicas |             | int    | true     |         |
	| image    |             | string | true     |         |
	+----------+-------------+--------+----------+---------+

组件定义的修改并不会影响已经在运行的应用，当下次应用修改并重新部署时，新的组件定义就会生效。

最终用户就可以在应用中指定新增的这三个参数：

	cat <<EOF | kubectl apply -f -
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
	        replicas: 1
	        name: my-component
	EOF

为了保证用户的应用使用参数能够正确运行，作为管理员，你也可以用 `vela dry-run` 等命令对你的模板进行[调试验证][8]。

## 使用上下文信息减少参数

在我们上面的例子中，properties 中的 name 和 Component 的 name 字段是相同的，此时我们可以在模板中使用携带了上下文信息的 `context`关键字，其中 `context.name` 就是运行时组件名称，此时 `parameter` 中的 name 参数就不再需要的。

	... # 省略其他没有修改的字段 
	template: {
		output: {
			apiVersion: "apps/v1"
			kind:       "StatefulSet"
			metadata: name: context.name
				... // 省略其他没有修改的字段
		}
	    parameter: {
			image: string
			replicas: int
		}
	}

KubeVela 内置了应用[所需的上下文信息][9]，你可以根据需要配置.

## 使用运维能力按需添加配置

对于用户的新需求，除了修改组件定义增加参数以外，你还可以使用运维能力，按需添加配置。一方面，KubeVela 已经内置了大量的通用运维能力，可以满足诸如：添加 label、annotation，注入环境变量、sidecar，添加 volume 等等的需求。另一方面，你可以像自定义组件一样，自定义[补丁型运维特征][10]，来满足更多的配置灵活组装的需求。

你可以使用 `vela traits` 查看，带 `*` 标记的 trait 均为通用 trait，能够对常见的 Kubernetes 资源对象做操作。

	$ vela traits
	NAME                    	NAMESPACE  	APPLIES-TO      	CONFLICTS-WITH	POD-DISRUPTIVE	DESCRIPTION
	annotations             	vela-system	*               	              	true          	Add annotations on K8s pod for your workload which follows
	                        	           	                	              	              	the pod spec in path 'spec.template'.
	configmap               	vela-system	*               	              	true          	Create/Attach configmaps on K8s pod for your workload which
	                        	           	                	              	              	follows the pod spec in path 'spec.template'.
	env                     	vela-system	*               	              	false         	add env on K8s pod for your workload which follows the pod
	                        	           	                	              	              	spec in path 'spec.template.'
	hostalias               	vela-system	*               	              	false         	Add host aliases on K8s pod for your workload which follows
	                        	           	                	              	              	the pod spec in path 'spec.template'.
	init-container          	vela-system	deployments.apps	              	true          	add an init container and use shared volume with pod
	labels                  	vela-system	*               	              	true          	Add labels on K8s pod for your workload which follows the
	                        	           	                	              	              	pod spec in path 'spec.template'.
	lifecycle               	vela-system	*               	              	true          	Add lifecycle hooks for the first container of K8s pod for
	                        	           	                	              	              	your workload which follows the pod spec in path
	                        	           	                	              	              	'spec.template'.
	node-affinity           	vela-system	*               	              	true          	affinity specify node affinity and toleration on K8s pod for
	                        	           	                	              	              	your workload which follows the pod spec in path
	                        	           	                	              	              	'spec.template'.
	scaler                  	vela-system	*               	              	false         	Manually scale K8s pod for your workload which follows the
	                        	           	                	              	              	pod spec in path 'spec.template'.
	sidecar                 	vela-system	*               	              	true          	Inject a sidecar container to K8s pod for your workload
	                        	           	                	              	              	which follows the pod spec in path 'spec.template'.
	

以 sidecar 为例，你可以查看 sidecar 的用法：

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

直接使用 sidecar 注入一个容器，应用的描述如下：

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
	        replicas: 1
	        name: my-component
	      traits:
	      - type: sidecar
	        properties:
	          name: my-sidecar
	          image: saravak/fluentd:elastic

部署运行该应用，就可以看到 StatefulSet 中已经部署运行了一个 fluentd 的 sidecar。

你也可以使用 `vela def` 获取 sidecar 的 CUE 源文件进行修改，增加参数等。

	vela def get sidecar

运维能力的自定义与组件自定义类似，不再赘述，你可以阅读[运维能力自定义文档][11]了解更详细的功能。

## 总结

在本案例中，我们介绍了如何通过 KubeVela 强大而全面的抽象能力，来构建一个易用可扩展的 PaaS。 其核心是基于 CUE 随着用户的需求，不断动态增加配置能力，逐步暴露更多的功能和用法，以便降低用户整体的学习门槛，最终提升研发效率。

[1]:	../platform-engineers/oam/oam-model "OAM"
[2]:	../platform-engineers/oam/x-definition
[3]:	../platform-engineers/cue/basic
[4]:	../platform-engineers/cue/definition-edit
[5]:	https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/
[6]:	../platform-engineers/components/custom-component#%E4%BA%A4%E4%BB%98%E4%B8%80%E4%B8%AA%E5%A4%8D%E5%90%88%E7%9A%84%E8%87%AA%E5%AE%9A%E4%B9%89%E7%BB%84%E4%BB%B6
[7]:	../platform-engineers/cue/basic#%E5%AE%9A%E4%B9%89%E4%B8%80%E4%B8%AA-cue-%E6%A8%A1%E6%9D%BF
[8]:	../platform-engineers/debug/dry-run
[9]:	../platform-engineers/oam/x-definition#%E6%A8%A1%E5%9D%97%E5%AE%9A%E4%B9%89%E8%BF%90%E8%A1%8C%E6%97%B6%E4%B8%8A%E4%B8%8B%E6%96%87
[10]:	../platform-engineers/traits/patch-trait
[11]:	../platform-engineers/traits/customize-trait