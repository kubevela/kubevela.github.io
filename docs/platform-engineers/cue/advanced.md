---
title: CUE Advanced
---

This section will introduce how to use CUE to deliver complete modular functions, so that your platform can dynamically expand functions as user needs change, adapt to various users and scenarios, and meet the iterative demands of the company's long-term business development.

## Convert Kubernetes API Objects Into Custom Components

Let's take the [Kubernetes StatefulSet][5] as an example to show how to use KubeVela to build custom modules and provide capabilities.

Save the YAML example of StatefulSet in the official document locally and name it as `my-stateful.yaml`, then execute commande as below:

	 vela def init my-stateful -t component --desc "My StatefulSet component." --template-yaml ./my-stateful.yaml -o my-stateful.cue

View the generated "my-stateful.cue" file:

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

Let's do some fine-tuning of this automatically generated custom component:

1. The example of the official StatefulSet website is a composite component composed of two objects `StatefulSet` and `Service`. According to KubeVela [Rules for customize components] [6], in composite components, core workloads such as StatefulSet need to be represented by the `template.output` field, and other auxiliary objects are represented by `template.outputs`, so we make some adjustments and all the automatically generated output and outputs are switched.
2. Then we fill in the apiVersion and kind data of the core workload into the part marked as `<change me>`

After modification, you can use `vela def vet` to do format check and verification.

	$ vela def vet my-stateful.cue
	Validation succeed.

The file after two steps of changes is as follows:

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

Install ComponentDefinition into the Kubernetes cluster:
	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful created in namespace vela-system.

At this point, the end user of the platform can already see that a `my-stateful` component is available through the `vela components` command.

	$ vela components
	NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION
	...
	my-stateful	vela-system	statefulsets.apps                    	My StatefulSet component.
	... 

By publishing the `Application` of KubeVela to the cluster, we can pull up the StatefulSet and Service objects we just defined.

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



## Define Customized Parameters For Component

In order to meet the changing needs of users, we need to expose some parameters in the last `parameter`. You can learn about the syntax of parameters in [CUE Basic][7].

In this example, we expose the following parameters to the user:

* Image name, allowing users to customize the image
* Instance name, allowing users to customize the instance name of the generated StatefulSet object and Service object
* The number of copies, the number of copies of the generated object


		... # Omit other unmodified fields
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
				replicas: int
			}
		}

After modification, use `vela def apply` to install to the cluster:

	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful in namespace vela-system updated.

This modification process takes effect in real time, and the user can immediately see that the my-stateful component in the system has added new parameters.

	$ vela show my-stateful
	# Properties
	+----------+-------------+--------+----------+---------+
	|   NAME   | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
	+----------+-------------+--------+----------+---------+
	| name     |             | string | true     |         |
	| replicas |             | int    | true     |         |
	| image    |             | string | true     |         |
	+----------+-------------+--------+----------+---------+

Updating the ComponentDefinition will not affect existing Applications. It will take effect only after updating the Applications next time.

You can specify the three new parameters in the application:

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
	        replicas: 1
	        name: my-component
```

Save the file locally and name it `app-stateful.yaml`, execute `kubectl apply -f app-stateful.yaml` to update the application, you can see that the name, image, and number of instances of the StatefulSet object have been updated.

## Dry-run

In order to ensure that the user's application can run correctly with the parameters, you can also use the `vela dry-run` command to verify the trial run of your template.

```shell
vela dry-run -f app-stateful.yaml
```

By viewing the output, you can compare whether the generated object is consistent with the object you actually expect. You can even execute this YAML directly into the Kubernetes cluster and use the results of the operation for verification.

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


You can also use `vela dry-run -h` to view more available function parameters.


## Use `context` to get runtime information

In our Application example above, the name field in the properties and the name field of the Component are the same. So we can use the `context` keyword that carries context information in the template, where `context.name` is the runtime component Name, thus the name parameter in `parameter` is no longer needed.

	... # Omit other unmodified fields
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

KubeVela has built-in application [required context][9], you can configure it according to your needs.

## Add Traits On Demand

For new user needs, in addition to modifying ComponentDefinitions and adding parameters, you can also use the TraitDefinition to add configurations as needed. On the one hand, KubeVela has built-in a large number of general operation and maintenance capabilities, which can meet the needs such as: adding labels, annotations, injecting environment variables, sidecars, adding volumes, and so on. On the other hand, like custom component does, you can [Customize Trait ][10] to meet the needs of more configuration and flexible assembly.

You can use `vela traits` to view, the traits marked with `*` are general traits, which can operate on common Kubernetes resource objects.

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


Taking sidecar as an example, you can check the usage of sidecar:

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

Use the sidecar directly to inject a container, the application description is as follows:

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

Deploy and run the application, and you can see that a fluentd sidecar has been deployed and running in the StatefulSet.

You can also use `vela def` to get the CUE source file of the sidecar to modify, add parameters, etc.

	vela def get sidecar

The customization of operation and maintenance capabilities is similar to component customization, so we won’t go into details here. You can read [Customize Trait][11] for more detailed functions.

## Summarize

This section introduces how to deliver complete modular capabilities through CUE. The core is that it can dynamically increase configuration capabilities according to user needs, and gradually expose more functions and usages, so as to reduce the overall learning threshold for users and ultimately improve R&D efficient.
The out-of-the-box capabilities provided by KubeVela, including components, traits, policy, and workflow, are also designed as pluggable and modifiable capabilities.

## Next

* Get to know about [customize component](../components/custom-component)
* Get to know about [customize trait](../traits/customize-trait)
* Get to know about [customize policy](../policy/custom-policy)
* Get to know about [customize workflow](../workflow/custom-workflow)

[1]:	../oam/oam-model
[2]:	../oam/x-definition
[3]:	../cue/basic
[4]:	../cue/definition-edit
[5]:	https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/
[6]:	../components/custom-component#%E4%BA%A4%E4%BB%98%E4%B8%80%E4%B8%AA%E5%A4%8D%E5%90%88%E7%9A%84%E8%87%AA%E5%AE%9A%E4%B9%89%E7%BB%84%E4%BB%B6
[7]:	../cue/basic#%E5%AE%9A%E4%B9%89%E4%B8%80%E4%B8%AA-cue-%E6%A8%A1%E6%9D%BF
[9]:	../oam/x-definition#%E6%A8%A1%E5%9D%97%E5%AE%9A%E4%B9%89%E8%BF%90%E8%A1%8C%E6%97%B6%E4%B8%8A%E4%B8%8B%E6%96%87
[10]:	../traits/patch-trait
[11]:	../traits/customize-trait


