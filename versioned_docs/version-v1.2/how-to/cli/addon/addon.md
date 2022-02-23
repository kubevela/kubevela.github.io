---
title: Install Addon
---

You can get more capabilities from KubeVela ecosystem by installing addons.

## List Addons

By default, the following command lists addons from a default addon registry (https://addons.kubevela.net) maintained by KubeVela team.


```shell
$ vela addon list
terraform               Terraform Controller is a Kubernetes Controller for Terraform.                                                                          disabled
velaux                  The KubeVela User Experience (UX ). Dashboard Designed as an extensible, application-oriented delivery and management control panel.    disabled
ocm-cluster-manager     ocm-cluster-manager can deploy an OCM hub cluster environment.                                                                          disabled
fluxcd                  Extended workload to do continuous and progressive delivery                                                                             disabled
terraform-aws           Kubernetes Terraform Controller for AWS                                                                                                 disabled
observability           An out of the box solution for KubeVela observability                                                                                   disabled
terraform-alibaba       Kubernetes Terraform Controller for Alibaba Cloud                                                                                       disabled
terraform-azure         Kubernetes Terraform Controller for Azure                                                                                               disabled
```

## Install Addon

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

You can view the new component or trait types added by `vela component` or `vela trait`. You can also find more details about [built-in addon docs](../../../reference/addons/overview).

## Uninstall Addon

> Please make sure this addon along with the capabilities is no longer used in any of your applications.

```
$ vela addon disable fluxcd
Successfully disable addon:fluxcd
```

## List Registry

```
$ vela addon registry list 
Name            Type    URL                        
KubeVela        OSS     https://addons.kubevela.net
```

## Add Registry

```
$ vela addon registry add experimental --type OSS --endpoint=https://addons.kubevela.net --path=experimental/
Successfully add an addon registry experimental
```

## Delete Registry

```
$ vela addon registry delete experimental
Successfully delete an addon registry experimental
```


## Enable Addon offline

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