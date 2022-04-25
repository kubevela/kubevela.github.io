---
title: 离线安装
---

KubeVela 离线部署包含 KubeVela Core 和 KubeVela Addon 的离线部署。

## KubeVela Core 离线部署

### KubeVela chart

- 下载 vela-core Helm Chart 包

通过 [Helm Chart 安装 KubeVela Core](../../install)文档下载您希望的 vela-core Chart 包，并解压。

- 修改 values 里可配置的镜像

拉取以下镜像并导入离线环境的镜像仓库， 在 `helm install` 安装命令里通过 `--set` 覆盖每个镜像对应的离线环境镜像仓库里每个镜像的信息。

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

- 修改无法配置的镜像

Chart 参数 `enableFluxcdAddon` 决定是否默认安装 addon FluxCD， 如果参数 `enableFluxcdAddon` 为 true，拉取以下镜像并导入离线环境的镜像仓库，
更改各个文件中的镜像 registry 地址为离线环境镜像仓库地址。

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

- 重新打包 vela-core Helm Chart 包

重新打包上面修改好的 Helm Chart 包，直接安装或者传入离线环境的 Helm Chart 仓库。

## KubeVela Addon 离线部署
