---
title: Enable Addon without Internet Access
---

## Enable without Internet

If your environments don't have access to `https://addons.kubevela.net` or `https://github.com/kubevela/catalog`, you should git clone the repo `https://github.com/kubevela/catalog/tree/master/addons` locally. You can specify a local addon directory when enable an addon for installation.
Before installing an addon, you should check if the addon contains any container images or other sub helm charts in it. If so, the addon also can't be installed well.  You can follow these steps to make it success.

1. Git clone [the catalog repo](https://github.com/kubevela/catalog) to download these addon files.You can find all official addons in subdirectory `./addons/` and experimental addons in subdirectory `./experimental/addons`.

```yaml
git clone https://github.com/kubevela/catalog
```   

2. Sync the container images relied on by addon to your own image repository. 
   For example, you want sync the image of the helm controller image of fluxcd addon. 
   
```yaml
$ docker pull fluxcd/helm-controller:v0.11.1
$ docker push <your repo url>/fluxcd/helm-controller:v0.11.1
```

3. Parts of addons maybe rely on some helm charts such as terraform addon. You should sync these helm charts to your own chart repository.

```yaml
$ helm repo add vela-charts https://charts.kubevela.net/addons
$ helm repo update
$ helm pull vela-charts/terraform-controller --version 0.3.5
$ helm push terraform-controller-0.3.5.tgz <your charts repo url>
```

You can read this [docs](https://helm.sh/docs/topics/chart_repository/) to get knowledge how to build your own helm repo.

4. Modify the values of addon by referring to your own  image/chart repository. You can find all relied on images/charts in the files of subdirectory `resources/` and modify them.
   For example, you can modify the fluxcd addon files `addons/fluxcd/resources/deployment/helm-controller.yaml` the deployment object's  field `spec.sepc.containers[0].image` to your own image repo.We will introduce what images/helm charts needed to sync for each addon below.

5. Use `vela cli` to enable an addon with specify a local addon dir to install offline.

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