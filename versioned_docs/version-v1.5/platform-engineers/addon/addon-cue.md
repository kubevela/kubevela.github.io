---
title: Write application description files with CUE
---

[Make Your Own Addon](./intro) introduces the basic structure of an addon and illustrate that any Kubernetes operator to be installed of an addon should be defined in a KubeVela application. [Write application description files with YAML](./addon-yaml) explains the way using YAML define the application. If you choose to use CUE to write application description files the addon will be able to have these abilities:

* Utilize the flexible and concise syntax of the CUE language, rich built-in functions and its parameter verification capabilities, to render and deploy the application and auxiliary resources with parameters and metadata of addon.
* An addon may contain multiple Definitions and CRD Operators, they can be selectively installed according to parameters of addon.

This doc will introduce how to Write the application description file with the CUE.

Application description files contain two parts: application template files and resource files (files in the `resources/` folder).

## Application template file (template.cue)


The most important part in the application template is `output` field, which must embed a KubeVela application. As follows:

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

In this example, the name of the namespace defined in `spec.components[0].properties.objects[0]` in this application is determined by `parameter.namespace`, which means that its name will be dynamically rendered by the `namespace` parameter when the addon is enabled. If you want the created namespace to be my-namespace, you can run the following command:

```shell
$ vela addon enable <addon-name> namespace=my-namespace
```

After rendered, the resulting application is:

```yaml
kind: Application
metadata:
  name: example
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

You can refer to the [CUE basic](../cue/basic) to learn language details.

> Please notice: The name of Application in template file will be replaced by the addon name in `metadata.yaml`. The application will always have a unified name in the format of `addon-<addon_name>`.

## Parameter definition file (parameter.cue) 

In the example above, we use the parameter `namespace`  to set the name of namespace resource. Actually, We also need a parameter definition file (`parameter.cue`) to declare what parameters this addon has. For examples:

```cue
parameter: {
  //+usage=namespace to create
  namespace: string
}
```

When enabling the addon, you can set the parameters declared in the parameter definition file by appending the parameters to the command, as follows:

```shell
$ vela addon enable <addon-Name> <parameter-name-1=value> <parameter-name-1=value>
```

## Resource files (CUE files under `resources/` folder)

In case your template file is too large, you can split the entire content of the application into multiple files under the `resources/` folder.

Unlike the YAML resource file, the CUE resource file defines the CUE block that can be referenced by `template.cue`

Continuing with the example above, we split the CUE blocks that define the `namesapce` component under the `resources/` folder, the folder structure is as follows:

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

Then we can reference the two CUE block in `template.cue` :

```cue
// template.cue

package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		// reference namespace block from resources/naemspace.cue
		components: [namespace]
	}
}
```

After enabled this addon with command `$ vela addon enable <addon-name> namespace=my-namespace clusters=local,cluser1`, the resulting application is:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example
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

> Please notice: Only those CUE files with header `package main` can be reference by `template.cue`, this can be used to help you filter CUE files that you don't want to set into the rendering context.

## Features

This section will introduce the way of writing application description file to implement several core features of addon.

### Determine which clusters to be installed by parameters

If you want the resources in the addon to be installed not only in the control-plane, but also in managed clusters, you can use the topology policy in your application as shown below. The parameter `clusters` field will be filled when the addon is enabled with the `clusters` parameter specified.

```cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
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
$ vela addon enable <addon-name> clusters=local,cluser1
```

The rendering result will be:

```yaml
kind: Application
metadata:
  name: example
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
  name: example
  namespace: vela-system
spec:
  components: ...
  policies:
    - type: "topology"
      name: "deploy-topology"
      properties:
        clusterLabelSelector: {}
```

Since an empty (`{}`) `clusterLabelSelector` topology will choose all exist clusters as target, so the components in application will be dispatched to all clusters including control-plane and managed-cluster.

### Auxiliary resources

You can also define some auxiliary resources in the outputs field of the `template.cue` file. These resources will only be applied to the control plane.

```cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
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

In this example, we define a configmap `resourceTree` as an auxiliary resource, this configmap is actually a [resource topology rule](../../reference/topology-rule) . The function of this resource is to establish the relationship of CustomResources in the cluster, so that it can be displayed in the topology graph. It only needs to be applied to control-plane.

### Use metadata of context to render application

In addition to dynamically rendering the application by parameters, you can also read fields defined in `metadata.yaml` for rendering. For example, you can define a `template.cue` file as follows:

```cue
output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
	spec: {
		components: [
			{
				type: "webservice"
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
  name: example
  namespace: "vela-system"
spec:
  components:
    - type: webservice
      properties:
        image: "oamdev/vela-apiserver:v1.2.4"
```

The image tag becomes the addon's version due to the `context.metadata.version` points to. The real example is [VelaUX](https://github.com/kubevela/catalog/blob/master/addons/velaux/resources/apiserver.cue). Other available fields of metadata please refer to [metadata](./intro).

### Binding the Definition to a component

If you want to bind a Definition to a component in the application, to achieve dynamically enable the ability of one X-definition, you can do it by setting `addon.oam.dev/bind-component` annotation on the definition.

An actual example is [`fluxcd`](https://github.com/kubevela/catalog/tree/master/addons/fluxcd/definitions) addon.

ComponentDefinition `kustomize` in this addon is:

```cue
kustomize: {
	attributes: workload: type: "autodetects.core.oam.dev"
	description: "kustomize can fetching, building, updating and applying Kustomize manifests from git repo."
	type:        "component"
	annotations: {
		 "addon.oam.dev/ignore-without-component": "fluxcd-kustomize-controller"
   }
}

...
```

This Definition has an annotation `"addon.oam.dev/bind-component": "fluxcd-kustomize-controller"`, which means, bind the ComponentDefinition to `fluxcd-kustomize-controller` component.

The `template.cue` of this addon is:

```cue
//...

kustomizeController: {
	type: "webService"
	Name: "fluxcd-kustomize-controller",
	//....
}

gitOpsController: [...]

if parameter.onlyHelmComponents == false {
	gitOpsController: [kustomizeController]
}

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	spec: {
		//...
		components: [
			helmController,
			sourceController,
		] + gitOpsController
		//...
	}
}
//...
```

If you enable this addon by following command:

```shell
$ vela addon enable fluxcd `onlyHelmComponents=true`
```

The `fluxcd-kustomize-controller` component won't be added to the application. The `kustomize` ComponentDefinitions will not be applied either.


## Examples

An example is [ingress-nginx](https://github.com/kubevela/catalog/tree/master/addons/ingress-nginx) addon. All files included in this addon are all CUE typed.

