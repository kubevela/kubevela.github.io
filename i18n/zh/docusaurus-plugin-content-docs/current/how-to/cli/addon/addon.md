---
title: 安装扩展包
---

你可以通过安装 KubeVela 的扩展包（Addon）获取更多的系统功能。

## 查看所有扩展包

KubeVela 官方团队维护了一个默认的扩展包仓库 (https://addons.kubevela.net)，默认情况下会从这个仓库实时发现.


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

## 安装扩展包

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

安装完成后，扩展包中的功能会以组件，运维特征，工作流步骤等形式呈现，你可以通过 `vela component`，`vela trait` 等命令查看新增的能力，也可以在[扩展包的参考文档](../../../reference/addon/overview)中查看每个官方扩展包对应的能力.

## 删除/卸载已安装的扩展包

> 删除前请确认扩展包对应的能力没有被任何应用使用。

```
$ vela addon disable fluxcd
Successfully disable addon:fluxcd
```

## 查看扩展包的下载仓库

```
$ vela addon registry list 
Name            Type    URL                        
KubeVela        OSS     https://addons.kubevela.net
```

## 添加扩展包仓库

你可以添加自己的扩展包仓库，目前支持 OSS 和 Github 两种仓库类型。

```
$ vela addon registry add experimental --type OSS --endpoint=https://addons.kubevela.net --path=experimental/
Successfully add an addon registry experimental
```

## 删除一个扩展包仓库

```
$ vela addon registry delete experimental
Successfully delete an addon registry experimental
```