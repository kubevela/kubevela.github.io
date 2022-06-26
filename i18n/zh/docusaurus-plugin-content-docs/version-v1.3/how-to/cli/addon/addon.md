---
title: 插件管理
slug: /how-to/cli/addon/addon
---

你可以通过安装 KubeVela 的插件（Addon）获取更多的系统功能。

## 通过 UI 管理插件

具有插件管理权限的用户可以进入插件管理页面，进行插件启用/停用等操作。

![addon list](https://static.kubevela.net/images/1.3/addon-list.jpg)

如上图所示，在插件列表中，你可以查看到插件启用状态和其他基础信息。点击插件名称可以进入到插件详情页面，你可以查询到插件的版本列表，提供的扩展类型和介绍信息。

![addon detail](https://static.kubevela.net/images/1.3/addon-detail.jpg)

选择一个部署版本（默认为最新），设置需要部署的集群后，你可以点击 启用 按钮安装该插件。对于已启用的插件，如果没有应用使用该插件提供的扩展，你可以点击禁用按钮来卸载它。

## 通过 CLI 管理插件

### 查看所有插件

KubeVela 官方团队维护了一个默认的插件仓库 (https://addons.kubevela.net) ，默认情况下会从这个仓库实时发现。


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

### 安装插件

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

#### 安装特定版本的插件

你可以通过通过设置 `--version` 启动参数，来指定安装插件的某个特定版本。例如：

```shell
vela addon enable fluxcd --version=1.0.0
```

如果不指定该参数，默认会安装此插件的最新版本。

启用一个插件时，默认会在所有子集群中安装该插件，你也可以通过设置 `--cluster` 启动参数选择安装在某些集群当中。例如：

```shell
vela addon enable <addon-name> --clusters={cluster1,cluster2}
```

安装完成后，插件中的功能会以组件，运维特征，工作流步骤等形式呈现，你可以通过 `vela component`，`vela trait` 等命令查看新增的能力，也可以在[插件的参考文档](../../../reference/addons/overview)中查看每个官方插件对应的能力.

### 删除/卸载已安装的插件

> 删除前请确认插件对应的能力没有被任何应用使用。

```
$ vela addon disable fluxcd
Successfully disable addon:fluxcd
```

### 查看插件的下载仓库

```
$ vela addon registry list 
Name            Type    URL                        
KubeVela        helm    https://addons.kubevela.net
```

KubeVela 社区在 Github 上维护了一个官方的[正式插件包仓库](https://github.com/kubevela/catalog/tree/master/addons) 和一个[试验阶段插件包仓库](https://github.com/kubevela/catalog/tree/master/experimental) 。你在相应的仓库中找到插件包的定义文件。

同时这些文件会被同步到 [对象存储](https://addons.kubevela.net) 当中，以加快下载速度。

### 添加插件包仓库

你可以添加自己的插件包仓库，目前支持 OSS 和 Github 两种仓库类型。

```
$ vela addon registry add experimental --type OSS --endpoint=https://addons.kubevela.net --path=experimental/
Successfully add an addon registry experimental
```

### 删除一个插件包仓库

```
$ vela addon registry delete experimental
Successfully delete an addon registry experimental
```

### 多集群环境中启用插件包

如果你的环境中添加了若干个子集群，启用插件包时会默认在管控集群和所有子集群中安装此插件包。但如果子集群在某个插件包启用之后加入环境当中，则需要通过升级操作在新加入集群中安装此插件包。如下所示

```
$ vela addon upgrade velaux
Addon: 
 enabled Successfully
```

### 离线安装插件包

如果因为某些原因，你的环境无法通过访问插件包仓库，你可以通过指定本地的插件包目录来进行离线安装。如下所示：

```
$ ls
README.md           fluxcd              ocm-cluster-manager terraform           terraform-alibaba   terraform-aws       terraform-azure     velaux

$ vela addon enable velaux/
Addon: velaux enabled Successfully
```

需要注意的是，在安装插件过程当中，仍可能需要从网络中拉取镜像或者 helm chart，如果你的网络环境同样无法访问这些地址，请参考[文档](../../../platform-engineers/system-operation/enable-addon-offline)进行完整的离线安装。

## 编写自己的插件包

请参考[插件包制作文档](../../../platform-engineers/addon/intro)。
