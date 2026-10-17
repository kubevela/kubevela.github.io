---
title:  Trait Definition
---

In this section we will introduce how to define a custom trait with CUE. Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition.md) and [how to manage definition](../cue/definition-edit.md).

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

So KubeVela allow patch or override in this case, please refer to [patch trait](./patch-trait.md) for more details. As trait and workflow step can both patch, so we write them together.

## Define Health for Trait
> **MOVED**: Please refer to [Definition Health & Status](../status/definition_health_status.md).

## Full available `context` in Trait


|         Context Variable         |                                                                         Description                                                                         |    Type    |
|:--------------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------:|:----------:|
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

### Cluster Version

|          Context Variable           |                         Description                         |  Type  |
|:-----------------------------------:|:-----------------------------------------------------------:|:------:|
|   `context.clusterVersion.major`    |    The major version of the runtime Kubernetes cluster.     | string |
| `context.clusterVersion.gitVersion` |      The gitVersion of the runtime Kubernetes cluster.      | string |
|  `context.clusterVersion.platform`  | The platform information of the runtime Kubernetes cluster. | string |
|   `context.clusterVersion.minor`    |    The minor version of the runtime Kubernetes cluster.     |  int   |

The cluster version context info can be used for graceful upgrade of definition. For example, you can define different API according to the cluster version.

```
 outputs: ingress: {
	if context.clusterVersion.minor < 19 {
		apiVersion: "networking.k8s.io/v1beta1"
	}
	if context.clusterVersion.minor >= 19 {
		apiVersion: "networking.k8s.io/v1"
	}
	kind: "Ingress"
}
```

Or use string contain pattern for this usage:

```
import "strings"

if strings.Contains(context.clusterVersion.gitVersion, "k3s") {
     provider: "k3s"
}
if strings.Contains(context.clusterVersion.gitVersion, "aliyun") {
     provider: "aliyun"
}
```


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

You can check the detail of this format [here](../oam/x-definition.md).

## PostDispatch Traits

`PostDispatch` is a trait execution stage that allows a trait to run **after its parent component workload is healthy**. This is useful when a trait needs to read live runtime data from the component — such as replica counts, assigned IPs, or generation metadata — that only becomes available once the workload is up and running.

### How It Works

In a normal trait dispatch flow, traits are rendered and applied alongside their component. PostDispatch traits are different: the controller holds them back until the component's health check passes, then injects the live `context.output` (the component's current Kubernetes resource state) into the trait's CUE rendering context before applying it.

This means your PostDispatch trait template has access to fields like `context.output.status.replicas`, `context.output.status.readyReplicas`, `context.output.metadata.generation`, etc. — values that are only meaningful after the workload exists in the cluster.

**Execution order:**

```
Component workload applied → health check passes → PostDispatch trait rendered with live output → PostDispatch trait applied
```

### Defining a PostDispatch Trait

Set `spec.stage: PostDispatch` in your `TraitDefinition`. The trait can then reference `context.output` in its CUE template to access the live state of the component workload.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: status-cm-trait
spec:
  stage: PostDispatch
  schematic:
    cue:
      template: |
        outputs: statusConfigMap: {
          apiVersion: "v1"
          kind: "ConfigMap"
          metadata: {
            name: context.name + "-status"
            namespace: context.namespace
            labels: {
              "replica-count": "\(context.output.status.replicas)"
            }
          }
          data: {
            replicas:      "\(context.output.status.replicas)"
            componentName: context.name
          }
        }
```

Notice that `context.output.status.replicas` is used directly — this field is only available at runtime after the workload is deployed, which is why this trait must be `PostDispatch`.

### Health Policy in PostDispatch Traits

PostDispatch traits support `status.healthPolicy`, and the health check runs in the same way as for components. You can reference both the trait's own outputs (`context.outputs.<name>`) and the parent component's live output (`context.output`) in the health policy.

The example below uses a ConfigMap created by the trait, checks its `replicas` data field, and marks the trait unhealthy when replicas equal `"2"` (a custom signal that the workload is in a transitional state):

```yaml
  status:
    healthPolicy: |-
      cm: context.outputs.statusConfigMap
      isHealth: (cm != _|_ && cm.data != _|_ && cm.data.replicas != _|_ && cm.data.replicas != "2")
```

### Full Example

The following example defines two `TraitDefinition`s and a `ComponentDefinition`, then wires them together in an `Application`.

**`test-deployment-trait`** is a PostDispatch trait that creates a secondary Deployment seeded from trait parameters. Its health policy checks that the Deployment's replicas are all ready.

**`test-cm-trait`** is a PostDispatch trait that creates a ConfigMap reflecting the live replica count of the parent component. Its health policy validates the ConfigMap's data.

**`test-worker`** is a ComponentDefinition that creates a Deployment with configurable replicas.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: test-deployment-trait
spec:
  stage: PostDispatch
  schematic:
    cue:
      template: |
        outputs: statusPod: {
          apiVersion: "apps/v1"
          kind: "Deployment"
          metadata: {
            name: parameter.name
          }
          spec: {
            replicas: 1
            selector: matchLabels: {
              app: parameter.name
            }
            template: {
              metadata: labels: {
                app: parameter.name
              }
              spec: containers: [{
                name: parameter.name
                image: parameter.image
              }]
            }
          }
        }

        parameter: {
          name:  string
          image: string
        }
  status:
    healthPolicy: |-
      pod: context.outputs.statusPod
      ready: {
        updatedReplicas:    *0 | int
        readyReplicas:      *0 | int
        replicas:           *0 | int
        observedGeneration: *0 | int
      } & {
        if pod.status.updatedReplicas != _|_ {
            updatedReplicas: pod.status.updatedReplicas
        }
        if pod.status.readyReplicas != _|_ {
            readyReplicas: pod.status.readyReplicas
        }
        if pod.status.replicas != _|_ {
            replicas: pod.status.replicas
        }
        if pod.status.observedGeneration != _|_ {
            observedGeneration: pod.status.observedGeneration
        }
      }
      _isHealth: (pod.spec.replicas == ready.readyReplicas) && (pod.spec.replicas == ready.updatedReplicas) && (pod.spec.replicas == ready.replicas) && (ready.observedGeneration == pod.metadata.generation || ready.observedGeneration > pod.metadata.generation)
      isHealth: _isHealth
      if pod.metadata.annotations != _|_ {
        if pod.metadata.annotations["app.oam.dev/disable-health-check"] != _|_ {
            isHealth: true
        }
      }
---
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: test-cm-trait
spec:
  stage: PostDispatch
  schematic:
    cue:
      template: |
        outputs: statusConfigMap: {
          apiVersion: "v1"
          kind: "ConfigMap"
          metadata: {
            name: context.name + "-status"
            namespace: context.namespace
            labels: {
              "labeltest": "\(context.output.status.replicas)"
              "hello":     "world"
            }
          }
          data: {
            replicas:      "\(context.output.status.replicas)"
            componentName: context.name
          }
        }
  status:
    healthPolicy: |-
      cm: context.outputs.statusConfigMap
      isHealth: (cm != _|_ && cm.data != _|_ && cm.data.replicas != _|_ && cm.data.replicas != "2")
---
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: test-worker
spec:
  schematic:
    cue:
      template: |
        output: {
          apiVersion: "apps/v1"
          kind: "Deployment"
          metadata: {
            name: parameter.name
            labels: {
              app: parameter.name
            }
          }
          spec: {
            replicas: parameter.replicas
            selector: matchLabels: {
              app: parameter.name
            }
            template: {
              metadata: labels: {
                app: parameter.name
              }
              spec: containers: [{
                name:  parameter.name
                image: parameter.image
              }]
            }
          }
        }

        parameter: {
          name:     string
          image:    string
          replicas: int
        }
  status:
    healthPolicy: 'isHealth: context.output.status.readyReplicas > 0'
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
---
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: pdapp
  namespace: default
spec:
  components:
    - name: test-deployment
      type: test-worker
      properties:
        image: nginx:1.21
        name: test-deployment
        replicas: 3
      traits:
        - type: test-deployment-trait
          properties:
            name:  trait-deployment
            image: nginx:1.21
        - type: test-cm-trait
```

When this Application is applied:

1. The `test-worker` component creates a Deployment with 3 replicas.
2. Once the Deployment is healthy (at least 1 ready replica), the controller dispatches the two PostDispatch traits.
3. `test-deployment-trait` creates a second Deployment (`trait-deployment`) using the parameters supplied in the trait.
4. `test-cm-trait` creates a ConfigMap (`test-deployment-status`) whose `data.replicas` and label reflect the live replica count read from `context.output.status.replicas`.

### Available Context in PostDispatch Traits

In addition to the [standard trait context fields](customize-trait.md#full-available-context-in-trait), PostDispatch traits have access to `context.output`, which is the full live Kubernetes resource object of the parent component at the time the trait is dispatched.

| Field | Description |
|---|---|
| `context.output` | Full live resource object of the parent component workload |
| `context.output.status` | Status subresource (e.g. `replicas`, `readyReplicas`, `conditions`) |
| `context.output.metadata` | Metadata of the live resource (e.g. `generation`, `annotations`) |
| `context.output.spec` | Spec of the live resource |

### Observing PostDispatch Trait Status

PostDispatch traits surface their status eagerly in `Application.status.services[*].traits[*]` — even before the overall workflow finishes — so you can always see an accurate, up-to-date picture of each trait without waiting for all components to be healthy.

#### While the component workload is unhealthy

If the component cannot reach a healthy state (for example, due to a bad image), PostDispatch traits attached to it are held back and will appear in `vela status` with an explicit pending reason rather than being silently absent:

```
Services:
  - Name: test-deployment
    Health: ❌
    Traits:
      Type: scaler
      Health: ✅

      Type: test-deployment-trait
      Pending: true
      Message: ⏳ Waiting for component to be healthy

      Type: test-cm-trait
      Pending: true
      Message: ⏳ Waiting for component to be healthy
```

#### During a multi-component workflow

In applications with multiple components, the workflow phase stays `runningWorkflow` until every component is healthy. Before this feature, PostDispatch trait status for already-healthy components could be missing until the entire workflow finished. Now, trait status is surfaced as soon as the trait is dispatched, regardless of what other components are doing:

```
Workflow:
  phase: runningWorkflow

Services:
  - Name: test-deployment1       # still unhealthy
    Health: ❌
    Traits:
      Type: expose
      Message: ⏳ Waiting for component to be healthy

  - Name: test-deployment        # already healthy — PostDispatch traits visible immediately
    Traits:
      Type: scaler
      Health: ✅
      Type: test-deployment-trait
      Health: ✅
      Type: test-cm-trait
      Health: ✅
      Type: expose
      Health: ✅
```

#### Pending → healthy transition

When a component that was previously unhealthy becomes healthy, its PostDispatch traits are dispatched and their status transitions automatically from `Pending` to the result of their own health policy evaluation. No manual intervention is required.

## More examples to learn

You can check the following resources for more examples:

- Builtin trait definitions in the [KubeVela github repo](https://github.com/kubevela/kubevela/tree/master/vela-templates/definitions/internal/trait).
- Definitions defined in addons in the [catalog repo](https://github.com/kubevela/catalog/tree/master/addons).