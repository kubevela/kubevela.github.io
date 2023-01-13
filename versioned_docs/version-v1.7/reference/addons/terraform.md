---
title: Terraform
---

To provision cloud resources, you can use terraform along with related cloud provider addons.

## Enable Terraform addon

```shell
vela addon enable terraform
```

After Terraform addon is enabled, you will have a basic capability to create cloud resources in CRD ways. Then you can enable a terraform provider addon for specific clouds.

## Enable Terraform Provider addon

KubeVela can support the following cloud providers by enabling the Terraform provider addons.

```shell
$ vela addon list | grep terraform-
terraform-alibaba        	KubeVela	Kubernetes Terraform Controller for Alibaba Cloud                                                    	[1.0.2, 1.0.1]                      	enabled (1.0.2)
terraform-tencent        	KubeVela	Kubernetes Terraform Controller Provider for Tencent Cloud                                           	[1.0.0, 1.0.1]                      	enabled (1.0.0)
terraform-aws            	KubeVela	Kubernetes Terraform Controller for AWS                                                              	[1.0.0, 1.0.1]                      	enabled (1.0.0)
terraform-azure          	KubeVela	Kubernetes Terraform Controller for Azure                                                            	[1.0.0, 1.0.1]                      	enabled (1.0.0)
terraform-baidu          	KubeVela	Kubernetes Terraform Controller Provider for Baidu Cloud                                             	[1.0.0, 1.0.1]                      	enabled (1.0.0)
terraform-gcp            	KubeVela	Kubernetes Terraform Controller Provider for Google Cloud Platform                                   	[1.0.0, 1.0.1]                      	enabled (1.0.0)
terraform-ucloud         	KubeVela	Kubernetes Terraform Controller Provider for UCloud                                                  	[1.0.1, 1.0.0]                      	enabled (1.0.1)
```

To enable one of them, use the following command:

```shell
vela addon enable terraform-<provider-name>
```

You can also disable, upgrade, and check the status of an addon by command `vela addon`.

### Authenticate a Terraform provider

View the supported Terraform providers.

```shell
vela config-template list | grep terraform
```

For example to create a provider config for AWS.

```shell
vela config create aws -t terraform-aws AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy AWS_DEFAULT_REGION=us-east-1
```

### Provision cloud resources

After a Terraform provider is authenticated, you can [provision and/or consume cloud resources](../../tutorials/consume-cloud-services).
