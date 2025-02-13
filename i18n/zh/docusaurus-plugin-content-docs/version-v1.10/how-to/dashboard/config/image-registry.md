---
title: 集成私有镜像仓库
description: 配置一个私有镜像仓库进行应用交付。
---

本文介绍如何配置一个私有的镜像仓库，同时使用仓库中的镜像创建应用。

首先通过下述命令检查 [配置模版](./config-template.md) 是否已经存在，正常情况下它随着 VelaUX 一起安装。

```bash
vela config-template list | grep image-registry
```

## 创建镜像仓库配置

在 UI 中有两个地方可以创建配置。在配置管理页面中，可以创建平台级别的配置，对于镜像仓库配置来说，系统级别创建意味着该配置可以在任何项目中使用。如果希望创建一个只在单个项目下可用的仓库，则在项目概要页面中创建配置。

在 `Configs/ImageRegistry` 页面中，点击创建按钮即可打开创建窗口，包含如下字段需要填写。

* Registry

镜像仓库的域名，例如 `index.docker.io`。请确保填写的域名可以被集群中所有的节点访问。

* Insecure

镜像仓库通常需启用 TLS, 如果你的服务证书是自签名的，需要开启此参数。但这只意味着在进行镜像检查时忽略对证书的检查。使用此类仓库你同事需要确保每个节点的容器运行时可以信任该仓库。可以参考 [在 Docker 中使用非安全的镜像仓库](https://docs.docker.com/registry/insecure/) 进行相关配置。

* UseHTTP

与 Insecure 类似，另外一种不安全的模式是使用 HTTP 提供服务。如果是需要开启该选项，同时任然需要配置容器运行时信任该仓库。

* Auth

如果仓库具有用户认证，同时需要设置账号和密码。

![config](https://static.kubevela.net/images/1.4/create-image-registry.jpg)

另外你也可以直接使用 CLI 创建仓库配置:

```bash
vela config create <Config Name> -t image-registry registry=<Registry Domain>
```

查看所有镜像仓库配置:

```bash
vela config list -t image-registry
```

## 分发配置

After creating a config, it only saves as a Secret in the system namespace in the hub cluster. But the application will generate the Workload resource that depends on this Secret which type is `kubernetes.io/dockerconfigjson`. So, we should distribute the Secret to all namespaces that we could use and include managed clusters. The config distribution could help you.

配置创建后，它仅以 Secret 存在于管控集群的系统命名空间中。但是部署镜像来源于带有认证信息的私有镜像仓库时，工作负载资源需要依赖一个类型为 `kubernetes.io/dockerconfigjson` 的 Secret，配置生成的 Secret 即是所需。因此我们需要将其分发到我们会使用的命名空间，包括其他集群。KubeVela 配置分发能力可以帮助到你。


我们需要进入到需要创建应用的项目概览页面。

![project summary](https://static.kubevela.net/images/1.6/project-summary.jpg)

点击配置列表中的分发按钮并选择会使用的目标集合，即可将配置分发到这些交付目标对应的命名空间中。

同样，你可以通过 CLI 来分发配置，此时需要显示指定集群和命名空间。

```bash
vela config distribute <Config Name> --target <cluster/namespace>
```

## 如何使用私有镜像仓库

让我们参考 [部署容器镜像](../../../tutorials/webservice.mdx) 创建应用。当我们输入属于私有镜像仓库的镜像名称后，KubeVela UX 会自动加载该镜像信息，同时根据镜像名称匹配对应的镜像仓库。如果镜像信息加载正常，则代表该镜像仓库可以正常访问了。请注意，应用交付的目标命名空间需要在配置分发环节选中并完成分发。
