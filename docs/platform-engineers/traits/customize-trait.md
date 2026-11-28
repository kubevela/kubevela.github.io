---
title:  Trait Definition
---

A trait adds operational behaviour to a component: extra resources such as a Service or an Ingress, or a patch to the component's own workload, such as a sidecar. This page shows how to write a TraitDefinition in CUE. Make sure you know the [definition concept](../../getting-started/definition.md) and [how to manage definitions](../cue/definition-edit.md) first.

Most examples on this page are in the CUE format, applied with `vela def apply`; the few in Kubernetes YAML are whole `...Definition` objects. [The Definition File](../oam/definition-file.md) shows the two formats side by side.

The examples here use the CUE file format that `vela def` reads and converts into a TraitDefinition object; [the last section](#the-traitdefinition-object) shows the object it becomes.

:::tip
To build a trait on top of an existing TraitDefinition instead of copying its template, see [Definition Inheritance](../cue/definition-inheritance.md#traits-that-extend-traits).
:::

## Generate a trait scaffold

Start from a scaffold:

```shell
vela def init my-route -t trait --desc "My ingress route trait." > myroute.cue
```

It writes:

```cue
"my-route": {
	alias: ""
	annotations: {}
	attributes: {
		appliesToWorkloads: []
		conflictsWith: []
		definitionRef: {}
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

The empty fields are safe to leave in or delete.

## Create resources from a trait

A trait declares the resources it creates under `outputs`, one entry per resource, each with a unique name:

```cue
outputs: {
	<unique-name>: {
		<the Kubernetes object>
	}
}
```

A trait has no `output`. Its template is evaluated together with the component's template, and `output` there is the component's workload, so the trait's names must not clash with it.

This `my-route` trait creates a Service and an Ingress for its component:

```cue
"my-route": {
	attributes: {
		appliesToWorkloads: ["deployments.apps"]
		podDisruptive: false
	}
	description: "My ingress route trait."
	type: "trait"
}

template: {
	parameter: {
		domain: string
		http: [string]: int
	}

	outputs: service: {
		apiVersion: "v1"
		kind:       "Service"
		metadata: name: context.name
		spec: {
			selector: "app.oam.dev/component": context.name
			ports: [
				for k, v in parameter.http {
					port:       v
					targetPort: v
				},
			]
		}
	}

	outputs: ingress: {
		apiVersion: "networking.k8s.io/v1"
		kind:       "Ingress"
		metadata: name: context.name
		spec: rules: [{
			host: parameter.domain
			http: paths: [
				for k, v in parameter.http {
					path:     k
					pathType: "ImplementationSpecific"
					backend: service: {
						name: context.name
						port: number: v
					}
				},
			]
		}]
	}
}
```

The Service selects pods by `app.oam.dev/component`, because that is the label the built-in component types such as `webservice` put on the pods they create. `context.name` in a trait is the name of the component it is attached to.

Apply it:

```shell
vela def apply myroute.cue
```

Users can now attach it to a component:

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
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        port: 8080
      traits:
        - type: my-route
          properties:
            domain: test.my.domain
            http:
              "/api": 8080
EOF
```

KubeVela creates the Deployment for the component, then the `express-server` Service and Ingress from the trait.

### Create several resources with a loop

A `for` loop inside `outputs` creates one resource per entry. The loop needs a map to range over, so the parameter is a map here:

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
				metadata: name: k
				spec: {
					selector: "app.oam.dev/component": context.name
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

Each key becomes a Service:

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
        image: oamdev/testapp:v1
        ports:
          - port: 8080
          - port: 8081
      traits:
        - type: expose
          properties:
            http:
              myservice1: 8080
              myservice2: 8081
```

## Read the component's resources

A trait can read what its component rendered: `context.output` is the component's workload, and `context.outputs.<name>` is each of the component's other resources, by the name the ComponentDefinition gave it in `outputs`.

KubeVela renders a component before its traits, so these are always there for a trait to read.

Take a `myworker` ComponentDefinition that renders a Deployment and a ConfigMap:

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
			selector: matchLabels: "app.oam.dev/component": context.name
			template: {
				metadata: labels: "app.oam.dev/component": context.name
				spec: containers: [{
					name:  context.name
					image: parameter.image
					ports: [{containerPort: parameter.port}]
					envFrom: [{
						configMapRef: name: context.name + "-game-config"
					}]
					if parameter["cmd"] != _|_ {
						command: parameter.cmd
					}
				}]
			}
		}
	}

	outputs: gameconfig: {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: name: context.name + "-game-config"
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

A `myingress` trait for it reads the container port from the Deployment and a value from the ConfigMap:

```cue
"myingress": {
	type: "trait"
	attributes: appliesToWorkloads: ["myworker"]
}

template: {
	parameter: {
		domain:     string
		path:       string
		exposePort: int
	}

	outputs: service: {
		apiVersion: "v1"
		kind:       "Service"
		metadata: name: context.name
		spec: {
			selector: "app.oam.dev/component": context.name
			ports: [{
				port:       parameter.exposePort
				targetPort: context.output.spec.template.spec.containers[0].ports[0].containerPort
			}]
		}
	}

	outputs: ingress: {
		apiVersion: "networking.k8s.io/v1"
		kind:       "Ingress"
		metadata: {
			name: context.name
			labels: config: context.outputs.gameconfig.data.enemies
		}
		spec: rules: [{
			host: parameter.domain
			http: paths: [{
				path:     parameter.path
				pathType: "ImplementationSpecific"
				backend: service: {
					name: context.name
					port: number: parameter.exposePort
				}
			}]
		}]
	}
}
```

`context.output` here is the rendered Deployment, before it is applied, so it has no `status`. To read the live object, such as its ready replicas, run the trait in the [`PostDispatch` stage](./postdispatch-traits.md).

## Call an HTTP endpoint while rendering

A trait can fetch data over HTTP while it renders and use the answer in its `patch` or `outputs`. Describe the request in `processing.http`; the response body, which must be a JSON object, lands in `processing.output`.

This `token-annotation` trait looks up a token's ID and records it as an annotation on the component's workload:

```cue
"token-annotation": {
	type: "trait"
}

template: {
	parameter: {
		serviceURL: string
	}

	processing: {
		// The service answers with a JSON object such as {"id": "tok-123"}.
		output: {
			id?: string
		}
		http: {
			method: *"GET" | string
			url:    parameter.serviceURL
			request: {
				timeout: "5s"
				header: Accept: "application/json"
			}
		}
	}

	patch: metadata: annotations: "example.com/token-id": processing.output.id
}
```

`processing.http` takes `method`, `url` and an optional `request` with `timeout`, `body`, `header` and `trailer`; header and trailer values are strings. A request with no `header` is sent with `Content-Type: application/json`.

The request runs from the KubeVela controller each time the Application renders, and holds a reconcile worker while it waits, so it is bounded the same way a workflow HTTP request is (see [HTTP limits](/workflow/next/guides/authoring/step-definition#http-limits)):

| Limit | Default | Set with |
| --- | --- | --- |
| Timeout | 3s when `request.timeout` is unset | `request.timeout`, a duration such as `"10s"`, up to the controller's `--max-workflow-http-timeout` (default `60s`). A longer or non-positive value fails the render. |
| Response size | 1 MiB | The controller's `--max-workflow-http-response-bytes`. A longer body fails the render. |
| Destinations | Cloud metadata addresses (`169.254.0.0/16`, `metadata.google.internal` and similar) are always refused | Add more with ConfigMaps from the `vela-core-http-deny` ConfigTemplate in the controller's namespace. The `BlockPrivateHTTPAddresses` feature gate also refuses private ranges, and `DisableWorkflowHTTP` turns outbound HTTP off. |

When the request fails, the trait fails to render with `invalid process of trait <name>`, and the Application reports the error.

## Patch the component

Besides creating resources, a trait can patch the component's workload, for example to add a sidecar or set resource limits that the component's author didn't expose. That keeps operational settings with the team that owns them. Patching has its own rules for merging lists and overriding fields; see [Patch Traits](./patch-trait.md), which also covers patching from a workflow step.

:::tip
A patch unifies with whatever workload it meets, so it can conflict with one you did not expect.
[Test the trait](../cue/definition-testing.md#testing-traits) against the workloads it should patch,
with `#TraitRender` for the patch and `#TraitStatus` for its health.
:::

## Choose when a trait is dispatched

`spec.stage` (`stage` under `attributes` in the CUE format) decides when a trait's resources are applied relative to its component:

| Stage | Applied |
| --- | --- |
| `PreDispatch` | First. The component's workload and default-stage traits wait until these resources are healthy. |
| `DefaultDispatch` | With the component's workload. This is the default when `stage` is unset. |
| `PostDispatch` | Once the component's workload is healthy, rendered with the live workload in `context.output`. See [PostDispatch Traits](./postdispatch-traits.md). |

## Context in a trait {#full-available-context-in-trait}

A trait reads the same `context` as its component, plus `context.traitType` and the component's rendered `context.output` and `context.outputs`. `context.name` is the component's name.

Every field, and which definition kinds can read it, is in the [Context Reference](../context-reference.md).

## Health and status

A trait can report its own health and a status message. See [Definition Health & Status](../status/definition_health_status.md).

## The TraitDefinition object

Definitions are Kubernetes objects. You can write them as YAML, or as CUE files that `vela def` converts. `vela def apply myroute.cue` creates a TraitDefinition like this:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: <TraitDefinition name>
  annotations:
    definition.oam.dev/description: <function description>
spec:
  definitionRef:            # the CRD that provides this trait, if any
    name: <CRD name, e.g. ingresses.networking.k8s.io>
  extends: <TraitDefinition this one builds on>
  abstract: <true if the trait may only be extended, never used directly>
  appliesToWorkloads:
    - <workload types this trait can be attached to>
  conflictsWith:
    - <traits that can't sit on the same component as this one>
  podDisruptive: <true if adding or changing the trait restarts pods>
  workloadRefPath: <field of the trait object that gets a reference to the workload>
  revisionEnabled: <true if the trait is aware of component revisions>
  manageWorkload: <true if the trait is responsible for creating the workload>
  controlPlaneOnly: <true to dispatch the trait's resources to the hub cluster only>
  stage: <PreDispatch, DefaultDispatch (the default) or PostDispatch>
  version: <semantic version of this definition>
  module: <module this definition was published in>
  apiVersion: <API line of that module, e.g. v1>
  restrictions:             # which namespaces may use the trait
    namespaces: [<namespace>]
  status:
    customStatus: <CUE for the status message>
    healthPolicy: <CUE for the health check>
    details: <CUE for status details>
  extension: <free-form data for platform builders>
  schematic:
    cue:
      template: <CUE format template>
```

Each field is described in [X-Definition](../oam/x-definition.md#traitdefinition).

## More examples

The built-in trait definitions are in the [KubeVela repository](https://github.com/kubevela/kubevela/tree/master/vela-templates/definitions/internal/trait).
