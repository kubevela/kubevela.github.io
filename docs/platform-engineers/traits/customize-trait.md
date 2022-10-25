---
title:  Trait Definition
---

In this section we will introduce how to define a custom trait with CUE. Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition) and [how to manage definition](../cue/definition-edit).

## Generate a Trait scaffold

A trait can be something similar to component, while they're attached operational resources.

- Kubernetes API resources like ingress, service, rollout.
- The composition of these operational resources.
- A patch of data, for example, patch sidecar to workload.

Let's use `vela def init` to create a basic trait scaffold:

```
vela def init my-route -t trait --desc "My ingress route trait." > myroute.cue
```

The content of the scaffold expected to be:

```cue
// $ cat myroute.cue
"my-route": {
	annotations: {}
	attributes: {
		appliesToWorkloads: []
		conflictsWith: []
		podDisruptive:   false
		workloadRefPath: ""
	}
	description: "My ingress route trait."
	labels: {}
	type: "trait"
}

template: {
	patch: {}
	parameter: {}
}
```

:::caution
There's a bug in vela CLI(`<=1.4.2`), the `vela def init` command will generate `definitionRef: ""` in `attributes` which is wrong, please remove that line.
:::

## Define a trait to compose resources

Unlike component definition, KubeVela requires objects in traits **MUST** be defined in `outputs` section (not `output`) in CUE template with format as below:

```cue
outputs: {
  <unique-name>: {
    <template of trait resource structural data>
  }
}
```

:::tip
Actually the CUE template of trait here will be evaluated with component CUE template in the same context, so the name can't be conflict. That also explain why the `output` can't be defined in trait.
:::

Below is an example that we combine `ingress` and `service` of Kubernetes into our `my-route` trait.

```cue
"my-route": {
	annotations: {}
	attributes: {
		appliesToWorkloads: []
		conflictsWith: []
		podDisruptive:   false
		workloadRefPath: ""
	}
	description: "My ingress route trait."
	labels: {}
	type: "trait"
}

template: {
	parameter: {
		domain: string
		http: [string]: int
	}

	// trait template can have multiple outputs in one trait
	outputs: service: {
		apiVersion: "v1"
		kind:       "Service"
		spec: {
			selector:
				app: context.name
			ports: [
				for k, v in parameter.http {
					port:       v
					targetPort: v
				},
			]
		}
	}

	outputs: ingress: {
		apiVersion: "networking.k8s.io/v1beta1"
		kind:       "Ingress"
		metadata:
			name: context.name
		spec: {
			rules: [{
				host: parameter.domain
				http: {
					paths: [
						for k, v in parameter.http {
							path: k
							backend: {
								serviceName: context.name
								servicePort: v
							}
						},
					]
				}
			}]
		}
	}
}
```

Apply to our control plane to make this trait work:

```
vela def apply myroute.cue
```

Then our end users can discover it immediately and attach this trait to any component instance in `Application`.

After using `vela up` by the following command:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        cmd:
          - node
          - server.js
        image: oamdev/testapp:v1
        port: 8080
      traits:
        - type: my-route
          properties:
            domain: test.my.domain
            http:
              "/api": 8080
EOF
```

It will generate Kubernetes resources by KubeVela.

With the help of CUE, we can achieve many advanced features in trait.

### Render Multiple Resources With a Loop

You can define the for-loop inside the `outputs`.

:::note
In this case the type of `parameter` field used in the for-loop must be a map. 
:::

Below is an example that will render multiple Kubernetes Services in one trait:

```cue
"expose": {
	type: "trait"
}

template: {
	parameter: {
		http: [string]: int
	}
	outputs: {
		for k, v in parameter.http {
			"\(k)": {
				apiVersion: "v1"
				kind:       "Service"
				spec: {
					selector:
						app: context.name
					ports: [{
						port:       v
						targetPort: v
					}]
				}
			}
		}
	}
}
```

The usage of this trait could be:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        ...
      traits:
        - type: expose
          properties:
            http:
              myservice1: 8080
              myservice2: 8081
```

### Execute HTTP Request in Trait Definition

The trait definition can send a HTTP request and capture the response to help you rendering the resource with keyword `processing`.

You can define HTTP request `method`, `url`, `body`, `header` and `trailer` in the `processing.http` section, and the returned data will be stored in `processing.output`.

:::tip
Please ensure the target HTTP server returns a **JSON data** as `output`.
:::

Then you can reference the returned data from `processing.output` in `patch` or `output/outputs`.

Below is an example:

```cue
"auth-service": {
	type: "trait"
}

template: {
	parameter: {
		serviceURL: string
	}

	processing: {
		output: {
			token?: string
		}
		// The target server will return a JSON data with `token` as key.
		http: {
			method: *"GET" | string
			url:    parameter.serviceURL
			request: {
				body?: bytes
				header: {}
				trailer: {}
			}
		}
	}

	patch: {
		data: token: processing.output.token
	}
}
```

In above example, this trait definition will send request to get the `token` data, and then patch the data to given component instance.

## CUE `Context` for runtime information

A trait definition can read the generated resources (rendered from `output` and `outputs`) of given component definition.

:::caution
Generally, KubeVela will ensure the component definitions are evaluated before its traits. But there're a [stage mechanism](https://github.com/kubevela/kubevela/pull/4570) that allow trait be deployed before component.
:::

Specifically, the `context.output` contains the rendered workload API resource (whose GVK is indicated by `spec.workload`in component definition), and use `context.outputs.<xx>` to contain all the other rendered API resources.

Let's use an example to see this feature:

1. Let's define a component definition `myworker` like below:

```cue
"myworker": {
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	type: "component"
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		spec: {
			selector: matchLabels: {
				"app.oam.dev/component": context.name
			}

			template: {
				metadata: labels: {
					"app.oam.dev/component": context.name
				}
				spec: {
					containers: [{
						name:  context.name
						image: parameter.image
						ports: [{containerPort: parameter.port}]
						envFrom: [{
							configMapRef: name: context.name + "game-config"
						}]
						if parameter["cmd"] != _|_ {
							command: parameter.cmd
						}
					}]
				}
			}
		}
	}

	outputs: gameconfig: {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: {
			name: context.name + "game-config"
		}
		data: {
			enemies: parameter.enemies
			lives:   parameter.lives
		}
	}

	parameter: {
		// +usage=Which image would you like to use for your service
		// +short=i
		image: string
		// +usage=Commands to run in the container
		cmd?: [...string]
		lives:   string
		enemies: string
		port:    int
	}
}
```

2. Define a new `myingress` trait that read the port.

```cue
"myingress": {
	type: "trait"
  attributes: {
		appliesToWorkloads: ["myworker"]
  }
}

template: {
	parameter: {
		domain:     string
		path:       string
		exposePort: int
	}
	// trait template can have multiple outputs in one trait
	outputs: service: {
		apiVersion: "v1"
		kind:       "Service"
		spec: {
			selector:
				app: context.name
			ports: [{
				port:       parameter.exposePort
				targetPort: context.output.spec.template.spec.containers[0].ports[0].containerPort
			}]
		}
	}
	outputs: ingress: {
		apiVersion: "networking.k8s.io/v1beta1"
		kind:       "Ingress"
		metadata:
				name: context.name
		labels: config: context.outputs.gameconfig.data.enemies
		spec: {
			rules: [{
				host: parameter.domain
				http: {
					paths: [{
						path: parameter.path
						backend: {
							serviceName: context.name
							servicePort: parameter.exposePort
						}
					}]
				}
			}]
		}
	}
}
```

In detail, The trait `myingress` can only apply to the specific ComponentDefinition `myworker`:

1. the rendered Kubernetes Deployment resource will be stored in the `context.output`,
2. all other rendered resources will be stored in `context.outputs.<xx>`, with `<xx>` is the unique name in every `template.outputs`.

Thus, in TraitDefinition `myingress`, it can read the rendered API resources (e.g. `context.outputs.gameconfig.data.enemies`) from the `context` and get the `targetPort` and `labels.config`.

## Patch Trait

Besides generate objects from trait, one more important thing we can do in trait is to patch or override the configuration of
 Component. But why do we need to patch or override?

There're several reasons:

1. The component could be defined by another person, for separation of concern, the operator can attach an operational trait to change that data.
2. The component could be defined by third party which is not controlled by the one who use it.

So KubeVela allow patch or override in this case, please refer to [patch trait](./patch-trait) for more details. As trait and workflow step can both patch, so we write them together.

## Define Health for Definition

You can also define health check policy and status message when a trait deployed and tell the real status to end users.

:::caution
Reference `parameter` defined in `template` is not supported now in health check and custom status, they work in different stage with the resource template. While we're going to support this feature in https://github.com/kubevela/kubevela/issues/4863 .
:::

### Health Check

The spec of health check is `<trait-type-name>.attributes.status.healthPolicy`, it's similar to component definition.

If not defined, the health result will always be `true`, which means it will be marked as healthy immediately after resources applied to Kubernetes. You can define a CUE expression in it to notify if the trait is healthy or not.

The keyword in CUE is `isHealth`, the result of CUE expression must be `bool` type.

KubeVela runtime will evaluate the CUE expression periodically until it becomes healthy. Every time the controller will get all the Kubernetes resources and fill them into the `context` variables.

So the context will contain following information:

```cue
context:{
  name: <component name>
  appName: <app name>
  outputs: {
    <resource1>: <K8s trait resource1>
    <resource2>: <K8s trait resource2>
  }
}
```

The example of health check likes below:

```cue
my-ingress: {
	type: "trait"
	...
	attributes: {
		status: {
			healthPolicy: #"""
              isHealth: len(context.outputs.service.spec.clusterIP) > 0
		      """#
    	}
  	}
}
```

The health check result will be recorded into the corresponding trait in `.status.services` of `Application` resource.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
status:
  ...
  services:
  - healthy: true
    ...
    name: myweb
    traits:
    - healthy: true
      type: my-ingress
  status: running
```

> Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/trait/gateway.cue) for more complete example.


### Custom Status

The spec of custom status is `<trait-type-name>.attributes.status.customStatus`, it shares the same mechanism with the health check.

The keyword in CUE is `message`, the result of CUE expression must be `string` type.

Application CRD controller will evaluate the CUE expression after the health check succeed.

The example of custom status likes below:

```cue
my-service: {
	type: "trait"
	...
	attributes: {
		status: {
			customStatus: #"""
				if context.outputs.ingress.status.loadBalancer.ingress != _|_ {
					let igs = context.outputs.ingress.status.loadBalancer.ingress
				  if igs[0].ip != _|_ {
				  	if igs[0].host != _|_ {
					    message: "Visiting URL: " + context.outputs.ingress.spec.rules[0].host + ", IP: " + igs[0].ip
				  	}
				  	if igs[0].host == _|_ {
					    message: "Host not specified, visit the cluster or load balancer in front of the cluster with IP: " + igs[0].ip
				  	}
				  }
				}
				"""#
    	}
  	}
}
```

The message will be recorded into the corresponding trait in `.status.services` of `Application` resource.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
status:
  ...
  services:
  - healthy: true
    ...
    name: myweb
    traits:
    - healthy: true
      message: 'Visiting URL: www.example.com, IP: 47.111.233.220'
      type: my-ingress
  status: running
```

> Please refer to [this doc](https://github.com/kubevela/kubevela/blob/master/vela-templates/definitions/internal/trait/gateway.cue) for more complete example.


## Full available `context` in Trait


|         Context Variable         |                                                                         Description                                                                         |    Type    |
| :------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------: |
|        `context.appName`         |                                           The app name corresponding to the current instance of the application.                                            |   string   |
|       `context.namespace`        | The target namespace of the current resource is going to be deployed, it can be different with the namespace of application if overridden by some policies. |   string   |
|        `context.cluster`         |  The target cluster of the current resource is going to be deployed, it can be different with the namespace of application if overridden by some policies.  |   string   |
|      `context.appRevision`       |                                       The app version name corresponding to the current instance of the application.                                        |   string   |
|     `context.appRevisionNum`     |                                      The app version number corresponding to the current instance of the application.                                       |    int     |
|          `context.name`          |                                        The component name corresponding to the current instance of the application.                                         |   string   |
|        `context.revision`        |                                                     The version name of the current component instance.                                                     |   string   |
|         `context.output`         |                                               The object structure after instantiation of current component.                                                | Object Map |
| `context.outputs.<resourceName>` |                                           Structure after instantiation of current component auxiliary resources.                                           | Object Map |
|      `context.workflowName`      |                                                         The workflow name specified in annotation.                                                          |   string   |
|     `context.publishVersion`     |                                                The version of application instance specified in annotation.                                                 |   string   |
|       `context.components`       |                                                The object structure of components spec  in this application.                                                | Object Map |
|       `context.appLabels`        |                                                       The labels of the current application instance.                                                       | Object Map |
|     `context.appAnnotations`     |                                                    The annotations of the current application instance.                                                     | Object Map |


## Trait definition in Kubernetes

KubeVela is fully programmable via CUE, while it leverage Kubernetes as control plane and align with the API in yaml.
As a result, the CUE definition will be converted as Kubernetes API when applied into cluster.

The trait definition will be in the following API format:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: <TraitDefinition name>
  annotations:
    definition.oam.dev/description: <function description>
spec:
  definition:
    apiVersion: <corresponding Kubernetes resource group>
    kind: <corresponding Kubernetes resource type>
  workloadRefPath: <The path to the reference field of the Workload object in the Trait>
  podDisruptive: <whether the parameter update of Trait cause the underlying resource (pod) to restart>
  manageWorkload: <Whether the workload is managed by this Trait>
  skipRevisionAffect: <Whether this Trait is not included in the calculation of version changes>
  appliesToWorkloads:
  - <Workload that TraitDefinition can adapt to>
  conflictsWith:
  - <other Traits that conflict with this><>
  revisionEnabled: <whether Trait is aware of changes in component version>
  controlPlaneOnly: <Whether resources generated by trait are dispatched to the hubcluster (local)>
  schematic:  # Abstract
    cue: # There are many abstracts
      template: <CUE format template>
```

You can check the detail of this format [here](../oam/x-definition).

## More examples to learn

You can check the following resources for more examples:

- Builtin trait definitions in the [KubeVela github repo](https://github.com/kubevela/kubevela/tree/master/vela-templates/definitions/internal/trait).
- Definitions defined in addons in the [catalog repo](https://github.com/kubevela/catalog/tree/master/addons).