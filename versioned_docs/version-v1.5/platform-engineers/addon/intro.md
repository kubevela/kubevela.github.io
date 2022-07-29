---
title: Build Your Own Addon
---

An KubeVela addon is actually a series of files. After the addon enabled, some of them will be rendered out as a KubeVela application and be applied to control-plane. Others such as X-definitions and UI-schemas those are enhancement for KubeVela will be applied to contol-plane too.

The picture below shows what KubeVela does when an addon is enabled. There are mainly three process:
* [Addon Registry](./addon-registry) store addons which can be used to share and distribute addons anywhere, it can be any git repo, OSS bucket or OCI registry.
* When an addon is enabled through UX/CLI, it will pull these resource files from the Addon Registry, render them and create a KubeVela application.
* Finally, the KubeVela controller take care the rest things and deliver the addon as a normal application into control plane or multi-clusters.

![alt](../../resources/addon-mechanism.jpg)

## Build an addon

To build an addon, you should follow some basic rules as follows.

You need to create an addon directory to place addon resource files. Won't bother to create? `vela addon init` command will create a basic structure for you (vela CLI v1.5 or later). Please refer to `vela addon init -h` for details. For quick starts, we will just use `vela addon init your-addon-name` now.

Typically, the directory hierarchy looks like below:

```shell
├── resources/
│   ├── xxx.cue
│   └── xxx.yaml
├── definitions/
├── schemas/
├── README.md
├── metadata.yaml
├── parameter.cue
└── template.yaml(or template.cue)
```

Not all of these directories or files are necessary, let's explain them one by one.

### metadata.yaml(Required)

A `metadata.yaml` describes the basic information of an addon, such as the name, version, description, etc. With this basic info, an addon can be recognized by UX/CLI, an example likes:

```yaml
name: example
version: 1.0.0
description: Example adddon.
icon: xxx
url: xxx

tags:
  - only_example

deployTo:
  runtimeCluster: false

dependencies:
- name: addon_name

system:
  vela: ">=v1.4.0"
  kubernetes: ">=1.19.0-0"

needNamespace:
  - flux-system

invisible: false
```

Here's the usage of every field:

| Field | Required  | Type | Usage  |
|:----:|:---:|:--:|:------:|
|  name    |  yes | string | The name of the addon.  |
|  version    | yes  | string | The version of addon, increase for every changes and follow [SemVer](https://semver.org/) rule.  |
| description     | yes  | string | Description of the addon.  |
| icon     | no  | string | Icon of the addon, will display in addon dashboard.  |
| url     | no  | string | The official website of the project behind the addon.  |
| tags     | no  | []string | The tags to display and organize the addon.  |
| dependencies     | no  | []{ name: string } | Names of other addons it depends on. KubeVela will make sure these dependencies are enabled before installing this addon.  |
| system.vela     | no  | string | Required version of vela controller, vela CLI will block the installation if vela controller can't match the requirements.  |
| system.kubernetes     | no  | string | Required version of Kubernetes, vela CLI will block the installation if Kubernetes cluster can't match the requirements.  |
| needNamespace     | no  | []string | Vela will create these namespaces needed for addon in every clusters before installation.  |
| invisible     | no  | bool | If `true`, the addon won't be discovered by users. It's useful for tests when addon is in draft state. |
| deployTo.runtimeCluster     | no  | bool | By default, the addon will not be installed in the managed clusters. If it's `true`, it will be delivered to all managed clusters automatically. (This filed will only take effect when template is CUE file) |

### README.md (Required)

The README of this addon, it will be displayed in the dashboard for end user who's going to install this addon. So you should let them understand the basic knowledge of the addon which contains:

* What is the addon?
* Why to use this addon? The use case and scenarios.
* How to use this addon? It is the `end user` who should understand. An end to end demo is recommended.
* What will be installed? The definitions along with the CRD controllers behind.

There're no restrict rules for an [experimental addon](https://github.com/kubevela/catalog/tree/master/experimental/addons), but if the addon want to be [verified](https://github.com/kubevela/catalog/tree/master/addons), the README is the most important thing.

### template file (Optional)

As mentioned above, the most import part of an addon is an application, it can help you to install any resources to multi clusters. You can choose to write a `template.yaml` or `template.cue` file to define the application base framework, that's determine if you want to change some contents when enable an addon by parameters.

>Please notice: You can only choose one of `template.cue` or `template.yaml`, otherwise will report an error when enable the addon.

#### template.yaml

If you don't want change the application framework while enabling, a simple `template.yaml` is enough. For example:

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

In this application, we declare a namespace resources in `k8s-objects` component, KubeVela application controller will help to dispatch it to any clusters as you want. Beside of this, you also can define workflows or policies in this file, but as the same they cannot be changed with parameters.

#### template.cue

If you want to change some fields by parameters you can choose to define the application framework by `template.cue` file. For example:

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
		components: [
			{
				type: "k8s-objects"
				name: parameter.name + "-ns"
				properties: objects: [{
					apiVersion: "v1"
					kind:       "Namespace"
					metadata: name: parameter.namespace
				}]
			},
		]
	}}
```

As we can see, this cue file mainly contain a `ouput` block. The `output` block must be a KubeVela application which can contain components, policies, or workflow. Meanwhile, this cue file must have a `package main` header.
In this example, we also define a namespace in `k8s-objects` component, but unlike the example of `template.yaml`, we want to change the namespace name by input parameters while enabling. If you want the created namespace is `my-namespace` you can execute this command:

```shell
$ vela addon enable <addon-name> namespace=my-namespace
```

After rendered, the applied application is:

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

> Please notice: The name of Application in template file will be replaced by the addon name in `metadata.yaml`. The addon application will always have a unified name in the format of `addon-<addon_name>`.

If you don't want to write all cue things in one `template.cue` (which will cause this file is very huge), you can choose to split some of them to several separated files under `/resources` dir, later section will tell you all the details.

##### Auxiliary resources

You also can define some auxiliary resources in `template.cue` in`outputs` CUE block. These resources will applied to control-plane directly. For example:

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

In this example, we declare a configmap `resourceTree` as auxiliary resource, this configmap is a [resource topology rule](../../reference/topology-rule) which only need to be applied to control-plane for enhancing KubeVela.

##### Install to which clusters according to parameters:

In some case, you may want an addon not only installed in control plane cluster but also managed cluster, and want let end-user determine which clusters should be installed while enabling, you can write `template.cue` like this:

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

In this example, we leverage the capability of [topology policy](../../end-user/policies/references) to implement deploy resource to managed clusters. If you execute command like below, resources will only be deployed to `local` cluster and `cluster1` cluster.

```shell
$ vela addon enable <addon-name> clusters=local,cluser1
```

The render result will be:

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

Since an empty `clusterLabelSelector` topology will choose all exist clusters as target clusters, you can just enable the addon without `clsuters` parameter:

```shell
$ vela addon enable <addon-name>
```

The render result is :

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

#### Examples

Here are some existing addons made by community.

* [OCM control plane](https://github.com/kubevela/catalog/blob/master/addons/ocm-hub-control-plane/template.yaml), this addon needn't change any fields while enabling and can only be installed control plane, so it just uses `template.yaml`.
* [ingress-nginx](https://github.com/kubevela/catalog/tree/master/addons/ingress-nginx), is the example install managed clusters and can change some fields by parameters.

### parameter.cue (Optional)

As last section said, `parameter` can help you to change some contents while enabling. File `parameter.cue` is used to declare those parameters. A `parameter.cue` for above example is:

```cue
parameter: {		
  //+usage=clsuters install to
  clsuters: [...string]
  //+usage=namespace to create
  namespace: string
}
```

### `resources/` directory (Optional)

As we can see, although you can write every thing about an application in  one `temaplte.cue` or `template.yaml` file, this will cause to a very huge file. So you can split them to `resources` directory. File type in this dir can be YAML or CUE.

#### YAML resources

The YAML format files must be Kubernetes YAML object, you can define any object one by one in a file. It will be directly added to the application as a `K8s-object` type component during rendering. For example:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
secrets:
- name: my-secret
```

In this example, we define a service account resource. After rendered the addon application will be:

```yaml
kind: Application
metadata:
  name: example
  namespace: vela-system
spec:
  components:
    -
    #   ...
    #   other contents defined in template file
    #   ...
    - name: namespace
      type: k8s-objects
      components:
        objects:
        -  apiVersion: v1
           kind: ServiceAccount
           metadata:
            name: my-service-account
            namespace: default
            secrets:
            - name: my-secret
```

After enable the addon, the service account will be dispatched to any cluster by application.

An actual example is the [OCM](https://github.com/kubevela/catalog/tree/master/addons/ocm-hub-control-plane) addon which defines all it's resources in the addon. All these YAML objects will be rendered as components in an Application.

#### CUE resources

As previous section said, you can split some CUE files to `resoures/` dir for rendering application to avoid template file become too large. All of them will be gathered  with `template.cue` in a same render context to generate the final application. 

Continue using the example above, we can separate the topology policy CUE block to a single file and referenced by `template.cue`. File `policy.cue` in `resources/` dir is:

```cue
// resources/policy.cue
package main

topology: {
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
}
```

This file defines a CUE block `topology` which represent a topology policy, then you can reference it in `template.cue` like this:

```cue
// template.cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
	spec: {
		policies: [topology]
	}}
```

After enabled with command `$ vela addon enable <addon-name> clusters=local,cluser1`, the application is:

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

> Please notice: Only those CUE files with header `package main` will gathered in one rendering context.

So as we can see, compare with YAML resource file, CUE resources file also has a big advantage: changing some contents by parameters.

You can refer to the [CUE basic](../cue/basic) to learn language details.

#### Use metadata of context 

Besides using `parameter` to generate content dynamically, you also can use `context` to  render runtime variable.
For example, you can define the component with cue like this:
```cue
apiserver: {
	type: "webservice"
	properties: {
		image: "oamdev/vela-apiserver:" + context.metadata.version
		....
    }
}
```

And the `metadata.yaml` is:
```yaml
...
name: velaux
version: 1.2.4
...
```

Reference `apiserver` block in `template.cue`: 

```cue
// template.cue
package main

output: {
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	metadata: {
		name:      "example"
		namespace: "vela-system"
	}
	spec: {
		components: [apiserver]
	}}
```

The render result will be:
```yaml
kind: Application
... 
# application header in template
spec:
  components:
  - type: webservice
    properties:
    	image: "oamdev/vela-apiserver:v1.2.4"
```

The image tag becomes the addon's version due to the `context.metadata.version` points to. The real example is [VelaUX](https://github.com/kubevela/catalog/blob/master/addons/velaux/resources/apiserver.cue).
Other available fields please refer to [metadata](#metadata.yaml(Required)).

UX/CLI renders all CUE files , `parameter.cue`, `template.cue`, and data defined in `metadata.yaml` in one context when the addon is enabled.

### `definitions/` directory(Optional)

You can create a definition's file directory under the Addon Registry to store template definition files such as component definitions, trait definitions, and workflowStep definitions. It should be noted that since the KubeVela controller is usually not installed in the managed cluster, even if the addon is enabled by setting the `deployTo.runtimeCluster` field in the metadata file (metadata.yaml) to install the addon in the managed-clusters, the definition file will not be distributed to managed-clusters.

These definitions can be YAML files those are ComponentDefinition Kubernetes custom resources or CUE files of [vela def file](../../getting-started/definition#customize).

In some cases, you may want a definition's installation binding to a controller which is defined by a KubeVela application component. If the component is disabled by end-user's input parameter, do not apply the definition either. You can use the `addon.oam.dev/bind-component` annotation.

An actual example is [`fluxcd`](https://github.com/kubevela/catalog/tree/master/addons/fluxcd/definitions) addon. 

Component definition `kustomize` has an annotation `"addon.oam.dev/bind-component": "fluxcd-kustomize-controller"`, if end-user enable this addon by `onlyHelmComponents=true` to disable the `fluxcd-kustomize-controller` component. This definition won't be applied to control-plane either.

### `schemas/` directory(Optional)

The schemas directory is used to store the [UI schema](../../reference/ui-schema) files corresponding to `Definitions`, which is used to enhance the display effect when displaying the parameters required by `Definitions` in UX.

The above is a complete introduction to how to make an addon, you can find the complete description of the above-mentioned addon in this [catalog](https://github.com/kubevela/catalog/tree/master/experimental/addons/example) example.

In addition to uploading the addon resource files to your addon repository, you can also submit a pull request to KubeVela [community addon repository](https://github.com/kubevela/catalog/tree/master/addons) and [experimental addon repository](https://github.com/kubevela/catalog/tree/master/experimental/addons) to addon new addons. After pr merged your addons can be discovered and used by other KubeVela users.

## Install Addon Locally

You can install addon from local to debug your own addon:

```
vela addon enable ./your-addon-dir/
```

## Known Limits

- Cannot only install addon in the sub-clusters. Because of KubeVela need render out every kind of resource in control plane, if an addon contain some [CRD](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/), these CRD must be installed in control plane, otherwise Vela-core controller will meet an error of cannot find CRD.

## Extend Terraform Addon

*  We have built some tools to extend cloud resource as addons  for convenience, you can refer to the [extend terraform addon docs](./terraform).

## Contribution

If you have developed your own addons, welcome to contribute to the [community catalog](https://github.com/kubevela/catalog). 

Meanwhile, any bugfix of existing addons are welcomed. Just make a pull request to [this](https://github.com/kubevela/catalog) repo.