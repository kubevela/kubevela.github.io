---
title: Manage Definition
---

:::tip
Before reading this part, please make sure you've learned the [Definition Concept](../../getting-started/definition.md) of KubeVela.
:::

The `vela def` commands help you write and manage definitions. Write the definition as a CUE file; `vela def` turns it into the Kubernetes object.

## init

`vela def init` is a command that helps users bootstrap new definitions. To create an empty trait definition, run:

```bash
vela def init my-trait -t trait --desc "My trait description."
```

It will generate the following scaffold:

```cue
"my-trait": {
        annotations: {}
        attributes: {
                appliesToWorkloads: []
                conflictsWith: []
                definitionRef:   ""
                podDisruptive:   false
                workloadRefPath: ""
        }
        description: "My trait description."
        labels: {}
        type: "trait"
}
template: patch: {}
```

You can also initiate definitions interactively like below:

```bash
vela def init my-comp --interactive
```

<details>
<summary>expected output</summary>

```bash
Please choose one definition type from the following values: component, policy, source, trait, workflow-step, workload
> Definition type: component
> Definition description: My component definition.
Please enter the location the template YAML file to build definition. Leave it empty to generate default template.
> Definition template filename: 
Please enter the output location of the generated definition. Leave it empty to print definition to stdout.
> Definition output filename: my-component.cue
Definition written to my-component.cue
```
</details>

To start from YAML you already have, pass it with `--template-yaml`. Take this Deployment and Service:

```yaml
# my-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: hello-world
  template:
    metadata:
      labels:
        app.kubernetes.io/name: hello-world
    spec:
      containers:
      - name: hello-world
        image: somefive/hello-world
        ports: 
        - name: http
          containerPort: 80
          protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: hello-world-service
spec:
  selector:
    app.kubernetes.io/name: hello-world
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: http
  type: LoadBalancer
```

Turn it into a CUE ComponentDefinition:

```bash
vela def init my-comp -t component --desc "My component." --template-yaml ./my-deployment.yaml
```

The output:

```cue
"my-comp": {
        annotations: {}
        attributes: workload: definition: {
                apiVersion: "<change me> apps/v1"
                kind:       "<change me> Deployment"
        }
        description: "My component."
        labels: {}
        type: "component"
}
template: {
        output: {
                metadata: name: "hello-world"
                spec: {
                        replicas: 1
                        selector: matchLabels: "app.kubernetes.io/name": "hello-world"
                        template: {
                                metadata: labels: "app.kubernetes.io/name": "hello-world"
                                spec: containers: [{
                                        name:  "hello-world"
                                        image: "somefive/hello-world"
                                        ports: [{
                                                name:          "http"
                                                containerPort: 80
                                                protocol:      "TCP"
                                        }]
                                }]
                        }
                }
                apiVersion: "apps/v1"
                kind:       "Deployment"
        }
        outputs: "hello-world-service": {
                metadata: name: "hello-world-service"
                spec: {
                        ports: [{
                                name:       "http"
                                protocol:   "TCP"
                                port:       80
                                targetPort: "http"
                        }]
                        selector: "app.kubernetes.io/name": "hello-world"
                        type: "LoadBalancer"
                }
                apiVersion: "v1"
                kind:       "Service"
        }
        parameter: {}

}
```

The generated definition hardcodes every value from the YAML, and `parameter` is empty, so every Application that uses it gets the same `hello-world` Deployment. Turn the values a user should choose into parameters, name the resources after the component with `context.name`, and remove the `<change me>` markers. Save it as `my-comp.cue`:

```cue
"my-comp": {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
	}
	description: "My component."
	labels: {}
	type: "component"
}
template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "Deployment"
		metadata: name: context.name
		spec: {
			replicas: parameter.replicas
			selector: matchLabels: "app.oam.dev/component": context.name
			template: {
				metadata: labels: "app.oam.dev/component": context.name
				spec: containers: [{
					name:  context.name
					image: parameter.image
					ports: [{
						name:          "http"
						containerPort: 80
						protocol:      "TCP"
					}]
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
				name:       "http"
				protocol:   "TCP"
				port:       80
				targetPort: "http"
			}]
		}
	}
	parameter: {
		// +usage=Container image to run
		image: string
		// +usage=Number of replicas
		replicas: *1 | int
	}
}
```

The Deployment and the Service both use the `app.oam.dev/component` label, so the Service selects this component's Pods, and the `+usage` comments become the parameter descriptions users see.

## vet

Check the file for CUE errors, such as a missing bracket or a reference to a field that does not exist:

```bash
vela def vet my-comp.cue
```

## test

`vela def test` runs the tests in `*_test.cue` files beside your definitions: what a definition
renders, its health and status, what a workflow step does, and what a source resolves to.

```bash
vela def test ./definitions
```

See [Testing CUE Definitions](./definition-testing.md).

## render

See the Kubernetes object the CUE file becomes, without a cluster:

```bash
vela def render my-comp.cue
```

<details>
<summary>expected output</summary>

```
--- my-comp.cue ---
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: My component.
  name: my-comp
spec:
  schematic:
    cue:
      template: |
        output: {
        	apiVersion: "apps/v1"
        	kind:       "Deployment"
        	metadata: name: context.name
        ...
  workload:
    definition:
      apiVersion: apps/v1
      kind: Deployment
```

</details>

`vela def render` works offline by default. If the definition imports a CUE package registered with a `Package` resource, add `--cluster-packages` to load those packages from the cluster your kubeconfig points at. `-o` writes the result to a file, and a directory renders every definition in it.

## Test it with an application

Pass the local definition to `vela dry-run` with `--definition`, or `-d` for short, to see the resources an Application would get from it. Nothing is applied. Save this as `app.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app
spec:
  components:
    - name: express-server
      type: my-comp
      properties:
        image: somefive/hello-world
```

```bash
vela dry-run -f app.yaml -d my-comp.cue
```

<details>
<summary>expected output</summary>

```yaml
---
# Application(vela-app) -- Component(express-server)
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: my-comp
  name: express-server
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app.oam.dev/component: express-server
  template:
    metadata:
      labels:
        app.oam.dev/component: express-server
    spec:
      containers:
      - image: somefive/hello-world
        name: express-server
        ports:
        - containerPort: 80
          name: http
          protocol: TCP

---
## From the auxiliary workload
apiVersion: v1
kind: Service
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: express-server
    app.oam.dev/name: vela-app
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: TRAIT
    trait.oam.dev/resource: service
    trait.oam.dev/type: AuxiliaryWorkload
  name: express-server
  namespace: default
spec:
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: http
  selector:
    app.oam.dev/component: express-server

---
```

</details>

## apply

Apply the definition to the cluster:

```bash
vela def apply my-comp.cue --namespace my-namespace
```

The definition goes into `my-namespace`; without `--namespace` it goes into `vela-system`.

:::tip
A definition in `vela-system` can be used by every Application in the cluster. A definition in any other namespace can only be used by Applications in that namespace, which is handy for multi-tenant clusters.
:::

Add `--dry-run` to print the object `vela def apply` would send, without applying it:

```bash
vela def apply my-comp.cue --dry-run
```

## get

`vela def get` reads a definition from the cluster and prints it back as CUE, which is easier to read than the YAML object with its template embedded as a string:

```bash
vela def get my-comp -n my-namespace
```

Each change to a definition creates a DefinitionRevision. List them, then fetch one:

```bash
vela def get my-comp -n my-namespace --revisions
vela def get my-comp -n my-namespace -r 1
```

## list

List the definitions in the cluster:

```bash
vela def list
```

Filter by type with `-t` (`component`, `trait`, `policy`, `workflow-step`, `source`, `workload`):

```bash
vela def list -t component
```

Abstract definitions, which can only be extended, are hidden by default; add `--include-abstract` to show them. `--from <addon>` shows only the definitions an addon installed:

```bash
vela def list --include-abstract
vela def list --from fluxcd
```

## edit

`vela def edit` opens a definition from the cluster as CUE in your editor and applies it when you save. Set `EDITOR` to pick the editor:

```bash
EDITOR=vim vela def edit my-comp -n my-namespace
```

## delete

`vela def del` deletes a definition:

```bash
$ vela def del my-comp -n my-namespace
Are you sure to delete the following definition in namespace my-namespace?
ComponentDefinition my-comp: My component.
[yes|no] > yes
ComponentDefinition my-comp in namespace my-namespace deleted.
```

## compatibility-check

Before you upgrade KubeVela or change a definition that Applications already use, check the CUE still compiles. `vela def compatibility-check definitions` scans every definition and its revision history for CUE the current KubeVela version cannot compile; `vela def compatibility-check applications` does the same for active ApplicationRevisions:

```bash
vela def compatibility-check definitions
vela def compatibility-check applications
```

## Next Step

* Learn more about [defining customized component](../components/custom-component.md).
* Learn more about [defining customized trait](../traits/customize-trait.md).
