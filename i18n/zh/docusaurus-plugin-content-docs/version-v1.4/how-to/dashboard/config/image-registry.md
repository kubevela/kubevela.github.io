---
title: 镜像仓库
description: 配置私有的镜像仓库
---

In this guide, we will introduce how to create a private image registry and how to create an application whose image locates in the registry.

## Create an image registry

In `Image Registry` page, let's create a private image registry with some required information:

* Registry

Your registry domain, such as `index.docker.io`. Please make sure this domain could be accessed from all cluster nodes.

* Insecure

If your registry server uses the self-signed certificate, you should enable this field. This only means KubeVela could trust your registry. You also need to make sure the `dockerd` or `containerd` in your cluster node trust this registry. refer to: [Test an insecure registry with docker](https://docs.docker.com/registry/insecure/)

* UseHTTP

If your registry with the HTTP protocol to provide the service, you should enable this field. You also need to make sure the `dockerd` or `containerd` in your cluster node trust this registry. refer to: [Test an insecure registry with docker](https://docs.docker.com/registry/insecure/)

* Auth

If your registry needs authentication, you need must set the username and password. KubeVela will generate the secret and distribute it to all clusters.

![config](https://static.kubevela.net/images/1.4/create-image-registry.jpg)


## How to use the image registry

Let's follow the [Deploy Container Image](../../../tutorials/webservice.md) to create an application. After you input the image name, KubeVela will automatically identify the matched registries.
