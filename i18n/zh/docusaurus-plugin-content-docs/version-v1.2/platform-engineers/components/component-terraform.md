---
title:  Terraform 组件
---

对云资源的集成需求往往是最频繁出现，比如你可能希望数据库、中间件等服务使用阿里云、AWS 等云厂商的，以获得生产级别的可用性并免去运维的麻烦。
Terraform 是目前业内支持云资源最广泛也最受欢迎的组件，KubeVela 对 Terraform 进行了额外的支持，使得用户可以通过 Kubernetes CRD 的方式配合
Terraform 使用任意的云资源。

为了使最终用户能够[部署和消费云资源](../../end-user/components/cloud-services/provider-and-consume-cloud-services)，当用户的要求超出了 [内置云资源的能力](../../end-user/components/cloud-services/provider-and-consume-cloud-services)，
管理员需要要为云资源准备 ComponentDefinitions。

以下是为云供应商阿里云、AWS 和 Azure 创建 Terraform 类型的云资源 ComponentDefinitions 的指南。

# 依赖

- [`vela` 命令行](../../install.mdx)

## 开发 Terraform 资源或模块

为云资源开发创建 Terraform 资源或模块。

比如我们为 AWS S3 bucket 开发了 Terraform 资源，并写入本地文件 `aws_s3_bucket.tf` 里，内容如下：

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

我们也给阿里云 EIP 开发了 Terraform 模板，并存储在 GitHub 库 https://github.com/oam-dev/terraform-alibaba-eip.git。

## 生成 ComponentDefinition

通过运行 `vela def init` 命令，我们可以基于 Terraform 资源或模块的云资源生成一个 ComponentDefinition，Terraform 资源或模板可以来自本地文件，
也可以来自远程 GitHub 仓库。

```shell
$vela def init -h

      --git string             Specify which git repository the configuration(HCL) is stored in. Valid when --provider/-p is set.
      --local string           Specify the local path of the configuration(HCL) file. Valid when --provider/-p is set.
```

我们使用 `--local` 来接受来自本地文件的 Terraform 资源或模块来生成 ComponentDefinition。

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

我们使用 `--git` 来接受来自远程 GitHub 仓库的 Terraform 模块或资源来生成 ComponentDefinition。

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

我们热烈欢迎你将扩展的云资源的 ComponentDefinition 贡献到 [oam-dev/catalog](https://github.com/oam-dev/catalog/tree/master/addons/)。

## 验证

你可以通过 `vela show` 命令快速验证 ComponentDefinition。

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

如果表格能正常出来，ComponentDefinition 应该就可以工作了。更进一步，你可以通过文档[部署云资源](../../end-user/components/cloud-services/provider-and-consume-cloud-services)创建一个实际的 EIP 来验证。

## 生成文档

我们鼓励你为你的 ComponentDefinition 生成文档并提交给 [KubeVela官方网站]（https://github.com/oam-dev/kubevela.io）。

```shell
$ vela def doc-gen alibaba-eip -n vela-system
Generated docs for alibaba-eip in ./kubevela.io/docs/end-user/components/cloud-services/terraform/alibaba-eip.md
```

将生成的文件移到 [oam-dev/kubevela.io](https://github.com/oam-dev/kubevela.io) 库。参考 [贡献指南](https://github.com/oam-dev/kubevela.io#contributing-to-kubevela-en-docs) 来提交文档。
