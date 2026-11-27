---
title: Addon Application in CUE or YAML
---

An addon's Application can be written in YAML or CUE. Use CUE when the addon has parameters or installs parts of itself conditionally. Most of this page covers CUE; [Write it in YAML](#write-it-in-yaml) covers YAML. For the layout of an addon as a whole, see [the addon introduction](make-your-own-addon.md).

A CUE addon's Application comes from two places: the application template (`template.cue`) and the resource files in the `resources/` folder.

:::caution
Addon CUE is compiled as plain CUE v0.14. Unlike definitions, it does not go through KubeVela's CUE compatibility layer, so syntax that CUE has since dropped fails when the addon is enabled. The one that catches most people is list arithmetic: write `list.Concat([a, b])` (with `import "list"`), not `a + b`.
:::

## Render without installing

Check what your addon renders before you enable it for real. To have KubeVela render the whole addon, parameters and all, and print the result without applying anything:

```shell
vela addon enable ./my-addon --dry-run
```

To render just the Application with the CUE CLI, without a cluster, run this from the addon's folder:

```shell
cue export *.cue resources/*.cue -e output --out yaml
```

The CUE CLI only loads the files as one package when every one of them declares `package main`. `vela addon init` writes `parameter.cue` without it, which KubeVela accepts but the CUE CLI doesn't: you get `reference "parameter" not found`. Add `package main` to the top of `parameter.cue` and both work.

## Application template file (template.cue)

The most important part in the application template is `output` field, which must place a KubeVela application as follows:

```cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		components: [
			{
				type: "k8s-objects"
				name: "example-namespace"
				properties: objects: [{
					apiVersion: "v1"
					kind:       "Namespace"
					metadata: name: parameter.namespace
				}]
			},
		]
	}
}
```

In this example, the name of the namespace defined in `spec.components[0].properties.objects[0]` of this application is determined by `parameter.namespace`, which means that its name will be dynamically rendered by the `namespace` parameter when the addon is enabled. If you want the created namespace to be `my-namespace`, you can run the following command:

```shell
vela addon enable <addon-name> namespace=my-namespace
```

After rendered, the resulting application is:

```yaml
kind: Application
metadata:
  name: addon-<addon-name>
  namespace: vela-system
spec:
  components:
    - name: example-namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: my-namespace
```

You can refer to the [CUE basic](/docs/platform-engineers/cue/basic) to learn language details.

> Please notice: The name of Application in template file will be replaced by the addon name in `metadata.yaml`. The application will always have a unified name in the format of `addon-<addon_name>`.

## Parameter definition file (parameter.cue) 

In the example above, we use the parameter `namespace`  to set the name of Kubernetes `namespace` resource. Actually, we also need a parameter definition file (`parameter.cue`) to declare what parameters this addon has. For example,

```cue
parameter: {
  //+usage=namespace to create
  namespace: string
}
```

When enabling the addon, you can set the parameters declared in the parameter definition file by appending the parameters to the command, as follows:

```shell
vela addon enable <addon-Name> <parameter-name-1=value> <parameter-name-2=value>
```

## Resource files (CUE files under `resources/` folder)

You can put CUE files holding data or schema in the `resources/` folder and reference them from `template.cue` as one package. This keeps the template from growing into one huge file.

Continuing with the example above, we split the CUE block that defines the `namespace` component under the `resources/` folder, the folder structure is as follows:

```shell
├── resources/
│   └── namespace.cue
├── README.md
├── metadata.yaml
├── parameter.cue
└── template.cue
```

The `namespace.cue` file is as follows:

```cue
// resources/namespace.cue
package main

namespace: {
	type: "k8s-objects"
	name: "example-namespace"
	properties: objects: [{
		apiVersion: "v1"
		kind:       "Namespace"
		metadata: name: parameter.namespace
	}]
}
```

Then we can reference this CUE block in `template.cue` :

```cue
// template.cue

package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		// reference namespace block from resources/namespace.cue
		components: [namespace]
	}
}
```

After enabling this addon with `vela addon enable <addon-name> namespace=my-namespace`, the resulting application is:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: addon-<addon-name>
  namespace: vela-system
spec:
  components:
    - name: example-namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: my-namespace
```

> Only files declaring `package main` are loaded; use another package name to keep a file out.

We just use namespace as example here, other resources of an operator can also be defined in KubeVela application in the same way. This also gives your addon re-usability and validation capability powered by the CUE.

## Notes info (`NOTES.cue`)

The `NOTES.cue` file allows you to display dynamic notifications once the addon has been enabled, based on specified parameters.

For example, you can write the `NOTES.cue` as shown below:

```cue
info: string

if !parameter.pluginOnly {
	info: """
		By default, the backstage app is strictly serving in the domain `127.0.0.1:7007`, check it by:
		            
		    vela port-forward addon-backstage -n vela-system
		
		You can build your own backstage app if you want to use it in other domains. 
		"""
}
if parameter.pluginOnly {
	info: "You can use the endpoint of 'backstage-plugin-vela' in your own backstage app by configuring the 'vela.host', refer to example https://github.com/wonderflow/vela-backstage-demo."
}
notes: (info)
```

and `parameter.cue` as shown below:

```cue
parameter: {
	pluginOnly: *false | bool
}
```

When you enable the addon using the CLI, the information displayed in your console will vary depending on the specified parameter. For example, running the command:

```shell
$ vela addon enable experimental/backstage
```

Once the addon has been enabled, you will see the following notice::

```text
By default, the backstage app is strictly serving in the domain `127.0.0.1:7007`, check it by:
		            
		vela port-forward addon-backstage -n vela-system
		
You can build your own backstage app if you want to use it in other domains. 
```

If you enable the addon with `vela addon enable experimental/backstage pluginOnly=true`, you will see this information:

```text
You can use the endpoint of 'backstage-plugin-vela' in your own backstage app by configuring the 'vela.host', refer to example https://github.com/wonderflow/vela-backstage-demo.
```

This example is from the backstage addon, you can find more information by visiting this [link](https://github.com/kubevela/catalog/tree/master/experimental/addons/backstage).

## Features

This section will introduce the way of writing application description file to implement several core features of addon.

### Determine which clusters to be installed by parameters

If you want the resources in the addon to be installed not only in the control-plane, but also in managed clusters, you can use the topology policy in your application as shown below. The parameter `clusters` field will be filled when the addon is enabled with the `clusters` parameter specified.

```cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		components:{...}
		policies: [{
			type: "topology"
			name: "deploy-topology"
			properties: {
				if parameter.clusters != _|_ {
					clusters: parameter.clusters
				}
				if parameter.clusters == _|_ {
					clusterLabelSelector: {}
				}
			}
		}]
	}}
```

If you execute the command to enable the addon as follows:

```shell
$ vela addon enable <addon-name> --clusters=local,cluster1
```
or:
```shell
$ vela addon enable <addon-name> clusters="{local,cluster1}"
```

The rendering result will be:

```yaml
kind: Application
metadata:
  name: addon-example
  namespace: vela-system
spec:
  components: ...
  policies:
    - type: "topology"
      name: "deploy-topology"
      properties:
        clusters:
          - local
          - cluster1
```

After enabling the addon, the KubeVela controller will install components to the `local` and `cluster1` clusters as defined in the application's topology policy.

If you need to enable the addon in all clusters, you can enable the addon by not setting the `cluster` parameter as follows:

```shell
$ vela addon enable <addon-name>
```

The rendering result is :

```yaml
kind: Application
metadata:
  name: addon-example
  namespace: vela-system
spec:
  components: ...
  policies:
    - type: "topology"
      name: "deploy-topology"
      properties:
        clusterLabelSelector: {}
```

Since an empty (`{}`) `clusterLabelSelector` topology will choose all exist clusters as target, so the components in the application will be dispatched to all clusters including both the control-plane and the managed clusters.

### Auxiliary resources

You can also define some auxiliary resources in the `outputs` field of the `template.cue` file. These resources will only be applied to the control plane.

```cue
package main

import "encoding/json"

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		
	}
	... 
}

outputs: resourceTree: {
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: {
		name:      "resource-tree"
		namespace: "vela-system"
		labels: {
			"rules.oam.dev/resources":       "true"
			"rules.oam.dev/resource-format": "json"
		}
	}
	data: rules: json.Marshal(_rules)
}

_rules: {...}
```

In this example, we define a configmap `resourceTree` as an auxiliary resource, this configmap is actually a [resource topology rule](/docs/reference/topology-rule) . The function of this resource is to establish the relationship of CustomResources in the cluster, so that it can be displayed in the topology graph. It only needs to be applied to control-plane.

To see what renders, use the commands in [Render without installing](#render-without-installing).

### Use metadata of context to render application

In addition to dynamically rendering the application by parameters, you can also read fields defined in `metadata.yaml` for rendering. For example, you can define a `template.cue` file as follows:

```cue
output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		components: [
			{
				type: "webservice"
				name: "apiserver"
				properties: {
					image: "oamdev/vela-apiserver:" + context.metadata.version
				}
			},
		]
	}
}

```

When rendering, the fields defined in `metadata.yaml` will be put into the CUE block of `context` and rendered together with other CUE files. For example, the `metadata.yaml` is:

```yaml
...
name: velaux
version: 1.2.4
...
```

Resulting application is:

```yaml
apiVersion: core.oam.dev/v1beta1
kind:       Application
metadata:
  name: addon-example
  namespace: "vela-system"
spec:
  components:
    - name: apiserver
      type: webservice
      properties:
        image: "oamdev/vela-apiserver:1.2.4"
```

The image tag is the addon's version, used exactly as `metadata.yaml` writes it: write `version: v1.2.4` if your image tags start with `v`. The real example is [VelaUX](https://github.com/kubevela/catalog/blob/master/addons/velaux/resources/server.cue). For the other fields of `metadata.yaml`, see [metadata.yaml](addon-reference.md#metadatayaml).

When the addon is enabled, `template.cue`, `parameter.cue` and the resource files will be gathered  with the addon metadata in `metadata.yaml` to render out the resources and apply them.

### Binding the Definition to a component

If you want to bind a Definition to a component in the application, to dynamically enable the ability of one Definition, you can do it by setting `addon.oam.dev/bind-component` annotation on the Definition.

An actual example is [`fluxcd`](https://github.com/kubevela/catalog/tree/master/addons/fluxcd/definitions) addon.

ComponentDefinition `kustomize` in this addon is:

```cue
kustomize: {
	attributes: workload: type: "autodetects.core.oam.dev"
	description: "kustomize can fetching, building, updating and applying Kustomize manifests from git repo."
	type:        "component"
	annotations: {
		"addon.oam.dev/bind-component": "fluxcd-kustomize-controller"
	}
}

...
```

This Definition has an annotation `"addon.oam.dev/bind-component": "fluxcd-kustomize-controller"`, which means, bind the ComponentDefinition to `fluxcd-kustomize-controller` component.

The `template.cue` of this addon is:

```cue
package main

import "list"

//...

kustomizeController: {
	type: "webservice"
	name: "fluxcd-kustomize-controller"
	//....
}

gitOpsController: *[] | [...]

if parameter.onlyHelmComponents == false {
	gitOpsController: [kustomizeController]
}

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		//...
		components: list.Concat([[
			helmController,
			sourceController,
		], gitOpsController])
		//...
	}
}
//...
```

`list.Concat` joins the lists. Don't use `+` between lists here: addon CUE has no compatibility layer, and CUE v0.14 rejects list arithmetic.

If you enable this addon with:

```shell
vela addon enable fluxcd onlyHelmComponents=true
```

The `fluxcd-kustomize-controller` component won't be added to the application. The `kustomize` ComponentDefinitions will not be applied either.

## Write it in YAML

An addon without parameters can write its Application in YAML instead. It has the same two parts: the application template, `template.yaml`, and the YAML files in the `resources/` folder.

### Application template file (template.yaml)

`template.yaml` holds one KubeVela [Application](/docs/getting-started/core-concept), with components, policies or a workflow. For example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: velaux
  namespace: vela-system
spec:
  components:
    - name: namespace
      type: k8s-objects
      properties:
        objects:
        - apiVersion: v1
          kind: Namespace
          metadata:
            name: my-namespace
```

This Application has one `k8s-objects` component holding a Namespace. When the addon is enabled, KubeVela applies the Namespace to the clusters.

### Resource files (YAML files in `resources/` folder)

If the template grows too large, split it into files under `resources/`. Each YAML file there holds Kubernetes objects, one or more per file:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
secrets:
- name: my-secret
```

KubeVela collects every object under `resources/` into one `k8s-objects` component named `<addon name>-resources`, and adds it to the Application from the template. For an addon named `my-addon`, the rendered Application is:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: addon-my-addon
  namespace: vela-system
spec:
  components:
    # ...the components defined in template.yaml, for example:
    - name: namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: my-namespace
    # ...then one component holding the objects from resources/:
    - name: my-addon-resources
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: ServiceAccount
            metadata:
              name: my-service-account
              namespace: default
            secrets:
              - name: my-secret
```

KubeVela names the Application `addon-<addon name>`, whatever the template's `metadata.name` says.

## Examples

An example is [ingress-nginx](https://github.com/kubevela/catalog/tree/master/addons/ingress-nginx) addon. All files included in this addon are all CUE typed.

For an addon written all in YAML, see [OCM](https://github.com/kubevela/catalog/tree/master/addons/ocm-hub-control-plane).
