# Air-gapped Installation

Air-gapped Installation of KubeVela includes the installation of KubeVela core and addons, they all contain the configuration files and images.

## KubeVela Core

- Download Helm Chart package of vela-core

Download `vela-core` Helm Chart package per [Install KubeVela Core](../../install) and unarchive it.

- Modify images which can be configurable

Pull the following images and push them into an image repository in the dedicated environment. Overwrite each image's
information with `-set` when installing by `helm install`.

```shell
$  kubevela git:(master) grep -r repository charts/vela-core/values.yaml -A 1
charts/vela-core/values.yaml:  repository: oamdev/vela-core
charts/vela-core/values.yaml-  tag: latest
--
charts/vela-core/values.yaml:      repository: oamdev/kube-webhook-certgen
charts/vela-core/values.yaml-      tag: v2.3
--
charts/vela-core/values.yaml:      repository: oamdev/cluster-gateway
charts/vela-core/values.yaml-      tag: v1.1.7
--
charts/vela-core/values.yaml:    repository: oamdev/hello-world
charts/vela-core/values.yaml-    tag: v1
--
charts/vela-core/values.yaml:    repository: oamdev/alpine-k8s
charts/vela-core/values.yaml-    tag: 1.18.2
```

- Modify images which could not be configurable

The value `enableFluxcdAddon` indicates whether to enable Addon `FluxCD` by default. If it is `true`, the following images
have to be pulled and pushed into an image repository in the dedicated environment in advance. Overwrite each image's information
in the following YAML files.

```shell
$  kubevela git:(master) grep -r -i image: charts/vela-core/templates/addon
charts/vela-core/templates/addon/fluxcd.yaml:                      image: fluxcd/helm-controller:v0.11.1
charts/vela-core/templates/addon/fluxcd.yaml:                      image: fluxcd/image-automation-controller:v0.14.0
charts/vela-core/templates/addon/fluxcd.yaml:                      image: fluxcd/image-reflector-controller:v0.11.0
charts/vela-core/templates/addon/fluxcd.yaml:                      image: fluxcd/kustomize-controller:v0.13.1
charts/vela-core/templates/addon/fluxcd.yaml:                      image: fluxcd/source-controller:v0.15.3


$  kubevela git:(master) grep -r -i image: charts/vela-core  --exclude-dir=charts/vela-core/templates/addon | grep -v .Values
charts/vela-core/templates/defwithtemplate/nocalhost.yaml:        						image: "nocalhost-docker.pkg.coding.net/nocalhost/dev-images/golang:latest"
```

- Repackage vela-core Helm Chart

Repackage the Helm Chart package from the modified chart. Install it directly or install it from a dedicated Helm Chart
repository after you pushed the package into the repository.

## Addon

Please refer to [Enable Addon without Internet Access](./enable-addon-offline.md).