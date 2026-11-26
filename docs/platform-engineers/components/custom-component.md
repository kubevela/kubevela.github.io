---
title:  Component Definition
---

In this section, we will introduce how to use [CUE](../cue/basic.md) to customize components via `ComponentDefinition`. Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition.md) and [how to manage definition](../cue/definition-edit.md).

Most examples on this page are in the CUE format, applied with `vela def apply`; the few in Kubernetes YAML are whole `...Definition` objects. [The Definition File](../oam/definition-file.md) shows the two formats side by side.

:::tip
To build a component on top of an existing ComponentDefinition instead of copying its template, see [Definition Inheritance](../cue/definition-inheritance.md).
:::

A component definition is a CUE template that renders Kubernetes objects from what a user writes in an Application. It renders two things:

- `output` is the main workload. Traits patch it, and health checks read it as `context.output`.
- `outputs` holds everything else the component needs, such as a Service, each under a name unique within the component.

## Declare `ComponentDefinition`

Start from YAML you know works. Here is a minimal Deployment:

```yaml title="stateless.yaml"
apiVersion: "apps/v1"
kind: "Deployment"
spec:
  selector:
    matchLabels:
      "app.oam.dev/component": "name"
  template:
    metadata:
      labels:
        "app.oam.dev/component": "name"
    spec:
      containers:
      - name: "name"
        image: "image"
```

Generate a `ComponentDefinition` scaffold from it with `vela def init`:

```shell
vela def init stateless -t component --template-yaml ./stateless.yaml -o stateless.cue
```

It generates a file:

```cue title="stateless.cue"
stateless: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "<change me> apps/v1"
		kind:       "<change me> Deployment"
	}
	description: ""
	labels: {}
	type: "component"
}

template: {
	output: {
		spec: {
			selector: matchLabels: "app.oam.dev/component": "name"
			template: {
				metadata: labels: "app.oam.dev/component": "name"
				spec: containers: [{
					name:  "name"
					image: "image"
				}]
			}
		}
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	outputs: {}
	parameter: {}
}
```

In detail:
- `stateless` is the name of the component definition, the type users write in an Application.
- `stateless.attributes.workload` names the kind of workload the component renders, so traits can declare which workloads they apply to.
- `template` is the CUE template:
    * `output` and `outputs` define the resources the component renders.
    * `parameter` defines what users can set in the Application's `properties`. KubeVela generates the schema users see from it.

### Make it a template

Now replace the literals. The name comes from the Application: `context.name` is the name of the component, so a component called `hello` renders a Deployment, a container and a selector all called `hello`, and the user never types it twice. The image and replica count are parameters. A `// +usage=` comment above a parameter is the description users see in `vela show` and VelaUX.

```cue title="stateless.cue"
stateless: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	description: "A stateless service run as a Deployment."
	labels: {}
	type: "component"
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		spec: {
			replicas: parameter.replicas
			selector: matchLabels: "app.oam.dev/component": context.name
			template: {
				metadata: labels: "app.oam.dev/component": context.name
				spec: containers: [{
					name:  context.name
					image: parameter.image
				}]
			}
		}
	}
	outputs: {}
	parameter: {
		// +usage=The container image to run
		image: string
		// +usage=How many pods to run
		replicas: *1 | int & >=0
	}
}
```

`image: string` has no default, so users must set it. `replicas: *1 | int & >=0` defaults to 1 and refuses a negative number.

Check the file with `vela def vet`:

```shell
vela def vet stateless.cue
```

<details>
<summary>expected output</summary>

```
Validation stateless.cue succeed.
```
</details>

:::tip
`vela def vet` checks that a definition is well formed. To check what it renders from given
parameters, and its health and status, [write tests for it](../cue/definition-testing.md).
:::

Apply the `ComponentDefinition` to your cluster:

```shell
vela def apply stateless.cue
```

<details>
<summary>expected output</summary>

```
ComponentDefinition stateless created in namespace vela-system.
```
</details>

Users can now see its schema and use it in an Application:

```shell
vela show stateless
```

<details>
<summary>expected output</summary>

```
# Specification
+----------+-----------------------------+--------+----------+---------+
|   NAME   |         DESCRIPTION         |  TYPE  | REQUIRED | DEFAULT |
+----------+-----------------------------+--------+----------+---------+
| image    | The container image to run  | string | true     |         |
| replicas | How many pods to run        | int    | false    | 1       |
+----------+-----------------------------+--------+----------+---------+
```
</details>

A run-to-completion workload works the same way. The `task` component below renders a Job.

<details>
<summary>A <code>task</code> component based on a Job</summary>

```shell
vela def init task -t component -o task.cue
```

Edit the generated file:

```cue title="task.cue"
task: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "batch/v1"
		kind:       "Job"
	}
	description: "A run-to-completion task run as a Job."
	labels: {}
	type: "component"
}

template: {
	output: {
		apiVersion: "batch/v1"
		kind:       "Job"
		spec: {
			parallelism: parameter.count
			completions: parameter.count
			template: spec: {
				restartPolicy: parameter.restart
				containers: [{
					name:  context.name
					image: parameter.image
					if parameter.cmd != _|_ {
						command: parameter.cmd
					}
				}]
			}
		}
	}
	parameter: {
		// +usage=How many pods to run, and how many must succeed
		count: *1 | int
		// +usage=The container image to run
		image: string
		// +usage=The pod restart policy
		restart: *"Never" | "OnFailure"
		// +usage=The command to run in the container
		cmd?: [...string]
	}
}
```

`cmd?` is optional, so the template only sets `command` when the user gave one: `parameter.cmd != _|_` is true when the field exists. Every container needs a `name`, or the API server refuses the Job.

Apply it:

```shell
vela def apply task.cue
```

```
ComponentDefinition task created in namespace vela-system.
```
</details>

## Declare an `Application` using this component

Use the `stateless` and `task` types in an Application:

```yaml title="website.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: hello
      type: stateless
      properties:
        image: oamdev/hello-world
    - name: countdown
      type: task
      properties:
        image: centos:7
        cmd:
          - "bin/bash"
          - "-c"
          - "for i in 9 8 7 6 5 4 3 2 1 ; do echo $i ; done"
```

<details>
<summary>What the Application renders</summary>

KubeVela renders these objects from the templates and the Application's properties. Each object, and each container, takes its name from the component:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello
  ... # labels and annotations KubeVela adds
spec:
  replicas: 1
  selector:
    matchLabels:
      app.oam.dev/component: hello
  template:
    metadata:
      labels:
        app.oam.dev/component: hello
    spec:
      containers:
        - name: hello
          image: oamdev/hello-world
---
apiVersion: batch/v1
kind: Job
metadata:
  name: countdown
  ... # labels and annotations KubeVela adds
spec:
  parallelism: 1
  completions: 1
  template:
    spec:
      containers:
        - name: countdown
          image: centos:7
          command:
            - bin/bash
            - -c
            - for i in 9 8 7 6 5 4 3 2 1 ; do echo $i ; done
      restartPolicy: Never
```
</details>

Use [dry run](../../tutorials/dry-run.md) to see what an Application renders without deploying it.


## CUE `Context` for runtime information

`context` holds what KubeVela knows about the Application at render time. You don't declare it in the template; KubeVela fills it in before it renders. The fields used most are the Application name (`context.appName`) and the component name (`context.name`), which the examples above use for every name:

```cue
context: {
	appName: string
	name:    string
}
```

The [full list of context variables](#full-available-context-in-component) is at the end of this page.

## Compose resources in one component

A component often needs more than one object: a `webserver` is a Deployment and the Service in front of it. Put the main workload in `output` and every other object in `outputs`, each under a name unique within the component:

```cue
output: {
	<template of the main workload>
}
outputs: {
	<unique-name>: {
		<template of another resource>
	}
}
```

`output` is the main workload: traits patch it, and health checks read it as `context.output`.

Here is the `webserver` definition. It sets the Service's `metadata.name` to the component name; an object in `outputs` without a name gets a generated one, which nothing else can address.

```cue title="webserver.cue"
webserver: {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	description: "A web server: a Deployment and a Service in front of it."
	labels: {}
	type: "component"
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		spec: {
			replicas: parameter.replicas
			selector: matchLabels: "app.oam.dev/component": context.name
			template: {
				metadata: labels: "app.oam.dev/component": context.name
				spec: containers: [{
					name:  context.name
					image: parameter.image
					ports: [{
						containerPort: parameter.port
					}]
					if parameter.cmd != _|_ {
						command: parameter.cmd
					}
					if parameter.env != _|_ {
						env: parameter.env
					}
					if parameter.cpu != _|_ {
						resources: {
							limits: cpu:   parameter.cpu
							requests: cpu: parameter.cpu
						}
					}
				}]
			}
		}
	}
	outputs: service: {
		apiVersion: "v1"
		kind:       "Service"
		metadata: name: context.name
		spec: {
			selector: "app.oam.dev/component": context.name
			ports: [{
				port:       parameter.port
				targetPort: parameter.port
			}]
		}
	}
	parameter: {
		// +usage=The container image to run
		image: string
		// +usage=How many pods to run
		replicas: *1 | int & >=0
		// +usage=The port the container listens on, and the Service exposes
		port: *80 | int
		// +usage=The command to run in the container
		cmd?: [...string]
		// +usage=Environment variables for the container
		env?: [...{
			name:   string
			value?: string
			valueFrom?: secretKeyRef: {
				name: string
				key:  string
			}
		}]
		// +usage=CPU request and limit, for example 100m
		cpu?: string
	}
}
```

Apply it to your cluster:

```shell
vela def apply webserver.cue
```

<details>
<summary>expected output</summary>

```
ComponentDefinition webserver created in namespace vela-system.
```
</details>

Users can now declare an `Application` with it:

```yaml title="webserver-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webserver-demo
  namespace: default
spec:
  components:
    - name: hello-webserver
      type: webserver
      properties:
        image: oamdev/hello-world
        port: 8000
        env:
        - name: "foo"
          value: "bar"
        cpu: "100m"
```

Create the Application:

```shell
vela up -f webserver-app.yaml
```

Then check the resources it created:

```shell
vela status webserver-demo --tree --detail
```

<details>
<summary>expected output</summary>

```console
CLUSTER       NAMESPACE     RESOURCE                       STATUS    APPLY_TIME          DETAIL
local     ─── default   ─┬─ Service/hello-webserver        updated   2022-10-15 21:58:35 Type: ClusterIP
                         │                                                               Cluster-IP: 10.43.255.55
                         │                                                               External-IP: <none>
                         │                                                               Port(s): 8000/TCP
                         │                                                               Age: 66s
                         └─ Deployment/hello-webserver     updated   2022-10-15 21:58:35 Ready: 1/1  Up-to-date: 1
                                                                                         Available: 1  Age: 66s
```
</details>


## Define Health Check and Status of Components

Without a health policy, a component is healthy as soon as its resources are applied, even if its pods never start. Add one to the `attributes` of `webserver.cue`, beside `workload`. The policy reads the rendered workload as `context.output`, including the `status` the cluster reports:

```cue
attributes: {
	workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	status: {
		healthPolicy: {
			_ready: *0 | int
			if context.output.status.readyReplicas != _|_ {
				_ready: context.output.status.readyReplicas
			}
			isHealth: _ready == context.output.spec.replicas
		}
		customStatus: {
			_ready: *0 | int
			if context.output.status.readyReplicas != _|_ {
				_ready: context.output.status.readyReplicas
			}
			message: "Ready: \(_ready)/\(context.output.spec.replicas)"
		}
	}
}
```

- `healthPolicy` sets `isHealth`: the component is healthy once every replica is ready. `status.readyReplicas` is missing until a pod is ready, so `_ready` defaults to 0.
- `customStatus` sets `message`, which `vela status` shows beside the component, for example `Ready: 1/1`.

For status details, trait health and the other fields `context` gives a health policy, see [Definition Health & Status](../status/definition_health_status.md).

## Full available `context` in Component {#full-available-context-in-component}

A component template reads the Application's name, namespace and revision, the component's own name and type, the target cluster and its Kubernetes version (`context.clusterVersion`), and its rendered `context.output` and `context.outputs`. Every field, which definition kinds can read it, and an example that picks an API version by cluster version are in the [Context Reference](../context-reference.md).

## Resources in other namespaces

By default, KubeVela puts every resource a template outputs into the Application's namespace. Set `metadata.namespace` on an output to create it in another namespace. KubeVela tracks it with the Application's ResourceTracker and deletes it with the Application. The target namespace must already exist.

This ComponentDefinition takes the namespace as a parameter:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: worker-in-namespace
  namespace: vela-system
spec:
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
  schematic:
    cue:
      template: |
        parameter: {
        	image: string
        	// +usage=The namespace to create the Deployment in
        	namespace: string
        }
        output: {
        	apiVersion: "apps/v1"
        	kind:       "Deployment"
        	metadata: {
        		name:      context.name
        		namespace: parameter.namespace
        	}
        	spec: {
        		selector: matchLabels: "app.oam.dev/component": context.name
        		template: {
        			metadata: labels: "app.oam.dev/component": context.name
        			spec: containers: [{
        				name:  context.name
        				image: parameter.image
        			}]
        		}
        	}
        }
```

An Application in `default` that creates its Deployment in `shared`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: shared-worker
  namespace: default
spec:
  components:
    - name: worker
      type: worker-in-namespace
      properties:
        image: oamdev/hello-world
        namespace: shared
```

With the ComponentDefinition applied, check where the Deployment lands before applying the Application: `vela dry-run -f app.yaml` shows it with `namespace: shared`.

The controller flag `--allow-cross-namespace-resource` (default `true`) allows this. Set it to `false` and an Application can only create resources in its own namespace. The Helm chart has no value for it, so add it to the `kubevela-vela-core` Deployment's container args.

## Component definition in Kubernetes

KubeVela is fully programmable via CUE, while it leverage Kubernetes as control plane and align with the API in yaml.
As a result, the CUE definition will be converted as Kubernetes API when applied into cluster.

The component definition will be in the following API format:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: <ComponentDefinition name>
  annotations:
    definition.oam.dev/description: <Function description>
spec:
  workload: # Workload Capability Indicator
    definition:
      apiVersion: <Kubernetes Workload resource group>
      kind: <Kubernetes Workload types>
  schematic:  # Component description
    cue: # Details of components defined by CUE language
      template: <CUE format template>
```

You can check the detail of this format [here](../oam/x-definition.md).

## More examples to learn

You can check the following resources for more examples:

- Builtin component definitions in the [KubeVela github repo](https://github.com/kubevela/kubevela/tree/master/vela-templates/definitions/internal/component).
- Definitions defined in addons in the [catalog repo](https://github.com/kubevela/catalog/tree/master/addons).
