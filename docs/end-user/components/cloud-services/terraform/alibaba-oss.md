---
title:  Alibaba OSS
---

In this documentation, we will use Alibaba Cloud's OSS (Object Storage System) as example to show how to enable cloud services as part of the application deployment.

These cloud services are provided by Terraform.

### Enable Terraform via Vela Addon

KubeVela provides a powerful capability center based on Vela Addon, you could use one line of command to enable the capability you want. As for Terraform, simply type in:

```shell
$ vela addon enable terraform
I0825 22:39:47.917598   38209 apply.go:93] "creating object" name="terraform" resource="core.oam.dev/v1beta1, Kind=Initializer"
Initializer terraform is in phase:...
Successfully enable addon:terraform
```

### Install Component

Firstly, we had prepared the component for you. To install it, running:

```shell
kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/terraform/cloud-resource-provision-and-consume/ComponentDefinition-alibaba-oss.yaml
```

By using vela CLI `vela components`, you will get to know whether this component is installed successfully into KubeVela.

```
$ vela components
NAME       	NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                 
alibaba-oss	default    	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud OSS object 
```

It's free to go! Let's combine it into application whenever you needed.