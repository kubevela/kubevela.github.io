---
title: 将现有 Terraform 云资源迁移到 KubeVela
author: Nan Li
author_url: https://github.com/loheagn
author_image_url: https://avatars.githubusercontent.com/u/33423736
tags: [ KubeVela, Terraform, Kubernetes, DevOps, CNCF, CI/CD, Application delivery]
description: "This blog discusses how to migrate existing Terraform cloud resources to KubeVela."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

你可能已经从[这篇博客](2022-06-27-terraform-integrate-with-vela.md) 中了解到，我们可以通过 terraform 插件使用 vela 来管理云资源（如 s3 bucket、AWS EIP 等）。 我们可以创建一个包含一些云资源组件的应用，这个应用会生成这些云资源，然后我们可以使用 vela 来管理它们。

有时我们已经有一些 Terraform 云资源，这些资源可能由 Terraform 二进制程序或其他程序创建和管理。 为了获得 [使用 KubeVela 管理云资源的好处](2022-06-27-terraform-integrate-with-vela.md#part-1-glue-terraform-module-as-kubevela-capability) 或者只是在管理云资源的方式上保持一致性，我们可能希望将这些现有的 Terraform 云资源导入 KubeVela 并使用 vela 进行管理。如果我们只是创建一个描述这些云资源的应用，这些云资源将被重新创建并可能导致错误。 为了解决这个问题，我们制作了 [一个简单的 `backup_restore` 工具](https://github.com/kubevela/terraform-controller/tree/master/hack/tool/backup_restore)。 本博客将向你展示如何使用 `backup_restore` 工具将现有的 Terraform 云资源导入 KubeVela。

<!--truncate-->

## 步骤1：创建 Terraform 云资源

由于我们要演示如何将现有的云资源导入 KubeVela，我们需要先创建一个。 如果你已经拥有此类资源，则可以跳过此步骤。

在开始之前，请确保你已经：

- 安装了 [terraform CLI](https://www.terraform.io/downloads)。
- 获得云服务凭证，在本文中，我们将使用 aws 作为示例。
- 学习[如何使用terraform](https://www.terraform.io/language)的基础知识。


让我们开始吧！

1. 先创建一个空目录。

    ```shell
    mkdir -p cloud-resources
    cd cloud-resources
    ```

2. 创建一个名为 `main.tf` 的文件，该文件将创建一个 S3 bucket：

    ```hcl
    resource "aws_s3_bucket" "bucket-acl" {
        bucket = var.bucket
        acl    = var.acl
    }

    output "RESOURCE_IDENTIFIER" {
        description = "The identifier of the resource"
        value       = aws_s3_bucket.bucket-acl.bucket_domain_name
    }

    output "BUCKET_NAME" {
        value       = aws_s3_bucket.bucket-acl.bucket_domain_name
        description = "The name of the S3 bucket"
    }

    variable "bucket" {
        description = "S3 bucket name"
        default     = "vela-website"
        type        = string
    }

    variable "acl" {
        description = "S3 bucket ACL"
        default     = "private"
        type        = string
    }
    ```

3. 配置 AWS 云服务商的凭证：

    ```shell
    export AWS_ACCESS_KEY_ID="your-accesskey-id"
    export AWS_SECRET_ACCESS_KEY="your-accesskey-secret"
    export AWS_DEFAULT_REGION="your-region-id"
    ```

4. 在 `main.tf` 文件中设置变量：

    ```shell
    export TF_VAR_acl="private"; export TF_VAR_bucket="your-bucket-name"
    ```

5. （可选）创建一个 `backend.tf` 来配置你的 Terraform 后端。 在此示例中，我们仅使用默认的本地后端。

6. 运行 `terraform init` 和 `terraform apply` 来创建 S3 bucket：

    ```shell
    terraform init && terraform apply
    ```

7. 检查 S3 bucket 列表，确保 bucket 创建成功。

8. 运行 `terraform state pull` 获取云资源的 Terraform 状态并将其存储到本地文件中：

    ```shell
    terraform state pull > state.json
    ```

## 步骤2：将现有 Terraform 云资源导入 KubeVela

1. 创建 `application.yaml` 文件，请确保 Component 各字段的描述与你的云资源配置一致：

    ```yaml
    apiVersion: core.oam.dev/v1beta1
    kind: Application
    metadata:
    name: app-aws-s3
    spec:
    components:
        - name: sample-s3
        type: aws-s3
        properties:
            bucket: vela-website-202110191745
            acl: private
            writeConnectionSecretToRef:
            name: s3-conn
    ```

2. 获取 [`backup_restore` 工具](https://github.com/kubevela/terraform-controller/tree/master/hack/tool/backup_restore):

    ```shell
    git clone https://github.com/kubevela/terraform-controller.git
    cd terraform-controller/hack/tool/backup_restore
    ```

3. 运行 `restore` 命令:
    ```shell
    go run main.go restore --application <path/to/your/application.yaml> --component sample-s3 --state <path/to/your/state.json>
    ```
    上述命令将首先在 Kubernetes 中恢复 Terraform 后端，然后在不重新创建 S3 bucket 的情况下创建应用。

就这样！ 你已经成功将 S3 bucket 的管理迁移到 KubeVela！

## 更多信息

有关 `backup_restore` 工具的更多信息，请阅读 [文档](https://github.com/kubevela/terraform-controller/blob/master/hack/tool/backup_restore/README.md)。 如果你有任何问题，欢迎随时提出 issues 和 PR。

