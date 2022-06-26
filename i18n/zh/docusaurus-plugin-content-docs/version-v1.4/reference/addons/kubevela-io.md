---
title: kubevela-io
---

这个插件是一个文档网站，文档内容与 https://kubevela.io/ 及其镜像 https://kubevela.net/ 是同步更新的。

使用此插件可以帮助你在集群中无缝查阅文档。

## 安装插件

```shell
vela addon enable kubevela-io
```

## 卸载插件

```shell
vela addon disable kubevela-io
```

## 更多信息
- 关于部署的镜像
  - 此插件中使用的镜像默认为 oam-dev/kubevela-io:latest。 你可以从 dockerhub 拉取镜像，也可以编译源代码并将其构建为镜像，然后推送到你自己的本地镜像仓库。
- 关于如何访问本地 kubevela-io 文档站点
  - 你可以使用已经部署在 vela-system 命名空间里的名为 kubevela-io-np 的 NodePort 服务。
  - 当然你也可以使用 ingress 来访问。
