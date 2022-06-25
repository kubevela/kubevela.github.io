---
title: Terraform
---

To provision cloud resources, you can use terraform along with related cloud provider addons.

## Enable Terraform addon

  ```shell
  vela addon enable terraform
  ```

After terraform addon enabled, you will have a basic capability to create cloud resource in CRD ways. Then you can enable a terraform provider addon for specific cloud.s

## Enable Terraform Provider addon

KubeVela can support following cloud providers by enabling the Terraform provider addons.

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
$ vela addon enable terraform-<provider-name>
```

You can also disable, upgrade, check status of an addon by command `vela addon`.

## Authenticate Terraform Provider

After any of the terraform provider addon enabled, you can create credential for them by `vela provider` command.

### Add Credential

Each Terraform provider can be authenticated by the command as below.

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

For example, let's authenticate the Terraform provider `terraform-aws`.

Here is the help message for authenticate the `terraform-aws`.

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

### Authenticate a Terraform provider

```shell
$ vela provider add terraform-aws --AWS_ACCESS_KEY_ID=xxx --AWS_SECRET_ACCESS_KEY=yyy --AWS_DEFAULT_REGION=us-east-1
```

Without setting a provider name by `--name`, an AWS Terraform provider named `aws` will be created.

You also create multiple providers by specifying the `--name` flag.

```shell
$ vela provider add terraform-aws --name aws-dev --AWS_ACCESS_KEY_ID=xxx --AWS_SECRET_ACCESS_KEY=yyy --AWS_DEFAULT_REGION=us-east-1
```

### Provision cloud resources

After a Terraform provider is authenticated, you can [provision and/or consume cloud resources](../../end-user/components/cloud-services/provision-and-consume-cloud-services).
