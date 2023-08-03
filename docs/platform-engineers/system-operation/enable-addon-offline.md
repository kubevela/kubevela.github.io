---
title: Air-gapped Installation for Addon
---

If your environments don't have network access to `https://addons.kubevela.net` or `https://github.com/kubevela/catalog`, this guide will demonstrate how to install in the air-gapped environment.

Generally, you should git clone the repo which contained the addon configuration, you can specify a local addon directory when enable an addon for installation. While you should make sure all container images or helm charts are replaced by your private registry.

You can follow these steps as an example.

1. Git clone [the catalog repo](https://github.com/kubevela/catalog) to download these addon files. You can find all community addons in subdirectory `./addons/` and experimental addons in subdirectory `./experimental/addons`.

```yaml
git clone https://github.com/kubevela/catalog
```   
> If you want to self-host addon catalog, refer to [*Sync addon catalog to your ChartMuseum instance*](../addon/addon-registry.md#sync-addon-catalog-to-your-chartmuseum-instance)

2. Sync the dependency container images in the addon to your private image registry, the sync command can be as following: 
   
```yaml
$ docker pull fluxcd/helm-controller:v0.11.1
$ docker push <your repo url>/fluxcd/helm-controller:v0.11.1
```

3. Parts of addons may rely on helm charts, e.g. `terraform addon`. You should sync these helm charts to your private chart registry.

```yaml
$ helm repo add vela-charts https://charts.kubevela.net/addons
$ helm repo update
$ helm pull vela-charts/terraform-controller --version 0.3.5
$ helm push terraform-controller-0.3.5.tgz <your charts repo url>
```
> You can use ChartMuseum addon to build your private Helm Chart registry and hold these Charts. Please refer to [*Sync Helm Charts to your ChartMuseum instance*](../addon/addon-registry.md#sync-helm-charts-to-your-chartmuseum-instance) for complete instructions and usage examples.

4. Modify the values of addon by referring to your own image/chart registry. You can find all images/charts dependency in the files of subdirectory `resources/`, just modify the configuration.
   For example, you can modify the fluxcd addon files `addons/fluxcd/resources/deployment/helm-controller.yaml` the deployment object's field `spec.sepc.containers[0].image` to your own image repo.

5. Use `vela cli` to enable an addon with specify a local addon dir to install offline.

```yaml
$ vela addon enable /your/local/addon/directory
```

## Images or helm charts need to sync

Here's a list about images or helm charts of all community addons that should be synced for air-gapped installation.

> The image versions below can be outdated. You should check the addon files to find out the latest version used in addons.

### 1. FluxCD

You need sync these images to your own image registry, and modify the related addon files to reference you own registry.

|                   Images                   |                            files                             |
| :----------------------------------------: | :----------------------------------------------------------: |
|       fluxcd/helm-controller:v0.11.1       |       fluxcd/resources/deployment/helm-controller.yaml       |
| fluxcd/image-automation-controller:v0.14.0 | fluxcd/resources/deployment/image-automation-controller.yaml |
| fluxcd/image-reflector-controller:v0.11.0  | fluxcd/resources/deployment/image-reflector-controller.yaml  |
|    fluxcd/kustomize-controller:v0.13.1     |    fluxcd/resources/deployment/kustomize-controller.yaml     |
|      fluxcd/source-controller:v0.15.3      |      fluxcd/resources/deployment/source-controller.yaml      |

### 2. OCM

|                            Images                            |                        files                         |
| :----------------------------------------------------------: | :--------------------------------------------------: |
| quay.io/open-cluster-management/registration-operator:latest | ocm-cluster-manager/resources/operator/operator.yaml |

### 3. VelaUX

There is no need to modify the addon files for enabling this addon, you only need to sync these images and enable this addon with repo args to reference your own registry.

|            Images            |
| :--------------------------: |
| oamdev/vela-apiserver:v1.2.3 |
| oamdev/oamdev/velaux::v1.2.3 |

eg：

```yaml
$ vela addon enable addons/velaux/ repo=<addon-registry-url>
```

### 4. Terraform

1. Sync the image `oamdev/terraform-controller:0.3.5` to your own images registry.
2. Dowload the terraform helm chart.
```yaml
$ helm pull https://charts.kubevela.net/addons/terraform-controller-0.3.5.tgz
```
3. Extract the chart and modify the `values.yaml` change `image.repository` to your own image registry.Then push it to your helm chart museum.
4. Modify the addon file `terraform/resources/terraform-controller.cue` change `output.properties.url` to your chart museum's url.

### 5. Rollout

1. Sync the image `oamdev/vela-rollout:v1.6.4` to your own images registry.
2. Dowload the rollout helm chart.
```yaml
$ helm pull https://charts.kubevela.net/core/vela-rollout-1.3.0.tgz
```
3. Extract the chart and modify the `values.yaml` change `image.repository` to your own image registry.Then push it to your helm chart museum.
4. Modify the addon file `rollout/resources/rollout-controller.cue` change `output.properties.url` to your chart museum's url.