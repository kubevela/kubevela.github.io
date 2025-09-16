---
title:  Needs More Capabilities？
---

KubeVela is programmable, it can be extended easily with [definition](../../getting-started/definition.md). You have the following ways to discover and extend the platform.

## Learn more built-in capabilities

There're many out-of-box capabilities installed along with KubeVela controller, refer to the following links to learn more details:

  - [Built-in Component Reference](./references.md)
  - [Built-in Trait Reference](../traits/references.md)
  - [Built-in Policy Reference](../policies/references.md)
  - [Built-in Workflow Step Reference](../workflow/built-in-workflow-defs.md)

## Extend by Managing Addons

Installing addon from the community is also one of the most important way to discover more capabilities.

### List Addons

KubeVela community has maintained a growing [catalog of addons](https://github.com/kubevela/catalog) which will be synced to the default addon registry (https://addons.kubevela.net). You can use vela command line to list all available addons by:

```shell
vela addon list
```

<details>
<summary>The command will show the basic addon info along with all available versions and installed versions.</summary>

```console
NAME                            REGISTRY        DESCRIPTION                                                                                             AVAILABLE-VERSIONS              STATUS          
rollout                         KubeVela        Provides basic batch publishing capability.                                                             [1.3.0, 1.2.4, 1.2.3]           disabled        
terraform                       KubeVela        Terraform Controller is a Kubernetes Controller for Terraform.                                          [1.0.6]                         disabled        
terraform-aws                   KubeVela        Kubernetes Terraform Controller for AWS                                                                 [1.0.1, 1.0.0]                  disabled        
dex                             KubeVela        Enable dex for login                                                                                    [0.6.5]                         disabled        
fluxcd                          KubeVela        Extended workload to do continuous and progressive delivery                                             [1.1.0, 1.0.0]                  disabled
velaux                          KubeVela        KubeVela User Experience (UX). An extensible, application-oriented delivery and management Dashboard.   [v1.3.0, v1.3.0-beta.2, 1.2.4]  enabled (v1.3.0)
terraform-alibaba               KubeVela        Kubernetes Terraform Controller for Alibaba Cloud                                                       [1.0.2, 1.0.1]                  disabled    
...snip...
```
</details>

* You can refer to [addon reference docs](../../reference/addons/overview.md) for more details of these community certificated addons.

### Install Addon

#### Install with CLI

The simplest command for installing one addon is:

```shell
vela addon enable fluxcd
```

<details>
<summary>The expected output.</summary>

```console
I0111 21:45:24.553174   89345 apply.go:106] "creating object" name="addon-fluxcd" resource="core.oam.dev/v1beta1, Kind=Application"
I0111 21:45:25.258914   89345 apply.go:106] "creating object" name="helm" resource="core.oam.dev/v1beta1, Kind=ComponentDefinition"
I0111 21:45:25.342731   89345 apply.go:106] "creating object" name="kustomize-json-patch" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0111 21:45:25.382201   89345 apply.go:106] "creating object" name="kustomize-patch" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0111 21:45:25.411723   89345 apply.go:106] "creating object" name="kustomize" resource="core.oam.dev/v1beta1, Kind=ComponentDefinition"
I0111 21:45:25.625815   89345 apply.go:106] "creating object" name="kustomize-strategy-merge" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0111 21:45:25.660129   89345 apply.go:106] "creating object" name="component-uischema-helm" resource="/v1, Kind=ConfigMap"
Addon: fluxcd enabled Successfully.
```
</details>

You can also install addons with some advanced flags.

#### Install addon with specified version

* Choose one specific version by adding `--version` flag in this command. e.g:

```shell
vela addon enable fluxcd --version=1.0.0
```

* Choose specific clusters for installation. You can use `--cluster` flag to choose specific clusters. e.g:

```shell
vela addon enable <addon-name> --clusters={cluster1,cluster2}
```

By default, the place for installation is specified as control plane cluster or managed cluster inside the metadata of addon. 

* Some addons support setting parts of parameter while enabling. For example `velaux` addon supports change image repository by setting `repo` parameter, then you can change the repo address to your own. e.g:

```shell
vela addon enable velaux repo=<your repo address>
```

#### Air-Gapped Installation for Addon

If your cluster network cannot connect to the community addon registry you can: 
- build your custom addon registry. Please refer to [*Build your Own Registry*](../../platform-engineers/addon/addon-registry.md) for details.
- enable an addon from a local directory. Example:

```shell
$ tree velaux -L 1
velaux
├── metadata.yaml
├── readme_cn.md
├── readme.md
├── resources
├── schemas
└── template.yaml

2 directories, 4 files
```

* Enable the addon from local directory.

```
vela addon enable ./velaux
```

<details>
<summary>expected output</summary>

```
Addon: velaux enabled successfully
```
</details>

:::caution
Please notice that, while an addon is being installed in a cluster, it maybe still need pull some images or Helm Charts. If your cluster cannot reach these resources please refer [docs](../../platform-engineers/system-operation/enable-addon-offline.md) to complete installation without Internet access.
:::

#### Install addon with UI Console

If you have installed [VelaUX](../../reference/addons/velaux.md) which is also one of the addon, you can manage it directly on the UI console with admin privileges.

![addon list](https://kubevela.io/images/1.3/addon-list.jpg)

In the addon list, you can get the status of the addon and other info. Click the addon name could open the addon detail page, you can get the version list, definitions provided by the addon, and the readme message.

![addon detail](https://kubevela.io/images/1.3/addon-detail.jpg)

Select a version and deployed clusters, you can click the enable button to install this addon. You can check detail information in this section include:

- Definitions: The extension capabilities provided by the addon may include component, trait, etc.
- README: Addon description, explain the capabilities and related information.

#### Install addon by kubectl

When you want to deploy addon in the format of YAML or using `kubectl` instead of using vela CLI, you can render the yaml out by:

```shell
vela addon enable velaux --dry-run
```


<details>
<summary>expected output</summary>

```
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  creationTimestamp: null
  labels:
    addons.oam.dev/name: velaux
    addons.oam.dev/registry: KubeVela
    addons.oam.dev/version: v1.5.8
  name: addon-velaux
  namespace: vela-system
spec:
  components:
  - name: apiserver
    properties:
      cmd:
      - apiserver
      - --datastore-type=kubeapi
      image: oamdev/vela-apiserver:v1.5.8
      ports:
      - expose: true
        port: 8000
        protocol: TCP
    traits:
    - properties:
        name: kubevela-vela-core
      type: service-account
    - properties:
        replicas: 1
      type: scaler
    type: webservice
  - dependsOn:
    - apiserver
    name: velaux
    properties:
      env:
      - name: KUBEVELA_API_URL
        value: apiserver.vela-system:8000
      exposeType: ClusterIP
      image: oamdev/velaux:v1.5.8
      ports:
      - expose: true
        port: 80
        protocol: TCP
    traits:
    - properties:
        replicas: 1
      type: scaler
    type: webservice
status: {}

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"selector","sort":100,"uiType":"ComponentSelect"},{"jsonKey":"components","sort":101,"uiType":"ComponentPatches"}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: policy-uischema-override
  namespace: vela-system

... snip ...

```
</details>

You can install the addon by one command like:

```
vela addon enable velaux --dry-run | kubectl apply -f -
```

:::caution
Use dry-run can render YAML results and you will also lose the validation such as vela-core version check, dependency, etc. Make sure the version you used can match to your Kubernetes clusters.
:::

### Get addon info

If you want to check the detail status of an addon, or get more available parameters and other useful info of an addon, you can use command `addon status`. For example:

```shell
vela addon enable velaux --verbose
```

<details>
<summary>expected output</summary>

```shell
velaux: disabled 
KubeVela User Experience (UX). An extensible, application-oriented delivery and management Dashboard.
==> Registry Name
KubeVela
==> Available Versions
[v1.4.3, v1.4.2, v1.4.0, v1.4.0-beta.2, v1.3.6, v1.3.4, v1.3.3, v1.3.2, ...]
==> Dependencies ✔
[]
==> Parameters
-> dbType: Specify the database type, current support KubeAPI(default) and MongoDB.
        default: "kubeapi"
        required: ✔
-> dbURL: Specify the MongoDB URL. it only enabled where DB type is MongoDB.
-> gatewayDriver: Specify the gateway type.
        default: "nginx"
        required: ✔
-> imagePullSecrets: Specify the names of imagePullSecret for private image registry, eg. "{a,b,c}"
-> serviceType: Specify the service type.
        default: "ClusterIP"
        required: ✔
-> database: Specify the database name, for the kubeapi db type, it represents namespace.
-> dex: Specify whether to enable the dex
        default: "false"
        required: ✔
-> domain: Specify the domain, if set, ingress will be created if the gateway driver is nginx.
-> repo: Specify the image hub of velaux, eg. "acr.kubevela.net"
-> serviceAccountName: Specify the serviceAccountName for apiserver
        default: "kubevela-vela-core"
        required: ✔
```
</details>

As above shows, these infos contain the available parameters, available versions, dependent addons and description of and addon.

### Discover the capabilities installed

:::tip
Once addon installed, end user can discover and use these capabilities immediately.
:::

* Generally, end user can list the new component or trait types added by `vela component` or `vela trait`. Refer to [Lifecycle of a Definition](../../getting-started/definition.md#lifecycle-of-a-definition) for more usage details.

* You can also check the capability details of [community addon docs](../../reference/addons/overview.md).

### Uninstall Addon

:::danger
Please make sure the addon along with its capabilities is no longer used in any of your applications before uninstalling it.
:::

```shell
vela addon disable fluxcd
```

<details>
<summary>expected output</summary>

```shell
Successfully disable addon:fluxcd
```
</details>

### Manage Addon Registry

You can also manage the addon registries, such as adding/deleting your private addon registry.
Let's take the experimental community registry as example.

* List your current registries

```
vela addon registry list 
```

<details>
<summary>expected output</summary>

```shell
Name            Type    URL                        
KubeVela        helm    https://addons.kubevela.net
```
</details>

* Add a new registry

```
vela addon registry add experimental --type=helm --endpoint=https://addons.kubevela.net/experimental/
```

<details>
<summary>expected output</summary>

```
Successfully add an addon registry experimental
```
</details>

* Delete one registry

```
vela addon registry delete experimental
```

<details>
<summary>expected output</summary>

```
Successfully delete an addon registry experimental
```
</details>

* Build custom registry

  You can use ChartMuseum to build your custom addon registry. We have a ChartMuseum addon available. Please refer to [*Build your Own Registry*](../../platform-engineers/addon/addon-registry.md) for details.

### Make your own addon

If you're a system infra or operator, you can refer to extension documents to learn how to [make your own addon and registry](../../platform-engineers/addon/intro.md), including [extend cloud resources by addon](../../platform-engineers/addon/terraform.md).

:::tip
Here's a blog introduces [how to build addon from scratch using redis operator as example](/blog/2022/10/18/building-addon-introduction), you can read it as an end to end tutorial!
:::


## Extend KubeVela as a Developer

If you're extremely interested in KubeVela, you can also extend more features as a developer.

- KubeVela use CUE as it's core engine, [learn Manage Definition with CUE](../../platform-engineers/cue/basic.md) and try to extend capabilities with definitions.
- Read the [developer guide](../../contributor/overview.md) to learn how to contribute and extend capabilities for KubeVela.

Welcome to join the KubeVela community! We're eager to see you to contribute your extension.
