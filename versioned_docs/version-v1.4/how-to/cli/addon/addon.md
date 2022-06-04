---
title: Addon management
---

You can get more capabilities from KubeVela ecosystem by installing addons.

## Manage the addon via UI

Users with addon management permissions can enter the addon management page to enable or disable addons.

![addon list](https://static.kubevela.net/images/1.3/addon-list.jpg)

In the addon list, you can get the status of the addon and other info. Click the addon name could open the addon detail page, you can get the version list, definitions provided by the addon, and the readme message.

![addon detail](https://static.kubevela.net/images/1.3/addon-detail.jpg)

Select a version and deployed clusters, you can click the enable button to install this addon.

For enabled addons, if no applications to use definitions, you can click the disable button to uninstall it.

## Manage the addon via CLI

### List Addons

By default, the following command lists addons from a default addon registry (https://addons.kubevela.net) maintained by KubeVela team.

This command will show all available versions of every addon.

```shell
$ vela addon list
NAME                            REGISTRY        DESCRIPTION                                                                                             AVAILABLE-VERSIONS              STATUS          
ocm-gateway-manager-addon       KubeVela        ocm-gateway-manager-addon is the OCM addon automates the cluster-gateway apiserver.                     [1.3.2, 1.3.0, 1.1.11]          disabled        
rollout                         KubeVela        Provides basic batch publishing capability.                                                             [1.3.0, 1.2.4, 1.2.3]           disabled        
terraform-baidu                 KubeVela        Kubernetes Terraform Controller Provider for Baidu Cloud                                                [1.0.1, 1.0.0]                  disabled        
terraform-tencent               KubeVela        Kubernetes Terraform Controller Provider for Tencent Cloud                                              [1.0.1, 1.0.0]                  disabled        
model-serving                   KubeVela        Enable serving for models                                                                               [1.0.0]                         disabled        
model-training                  KubeVela        Enable training for models                                                                              [1.0.0]                         disabled        
terraform                       KubeVela        Terraform Controller is a Kubernetes Controller for Terraform.                                          [1.0.6]                         disabled        
terraform-aws                   KubeVela        Kubernetes Terraform Controller for AWS                                                                 [1.0.1, 1.0.0]                  disabled        
terraform-azure                 KubeVela        Kubernetes Terraform Controller for Azure                                                               [1.0.1, 1.0.0]                  disabled        
terraform-gcp                   KubeVela        Kubernetes Terraform Controller Provider for Google Cloud Platform                                      [1.0.1, 1.0.0]                  disabled        
dex                             KubeVela        Enable dex for login                                                                                    [0.6.5]                         disabled        
ocm-hub-control-plane           KubeVela        ocm-hub-control-plane can install OCM hub control plane to the central cluster.                         [0.6.0]                         disabled        
terraform-ucloud                KubeVela        Kubernetes Terraform Controller Provider for UCloud                                                     [1.0.1, 1.0.0]                  disabled        
fluxcd                          KubeVela        Extended workload to do continuous and progressive delivery                                             [1.1.0, 1.0.0]                  disabled
velaux                          KubeVela        KubeVela User Experience (UX). An extensible, application-oriented delivery and management Dashboard.   [v1.3.0, v1.3.0-beta.2, 1.2.4]  enabled (v1.3.0)
terraform-alibaba               KubeVela        Kubernetes Terraform Controller for Alibaba Cloud                                                       [1.0.2, 1.0.1]                  disabled    
```

### Install Addon

```
$ vela addon enable fluxcd
I0111 21:45:24.553174   89345 apply.go:106] "creating object" name="addon-fluxcd" resource="core.oam.dev/v1beta1, Kind=Application"
I0111 21:45:25.258914   89345 apply.go:106] "creating object" name="helm" resource="core.oam.dev/v1beta1, Kind=ComponentDefinition"
I0111 21:45:25.342731   89345 apply.go:106] "creating object" name="kustomize-json-patch" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0111 21:45:25.382201   89345 apply.go:106] "creating object" name="kustomize-patch" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0111 21:45:25.411723   89345 apply.go:106] "creating object" name="kustomize" resource="core.oam.dev/v1beta1, Kind=ComponentDefinition"
I0111 21:45:25.625815   89345 apply.go:106] "creating object" name="kustomize-strategy-merge" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0111 21:45:25.660129   89345 apply.go:106] "creating object" name="component-uischema-helm" resource="/v1, Kind=ConfigMap"
Addon: fluxcd enabled Successfully.
```

#### Install with specified version

You can choose one special version of this addon by add `--version` flag in this command. eg:

```shell
vela addon enable fluxcd --version=1.0.0
```

By default, this command will install this addon in all managed-clusters.You can use `--cluster` flag to choose specific clusters. eg:

```shell
vela addon enable <addon-name> --clusters={cluster1,cluster2}
```

You can view the new component or trait types added by `vela component` or `vela trait`. You can also find more details about [built-in addon docs](../../../reference/addons/overview).

### Uninstall Addon

> Please make sure this addon along with the capabilities is no longer used in any of your applications.

```
$ vela addon disable fluxcd
Successfully disable addon:fluxcd
```

### List Registry

```
$ vela addon registry list 
Name            Type    URL                        
KubeVela        helm    https://addons.kubevela.net
```

### Add Registry

```
$ vela addon registry add experimental --type=helm --endpoint=https://addons.kubevela.net/experimental/
Successfully add an addon registry experimental
```

### Delete Registry

```
$ vela addon registry delete experimental
Successfully delete an addon registry experimental
```

### Air-Gapped Installation for Addon

For some reason, if your cluster network cannot request the official addon registry you can enable an addon with a local dir. eg:

```
$ ls
README.md           fluxcd              ocm-cluster-manager terraform           terraform-alibaba   terraform-aws       terraform-azure     velaux

$ vela addon enable velaux/
Addon: velaux enabled Successfully
```

Please notice that, while a addon installing cluster maybe still need pull some images or helm charts.If your cluster cannot reach these resources please refer [docs](../../../platform-engineers/system-operation/enable-addon-offline) to do complete installation without Internet.

## Make your own addon

Refer to extension documents to learn how to [make your own addon and registry](../../../platform-engineers/addon/intro).