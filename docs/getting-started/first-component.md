---
title: Create Your First Component
---

The built-in component types, like `webservice`, are definitions written in [CUE](https://cuelang.org/). This guide writes one of your own: a component type that asks for an image and a replica count, and turns them into a full Kubernetes Deployment. Then it teaches the component to report its own health.

It follows on from [Deploy First Application](../quick-start.md).

## What a component definition is

A component definition has two halves:

- a **parameter** schema: what users of the component fill in;
- an **output** template: the Kubernetes resource it produces from those parameters.

The output can be any Kubernetes resource, including the custom resources of operators you run, such as Crossplane or Terraform for cloud resources. Users only ever see the parameters, so the definition is where your platform's defaults and conventions live.

## Write the definition

Save the following as `simple-deployment.cue`:

```cue
"my-simple-deployment": {
	annotations: {}
	attributes: workload: {
		definition: {
			apiVersion: "apps/v1"
			kind:       "Deployment"
		}
		type: "deployments.apps"
	}
	description: "Simple deployment with configurable image and replicas"
	labels: {}
	type: "component"
}

template: {
	parameter: {
		// +usage=The container image to run
		image: string
		// +usage=How many copies to run
		replicas: *1 | int
	}

	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: name: context.name
		spec: {
			replicas: parameter.replicas
			selector: matchLabels: app: context.name
			template: {
				metadata: labels: app: context.name
				spec: containers: [{
					name:  "main"
					image: parameter.image
				}]
			}
		}
	}
}
```

- `image` is required; `replicas` defaults to 1 (`*1 | int`).
- `context.name` is the component's name in the Application, so the labels and selector are always consistent.
- The `+usage` comments become the parameters' descriptions in `vela show` and the UI console.

Check it and install it:

```bash
vela def vet simple-deployment.cue
vela def apply simple-deployment.cue
```

<details>
<summary>expected output</summary>

```console
Validation simple-deployment.cue succeed.
ComponentDefinition my-simple-deployment created in namespace vela-system.
```
</details>

It now shows up next to the built-in types:

```bash
vela def list --type component | grep my-simple
```

## Use it

Save the following as `my-app.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
spec:
  components:
    - name: my-simple-deployment-app
      type: my-simple-deployment
      properties:
        image: nginx:alpine
        replicas: 3
```

Two properties; the definition fills in the rest. Deploy it and see what it made:

```bash
vela up -f my-app.yaml
vela status my-app --tree
```

<details>
<summary>expected output</summary>

```console
CLUSTER       NAMESPACE     RESOURCE                            STATUS
local     ─── default   ─── Deployment/my-simple-deployment-app updated
```
</details>

To see the rendered Deployment without deploying anything, use `vela dry-run -f my-app.yaml`.

## Report health

KubeVela can't know what "healthy" means for every resource, so a definition can say. Add a `status` block to the attributes in `simple-deployment.cue`:

```cue
"my-simple-deployment": {
	annotations: {}
	attributes: {
		workload: {
			definition: {
				apiVersion: "apps/v1"
				kind:       "Deployment"
			}
			type: "deployments.apps"
		}
		status: {
			healthPolicy: #"""
				ready: *context.output.status.readyReplicas | 0
				isHealth: ready == context.output.spec.replicas
				"""#
			customStatus: #"""
				ready: *context.output.status.readyReplicas | 0
				message: "Ready: \(ready)/\(context.output.spec.replicas)"
				"""#
			details: #"""
				desiredReplicas: *context.output.spec.replicas | 0
				readyReplicas: *context.output.status.readyReplicas | 0
				availableReplicas: *context.output.status.availableReplicas | 0
				"""#
		}
	}
	description: "Simple deployment with configurable image and replicas"
	labels: {}
	type: "component"
}
```

The `template` stays as it was. In the `status` block, `context.output` is the Deployment as it is in the cluster:

| Field | What it does |
| --- | --- |
| `healthPolicy` | Sets `isHealth`: healthy when every replica is ready. |
| `customStatus` | Sets the `message` shown next to the component's health. |
| `details` | Structured values shown under the component, and kept in the Application's status for tools to read. |

`readyReplicas` is missing from a Deployment's status while nothing is ready, so each read has a default (`*... | 0`). Without it the expression fails, and the component shows as unhealthy with a stale message.

Apply the new version of the definition:

```bash
vela def apply simple-deployment.cue
```

The definition keeps its history as revisions:

```bash
kubectl get definitionrevision -n vela-system | grep my-simple-deployment
```

```console
my-simple-deployment-v1   1   5ccedc57efe33d83   Component
my-simple-deployment-v2   2   2e6f1c064e373b32   Component
```

An application picks up a new definition the next time it is rendered. Change `replicas` to `2` in `my-app.yaml` so that happens now, and apply it:

```bash
vela up -f my-app.yaml
vela status my-app
```

<details>
<summary>expected output</summary>

```console
...
Services:

  - Name: my-simple-deployment-app
    Cluster: local
    Namespace: default
    Type: my-simple-deployment
    Health: ✅
      Message: Ready: 2/2
      Status Details:
        availableReplicas: 2
        desiredReplicas: 2
        readyReplicas: 2
    No trait applied
```
</details>

Anyone using the component now gets a health check and a readable status from `vela status` and the UI console, without knowing what a Deployment's status looks like.

## Clean up

```bash
vela delete my-app -n default -y
vela def del my-simple-deployment
```

`vela def del` asks you to confirm.

## Troubleshooting

<details>
<summary>The component type isn't found</summary>

Check it's installed, and look at what the cluster has:

```bash
vela def list --type component | grep my-simple
vela def get my-simple-deployment
```

Apply it again with `vela def apply simple-deployment.cue` if it's missing.
</details>

<details>
<summary>CUE errors</summary>

`vela def vet simple-deployment.cue` checks the definition on its own. `vela dry-run -f my-app.yaml` renders it with your application's properties, which catches errors in the template.
</details>

<details>
<summary>A trait won't attach to the component</summary>

Each trait declares the workloads it applies to. `vela trait` lists them in its `APPLIES-TO` column.
</details>

## Next steps

- [CUE basics](../platform-engineers/cue/basic.md) and [definition editing](../platform-engineers/cue/definition-edit.md): the language and the tooling.
- [Custom components](../platform-engineers/components/custom-component.md), [traits](../platform-engineers/traits/customize-trait.md), [policies](../platform-engineers/policy/custom-policy.md) and [workflow steps](/workflow/next/authoring/step-definition).
- [Health status](../platform-engineers/status/definition_health_status.md): everything `healthPolicy`, `customStatus` and `details` can do.
- [Definitions in Go](../platform-engineers/defkit/overview.md): write the same definitions with defkit, and [test them](../platform-engineers/defkit/testing.md).
