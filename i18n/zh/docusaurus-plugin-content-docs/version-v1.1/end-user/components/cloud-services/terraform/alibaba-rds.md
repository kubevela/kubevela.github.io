---
title:  Alibaba RDS
---

本节，我们将为你介绍如何集成阿里云的云数据库（RDS），成为应用部署计划（Application）的一个可用组件。这些云资源的集成，由 Terraform 提供支撑。

### 开启 Terraform 插件

Kubevela 通过插件系统（Addon）提供了一个功能强大且丰富的能力中心，你只需使用一行指令，便可开启自己想要的功能。要使用 Terraform，请键入：

```shell
$ vela addon enable terraform
I0825 22:39:47.917598   38209 apply.go:93] "creating object" name="terraform" resource="core.oam.dev/v1beta1, Kind=Initializer"
Initializer terraform is in phase:...
Successfully enable addon:terraform
```

### 安装组件

首先，我们已经为你准备好了组件，请运行如下命令进行安装：

```shell
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/terraform/cloud-resource-provision-and-consume/ComponentDefinition-alibaba-rds.yaml
```

接下来，通过命令行 `vela components` 就可以查看，是否这个组件被成功安装进 KubeVela 控制平面里：

```shell
$ vela components
NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                 
alibaba-rds	default    	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud RDS object 
```

安装成功！请把它使用到你的应用部署计划中去吧。