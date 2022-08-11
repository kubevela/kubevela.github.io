---
title:  Trait Definition
---

In this section we will introduce how to define a custom trait with CUE. Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition) and [how to manage definition](../cue/definition-edit).

## Generate Resources by Trait

A trait can be something similar to component that you can define operational Kubernetes API resources such as ingress, service as trait.

Let's use `vela def init` to create a basic trait scaffold:

```
vela def init my-route -t trait --desc "My ingress route trait." > myroute.cue
```

> Note: there's a bug in vela CLI(`<=1.4.2`), the `vela def init` command will generate `definitionRef: ""` in `attributes` which is wrong, please remove that line.

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

Unlike component definition, KubeVela requires objects in traits **MUST** be defined in `outputs` section (not `output`) in CUE template with format as below:

```cue
outputs: <unique-name>: 
  <full template data>
```

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
vela def apply -f myroute.cue
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

> Note that in this case the type of `parameter` field used in the for-loop must be a map. 

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

> Please ensure the target HTTP server returns a **JSON data**.  `output`.

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

## Get context data of Component parameters

A trait definition can read the generated resources (rendered from `output` and `outputs`) of given component definition.

>KubeVela will ensure the component definitions are always evaluated before its traits.

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

## What's Next

* Learn how to [define policy](../policy/custom-policy) in CUE.
* Learn how to [define health check and custom status](../traits/status) of Trait.
* Learn how to [define workflow step](../workflow/workflow) in CUE.