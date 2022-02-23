---
title: Enable Addon without Internet
---

## Enable without Internet

If your cluster cannot request `https://addons.kubevela.net` or `github.com`, you can download these files from `https://github.com/oam-dev/catalog/tree/master/addons` to local, and specify a local addon dir when enable an addon to install locally.

Please notice that, while installation the cluster maybe still need pull some images or helm charts from Internet.If your cluster also cannot request the Internet you need  follow these steps to install the addon.

1. Download the addon's files from https://github.com/oam-dev/catalog/tree/master/addons` to your computer.
2. Sync the addon needed images and helm charts which you want to enable to your own image/helm repo. Then modify the addon's files to reference you own repo. We will introduce what images/helm charts needed to sync for each addon below. 
3. Use `vela cli` to enable an addon with specify a local addon dir to install offline. eg:

```yaml
$ vela addon enable <dir>
```

## Images or helm charts need to sync

### 1. FluxCD

You need sync these images to your own image registry, and modify the related addon files to reference you own registry.

|Images|files|
|:----:|:----:|
| fluxcd/helm-controller:v0.11.1| fluxcd/resources/deployment/helm-controller.yaml|  
| fluxcd/image-automation-controller:v0.14.0|fluxcd/resources/deployment/image-automation-controller.yaml | 
|fluxcd/image-reflector-controller:v0.11.0|fluxcd/resources/deployment/image-reflector-controller.yaml|
|fluxcd/kustomize-controller:v0.13.1|fluxcd/resources/deployment/kustomize-controller.yaml|
|fluxcd/source-controller:v0.15.3|fluxcd/resources/deployment/source-controller.yaml|

### 2. OCM

|Images|files|
| :----:| :----: | 
|quay.io/open-cluster-management/registration-operator:latest|ocm-cluster-manager/resources/operator/operator.yaml|

### 3. VelaUX

There is no need to modify the addon files for enabling this addon, you only need to sync these images and enable this addon with repo args to reference your own registry.

|Images|  
| :----:|
|oamdev/vela-apiserver:v1.2.3|
|oamdev/oamdev/velaux::v1.2.3|

eg：

```yaml
$ vela addon enable addons/velaux/ repo=<仓库地址>
```

### 4. Terraform

1. Sync the image `oamdev/terraform-controller:0.3.5` to your own images registry.
2. Dowload the terraform helm chart.
```yaml
$ helm pull https://charts.kubevela.net/addons/terraform-controller-0.3.5.tgz
```
3. Extract the chart and modify the `values.yaml` change `image.repository` to your own image registry.Then push it to your helm chart museum.
4. Modify the addon file `terraform/resources/terraform-controller.cue` change `output.properties.url` to your chart museum's url.

Other official addons needn't sync any resources.