---
title: 插件的离线安装
---

## 离线安装步骤

如果你的网络环境，无法访问 `https://addons.kubevela.net` 或者 `github.com`, 你可以通过将 `https://github.com/oam-dev/catalog/tree/master/addons` 中的文件拷贝到本地， 并指定本地的某个插件的目录进行本地安装。
需要注意的是，安装插件的过程当中，可能仍需要从网络上拉取某些 helm chart 或者镜像。如果你的网络环境同样也无法访问这些资源，你需要执行以下步骤进行完全的离线安装。

1. 将 `https://github.com/oam-dev/catalog/tree/master/addons` 中的文件目录下载到本地。
2. 同步你想要安装的插件中的镜像或者 helm chart ，到自己的镜像仓库或 chart 仓库中，并修改插件文件引用到你自己的资源仓库。下面会专门介绍各个插件都需要同步哪些镜像和 helm chart以及如何替换这些资源。
3. 通过 vela cli 指定一个本地的目录进行离线安装。例如：
```yaml
$ vela addon enable <本地目录>
```

## 插件中需要同步的镜像和 helm chart

### 1. FluxCD

你需要将以下这些镜像上传到你自己的镜像仓库，并修改对应路径的对应文件，指向你的镜像仓库。

|需同步镜像|  需修改的文件| 
| :----:| :----: | 
| fluxcd/helm-controller:v0.11.1| fluxcd/resources/deployment/helm-controller.yaml|  
| fluxcd/image-automation-controller:v0.14.0|fluxcd/resources/deployment/image-automation-controller.yaml | 
|fluxcd/image-reflector-controller:v0.11.0|fluxcd/resources/deployment/image-reflector-controller.yaml|
|fluxcd/kustomize-controller:v0.13.1|fluxcd/resources/deployment/kustomize-controller.yaml|
|fluxcd/source-controller:v0.15.3|fluxcd/resources/deployment/source-controller.yaml|

### 2. OCM

|需同步镜像|  需修改的文件| 
| :----:| :----: | 
|quay.io/open-cluster-management/registration-operator:latest|ocm-cluster-manager/resources/operator/operator.yaml|

### 3. VelaUX

VelaUX 的插件不需要修改插件文件本身，你只需要将下列镜像同步到你自己的镜像仓库，并在插件启动参数中指定仓库地址即可。

|需同步镜像|  
| :----:|
|oamdev/vela-apiserver:v1.2.3|
|oamdev/oamdev/velaux::v1.2.3|

例如：

```yaml
$ vela addon enable addons/velaux/ repo=<仓库地址>
```

### 4. Terraform

1. 将镜像 `oamdev/terraform-controller:0.3.5` 同步到自己的镜像仓库。
2. 将 terraform 的 helm chart ` https://charts.kubevela.net/addons/terraform-controller-0.3.5.tgz` 下载下来。
```yaml
$ helm pull https://charts.kubevela.net/addons/terraform-controller-0.3.5.tgz
```
3. 解压缩 chart 包，并修改当中的 `values.yaml` 的 `image.repository` 为自己的镜像仓库后，再上传到你自己的 chart 仓库。
4. 修改 Terraform 插件中 `terraform/resources/terraform-controller.cue` `output.properties.url` 为你的 chart 仓库地址。 

除了上面的这些插件，其他正式的官方插件不需要同步任何镜像和 helm chart。