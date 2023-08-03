---
title: 云资源插件
---

## Terraform 插件

```shell
vela addon enable terraform
```

## 启用 Terraform Provider 插件

KubeVela 支持以下 Terraform provider 插件。

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

要启用其中之一，请使用以下命令：

```shell
vela addon enable terraform-xxx
```

您还可以通过命令 `vela addon` 卸载、升级、检查插件的状态。

## 授权 Terraform provider

### 介绍

每个 Terraform Provider 都可以通过以下命令进行云资源的授权。

```shell
$ vela provider add -h
Authenticate Terraform Cloud Provider by creating a credential secret and a Terraform Controller Provider

Usage:
  vela provider add [flags]
  vela provider add [command]

Examples:
vela provider add <provider-type>

Available Commands:
  terraform-alibaba Authenticate Terraform Cloud Provider terraform-alibaba
  terraform-aws     Authenticate Terraform Cloud Provider terraform-aws
  terraform-azure   Authenticate Terraform Cloud Provider terraform-azure
  terraform-baidu   Authenticate Terraform Cloud Provider terraform-baidu
  terraform-gcp     Authenticate Terraform Cloud Provider terraform-gcp
  terraform-tencent Authenticate Terraform Cloud Provider terraform-tencent
  terraform-ucloud  Authenticate Terraform Cloud Provider terraform-ucloud
```

例如，我们授权 Terraform provider `terraform-aws`。


这是授权 `terraform-aws` 的帮助信息。

```
$ vela provider add terraform-aws -h
Authenticate Terraform Cloud Provider terraform-aws by creating a credential secret and a Terraform Controller Provider

Usage:
  vela provider add terraform-aws [flags]

Examples:
vela provider add terraform-aws

Flags:
      --AWS_ACCESS_KEY_ID string       Get AWS_ACCESS_KEY_ID per https://aws.amazon.com/blogs/security/wheres-my-secret-access-key/
      --AWS_DEFAULT_REGION string      Choose one of Code form region list https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-available-regions
      --AWS_SECRET_ACCESS_KEY string   Get AWS_SECRET_ACCESS_KEY per https://aws.amazon.com/blogs/security/wheres-my-secret-access-key/
      --AWS_SESSION_TOKEN string       Get AWS_SESSION_TOKEN per https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html
  -h, --help                           help for terraform-aws
      --name default                   The name of Terraform Provider for AWS, default is default (default "aws")

Global Flags:
  -y, --yes   Assume yes for all user prompts
```

### 授权一个 Terraform provider

```shell
$ vela provider add terraform-aws --AWS_ACCESS_KEY_ID=xxx --AWS_SECRET_ACCESS_KEY=yyy --AWS_DEFAULT_REGION=us-east-1
```

如果不通过 `--name` 设置提供程序名称，将创建一个名为 `aws` 的 AWS Terraform provider。

您还可以通过指定 `--name` 标志来创建多个 provider。

```shell
$ vela provider add terraform-aws --name aws-dev --AWS_ACCESS_KEY_ID=xxx --AWS_SECRET_ACCESS_KEY=yyy --AWS_DEFAULT_REGION=us-east-1
```

### 部署云资源

在 Terraform provider 授权后，您可以[创建和消费云资源](../../end-user/components/cloud-services/provision-and-consume-database.md)。
