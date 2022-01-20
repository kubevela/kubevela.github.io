---
title: Terraform Components
---

To enable end users to [provision and consume cloud resources](../../end-user/components/cloud-services/provider-and-consume-cloud-services),
platform engineers need to prepare ComponentDefinitions for cloud resources if end users' requirements are beyond the
[built-in capabilities](../../end-user/components/cloud-services/provider-and-consume-cloud-services#supported-cloud-resource-list).

Here is the guide to create Terraform typed ComponentDefinitions of cloud resources for cloud providers Alibaba Cloud, AWS and Azure.

# Prerequisites

- [`vela` binary](../../install.mdx)

## Develop a Terraform resource or module

Create a Terraform resource or module for a cloud resource.

For example, we created a Terraform resource for AWS S3 bucket, and stored it in a local file named `aws_s3_bucket.tf`.

```terraform
resource "aws_s3_bucket" "bucket-acl" {
  bucket = var.bucket
  acl = var.acl
}

output "BUCKET_NAME" {
  value = aws_s3_bucket.bucket-acl.bucket_domain_name
}

variable "bucket" {
  description = "S3 bucket name"
  default = "vela-website"
  type = string
}

variable "acl" {
  description = "S3 bucket ACL"
  default = "private"
  type = string
}
```

We also created a Terraform module for Alibaba Cloud EIP, and stored it in GitHub repository https://github.com/oam-dev/terraform-alibaba-eip.git.

## Generate ComponentDefinition

By running `vela def init` command, we can generate a ComponentDefinition for a cloud resource based on Terraform resource or module
either from a local file, or from a remote GitHub repository.

```shell
$vela def init -h

      --git string             Specify which git repository the configuration(HCL) is stored in. Valid when --provider/-p is set.
      --local string           Specify the local path of the configuration(HCL) file. Valid when --provider/-p is set.
```

We use `--local` to accept Terraform resource or module from a local file to generate a ComponentDefinition.

```shell
$vela def init s3 --type component --provider aws --desc "Terraform configuration for AWS S3" --local aws_s3_bucket.tf

apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: Terraform configuration for AWS S3
  creationTimestamp: null
  labels:
    type: terraform
  name: aws-s3
  namespace: vela-system
spec:
  schematic:
    terraform:
      configuration: |
        resource "aws_s3_bucket" "bucket-acl" {
          bucket = var.bucket
          acl = var.acl
        }

        output "BUCKET_NAME" {
          value = aws_s3_bucket.bucket-acl.bucket_domain_name
        }

        variable "bucket" {
          description = "S3 bucket name"
          default = "vela-website"
          type = string
        }

        variable "acl" {
          description = "S3 bucket ACL"
          default = "private"
          type = string
        }
  workload:
    definition:
      apiVersion: terraform.core.oam.dev/v1beta1
      kind: Configuration
status: {}
```

We use `--git` to accept Terraform module or resource from a remote GitHub repository to generate a ComponentDefinition.

```shell
$ vela def init eip --type component --provider alibaba --desc "Terraform configuration for Alibaba Cloud Elastic IP" --git https://github.com/oam-dev/terraform-alibaba-eip.git

apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: Terraform configuration for Alibaba Cloud Elastic
      IP
  creationTimestamp: null
  labels:
    type: terraform
  name: alibaba-eip
  namespace: vela-system
spec:
  schematic:
    terraform:
      configuration: https://github.com/oam-dev/terraform-alibaba-eip.git
      type: remote
  workload:
    definition:
      apiVersion: terraform.core.oam.dev/v1beta1
      kind: Configuration
status: {}
```

You are warmly welcome to contribute this extended cloud resource ComponentDefinition to [oam-dev/catalog](https://github.com/oam-dev/catalog/tree/master/addons/).

## Verify

You can quickly verify the ComponentDefinition by command `vela show`.

```shell
$ vela show alibaba-eip
# Properties
+----------------------------+------------------------------------------------------------------------------------------+-----------------------------------------------------------+----------+---------+
|            NAME            |                                       DESCRIPTION                                        |                           TYPE                            | REQUIRED | DEFAULT |
+----------------------------+------------------------------------------------------------------------------------------+-----------------------------------------------------------+----------+---------+
| name                       | Name to be used on all resources as prefix. Default to 'TF-Module-EIP'.                  | string                                                    | true     |         |
| bandwidth                  | Maximum bandwidth to the elastic public network, measured in Mbps (Mega bit per second). | number                                                    | true     |         |
| writeConnectionSecretToRef | The secret which the cloud resource connection will be written to                        | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false    |         |
+----------------------------+------------------------------------------------------------------------------------------+-----------------------------------------------------------+----------+---------+


## writeConnectionSecretToRef
+-----------+-----------------------------------------------------------------------------+--------+----------+---------+
|   NAME    |                                 DESCRIPTION                                 |  TYPE  | REQUIRED | DEFAULT |
+-----------+-----------------------------------------------------------------------------+--------+----------+---------+
| name      | The secret name which the cloud resource connection will be written to      | string | true     |         |
| namespace | The secret namespace which the cloud resource connection will be written to | string | false    |         |
+-----------+-----------------------------------------------------------------------------+--------+----------+---------+
```

If the tables display, the ComponentDefinition should work. To take a step further, you can verify it by provision an actual EIP instance per
the doc [Provision cloud resources](../../end-user/components/cloud-services/provider-and-consume-cloud-services#provision-cloud-resources).

## Generate documentation

You are encouraged to generate the documentation for your ComponentDefinition and submit it to [KubeVela official site](https://github.com/oam-dev/kubevela.io).

```shell
$ vela def doc-gen alibaba-eip -n vela-system
Generated docs for alibaba-eip in ./kubevela.io/docs/end-user/components/cloud-services/terraform/alibaba-eip.md
```

Move the file generated to [oam-dev/kubevela.io](https://github.com/oam-dev/kubevela.io) repo. Follow the [contribution guide](https://github.com/oam-dev/kubevela.io#contributing-to-kubevela-en-docs) to submit the doc. 
