---
title: 安装插件包
---

你可以通过安装 KubeVela 的插件包（Addon）获取更多的系统功能。

## 查看所有插件包

KubeVela 官方团队维护了一个默认的插件包仓库 (https://addons.kubevela.net)，默认情况下会从这个仓库实时发现.


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

## 安装插件包

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

安装完成后，插件包中的功能会以组件，运维特征，工作流步骤等形式呈现，你可以通过 `vela component`，`vela trait` 等命令查看新增的能力，也可以在[插件包的参考文档](../../../reference/addons/overview)中查看每个官方插件包对应的能力.

## 删除/卸载已安装的插件包

> 删除前请确认插件包对应的能力没有被任何应用使用。

```
$ vela addon disable fluxcd
Successfully disable addon:fluxcd
```

## 查看插件包的下载仓库

```
$ vela addon registry list 
Name            Type    URL                        
KubeVela        OSS     https://addons.kubevela.net
```

KubeVela 社区在 Github 上维护了一个官方的[正式插件包仓库](https://github.com/oam-dev/catalog/tree/master/addons) 和一个[试验阶段插件包仓库](https://github.com/oam-dev/catalog/tree/master/experimental) 。你在相应的仓库中找到插件包的定义文件。

同时这些文件会被同步到 [对象存储](https://addons.kubevela.net) 当中，以加快下载速度。

## 添加插件包仓库

你可以添加自己的插件包仓库，目前支持 OSS 和 Github 两种仓库类型。

```
$ vela addon registry add experimental --type OSS --endpoint=https://addons.kubevela.net --path=experimental/
Successfully add an addon registry experimental
```

## 删除一个插件包仓库

```
$ vela addon registry delete experimental
Successfully delete an addon registry experimental
```

## 多集群环境中启用插件包

如果你的环境中添加了若干个子集群，启用插件包时会默认在管控集群和所有子集群中安装此插件包。但如果子集群在某个插件包启用之后加入环境当中，则需要通过升级操作在新加入集群中安装此插件包。如下所示

```
$ vela addon upgrade velaux
Addon: 
 enabled Successfully
```

## 离线安装插件包

如果因为某些原因，你的环境无法通过访问插件包仓库，你可以通过指定本地的插件包目录来进行离线安装。如下所示：

```
$ ls
README.md           fluxcd              ocm-cluster-manager terraform           terraform-alibaba   terraform-aws       terraform-azure     velaux

$ vela addon enable velaux/
Addon: velaux enabled Successfully
```

## 编写自己的插件包

请参考[插件包制作文档](../../../platform-engineers/addon/intro)。