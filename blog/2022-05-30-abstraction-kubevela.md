---
title: Build flexible abstraction for any Kubernetes Resources with CUE and KubeVela
author: Jianbo Sun
author_title: KubeVela Team
author_url: https://github.com/kubevela/KubeVela
author_image_url: https://avatars.githubusercontent.com/u/2173670
tags: [ KubeVela, Abstraction]
description: ""
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

This blog will introduce how to use CUE and KubeVela to build you own abstraction API to reduce the complexity of Kubernetes resources. As a platform builder, you can dynamically customzie the abstraction, build a path from shallow to deep for your developers per needs, adapt to growing number of different scenarios, and meet the iterative demands of the company's long-term business development.

<!--truncate-->

## Convert Kubernetes API Objects Into Custom Components

Let's start the journey by using the [Kubernetes StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) as example, we will convert it to be a customized module and provide capabilities.

Save the YAML example of StatefulSet in the official document locally and name it as `my-stateful.yaml`, then execute command as below:

```
	 vela def init my-stateful -t component --desc "My StatefulSet component." --template-yaml ./my-stateful.yaml -o my-stateful.cue
```

View the generated "my-stateful.cue" file:

```
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

```

Modify the generated file as follows:

1. The example of the official StatefulSet website is a composite component composed of two objects `StatefulSet` and `Service`. According to KubeVela [Rules for customize component](https://kubevela.io/docs/platform-engineers/components/custom-component), in composite components, one of the resources such (StatefulSet in our example) need to be represented by the `template.output` field as a core workload, and other auxiliary objects are represented by `template.outputs`, so we make some adjustments and all the automatically generated output and outputs are switched.
2. Then we fill in the apiVersion and kind data of the core workload into the part marked as `<change me>`

After modification, you can use `vela def vet` to do format check and verification.

```
	$ vela def vet my-stateful.cue
	Validation succeed.
```

The file after two steps of changes is as follows:

```
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
```

Install ComponentDefinition into the Kubernetes cluster:

```
	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful created in namespace vela-system.
```

You can see that a `my-stateful` component  via `vela components` command:

```
	$ vela components
	NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION
	...
	my-stateful	vela-system	statefulsets.apps                    	My StatefulSet component.
	... 
```

When you put this customized component into `Application`, it looks like:

```
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
```


## Define Customized Parameters For Component

In previous section we have defined a ComponentDefinition that has no parameter. In this section we will show how to expose parameters.

In this example, we expose the following parameters to the user:

* Image name, allowing users to customize the image
* Instance name, allowing users to customize the instance name of the generated StatefulSet object and Service object

```
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
```

After modification, use `vela def apply` to install to the cluster:

```
	$ vela def apply my-stateful.cue
	ComponentDefinition my-stateful in namespace vela-system updated.
```

Then as a platform builder, you have finished your setup. Let's see what's the developer experience now.

## Developer Experience

The only thing your developer need to learn is the [Open Application Model](https://oam.dev/) which always follow a unified format.

### Discover the Component

The developers can discover and check the parameters of `my-stateful` component as follows:

```
$ vela def list
NAME                            TYPE                    NAMESPACE   DESCRIPTION
my-stateful                     ComponentDefinition     vela-system My StatefulSet component.
...snip...
```

```
	$ vela show my-stateful
	# Properties
	+----------+-------------+--------+----------+---------+
	|   NAME   | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
	+----------+-------------+--------+----------+---------+
	| name     |             | string | true     |         |
	| image    |             | string | true     |         |
	+----------+-------------+--------+----------+---------+
```

Updating the ComponentDefinition will not affect existing Applications. It will take effect only after updating the Applications next time.

### Use the Component in Application

The developers can easily specify the three new parameters in the application:

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

The only thing left is to deploy the yaml file ( assume the name `app-stateful.yaml`) by executing `vela up -f app-stateful.yaml`.

Then you can see that the name, image, and number of instances of the StatefulSet object have been updated.

## Dry-run for diagnose or integration

In order to ensure that the developer's application can run correctly with the parameters, you can also use the `vela dry-run` command to verify the trial run of your template.

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


## Use `context` to avoid duplication

KubeVela allows you to reference the runtime information of your application via [`context` keyword](https://kubevela.io/docs/platform-engineers/components/custom-component#cue-context).

In our example above, the field `name` in the properties and the field `name` of the Component have the same meaning, so we can use the `context` to avoid duplication. We cann use the `context.name` to reference the component name in the runtime, thus the name parameter in `parameter` is no longer needed.

Just modify the definition file (my-stateful.cue) as the following 

```
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
```

Then deploy the changes by the following:

```
vela def apply my-stateful.cue
```

After that, the developers can immediately run application as below:

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

There's no upgrade or restart for any system, they're all running into affect dynamically per your needs.

## Add Operational Traits On Demand

OAM follows the principle of "separation of concerns", after the developers finished the component part, the operators can add traits into the application to control the rest part configuration of the deployment. For example, the operators can  
control replicas, adding labels/annotations, injecting environment variables/sidecars, adding persistent volumes, and so on.

Technically, the trait system works in two ways:

- Patch/Override the configurations defined in component.
- Generate more configuration.

The customized process works the same with the component, they both use CUE but has some different keywords for path and override, you can refer to [customize trait](https://kubevela.io/docs/platform-engineers/traits/customize-trait) for details.

## Operator Experience with traits

There're already some built-in traits after KubeVela installed. The operator can use `vela traits` to view, the traits marked with `*` are general traits, which can operate on common Kubernetes resource objects.

```
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
```

Taking sidecar as an example, you can check the usage of sidecar:

```
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
```

Use the sidecar directly to inject a container, the application description is as follows:

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
	      traits:
	      - type: sidecar
	        properties:
	          name: my-sidecar
	          image: saravak/fluentd:elastic
```

Deploy and run the application, and you can see that a fluentd sidecar has been deployed and running in the StatefulSet.

Both components and traits are re-usable on any KubeVela systems, we can package components, traits along with the CRD controllers together as an addon. There're [a growing catalog of addons](https://github.com/kubevela/catalog) in the community. 

## Summarize

This blog introduces how to deliver complete modular capabilities through CUE. The core is that it can dynamically increase configuration capabilities according to user needs, and gradually expose more functions and usages, so as to reduce the overall learning threshold for users and ultimately improve R&D efficient.
The out-of-the-box capabilities provided by KubeVela, including components, traits, policy, and workflow, are also designed as plugable and modifiable capabilities.


