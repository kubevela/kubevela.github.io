---
title: How to migrate Existing Terraform Cloud Resources to KubeVela
author: Nan Li
author_url: https://github.com/loheagn
author_image_url: https://avatars.githubusercontent.com/u/33423736
tags: [ KubeVela, Terraform, Kubernetes, DevOps, CNCF, CI/CD, Application delivery]
description: "This blog discusses how to migrate existing Terraform cloud resources to KubeVela."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

You may have learned from [this blog](2022-06-27-terraform-integrate-with-vela.md) that we can use vela to manage cloud resources (like s3 bucket, AWS EIP and so on) via the terraform plugin. We can create an application which contains some cloud resource components and this application will generate these cloud resources, then we can use vela to manage them. 

Sometimes we already have some Terraform cloud resources which may be created and managed by the Terraform binary or something else. In order to have [the benefits of using KubeVela to manage the cloud resources](2022-06-27-terraform-integrate-with-vela.md#part-1-glue-terraform-module-as-kubevela-capability) or just maintain consistency in the way you manage cloud resources, we may want to import these existing Terraform cloud resources into KubeVela and use vela to manage them. But if we just create an application which describes these cloud resources, the cloud resources will be recreated and may lead to errors. To fix this problem, we made [a simple `backup_restore` tool](https://github.com/kubevela/terraform-controller/tree/master/hack/tool/backup_restore). This blog will show you how to use the `backup_restore` tool to import your existing Terraform cloud resources into KubeVela.

## Step 1: Create Terraform Cloud Resources

Since we are going to demonstrate how to import an existing cloud resource into KubeVela, we need to create one first. If you already have such resources, you can skip this step.

Before start, make sure you have:

- Installed [terraform CLI](https://www.terraform.io/downloads).
- Have a Cloud Service credentials, in this article, we will use aws as example.
- Learn the basic knowledge of [how to use terraform](https://www.terraform.io/language).

Let's get started!

1. Create an empty directory to start.

    ```shell
    mkdir -p cloud-resources
    cd cloud-resources
    ```

2. Create a file named `main.tf` which will create a S3 bucket:

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

3. Configure the AWS Cloud provider credentials:

    ```shell
    export AWS_ACCESS_KEY_ID="your-accesskey-id"
    export AWS_SECRET_ACCESS_KEY="your-accesskey-secret"
    export AWS_DEFAULT_REGION="your-region-id"
    ```

4. Set the variables in the `main.tf` file:

    ```shell
    export TF_VAR_acl="private"; export TF_VAR_bucket="your-bucket-name"
    ```

5. (Optional) Create a `backend.tf` to configure your Terraform backend. We just use the default local backend in this example.

6. Run `terraform init` and `terraform apply` to create the S3 bucket:

    ```shell
    terraform init && terraform apply
    ```

7. Check the S3 bucket list to make sure the bucket is created successfully.

8. Run `terraform state pull` to get the Terraform state of the cloud resource and store it into a local file:

    ```shell
    terraform state pull > state.json
    ```

## Step 2: Import Existing Terraform Cloud Resources into KubeVela

1. Create the `application.yaml` file, please ensure that the description of each field of Component is consistent with your cloud resource configuration:

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

2. Get the [`backup_restore` tool](https://github.com/kubevela/terraform-controller/tree/master/hack/tool/backup_restore):

    ```shell
    git clone https://github.com/kubevela/terraform-controller.git
    cd terraform-controller/hack/tool/backup_restore
    ```

3. Run the `restore` command:
    ```shell
    go run main.go restore --application <path/to/your/application.yaml> --component sample-s3 --state <path/to/your/state.json>
    ```
    The above command will resume the Terraform backend in the Kubernetes first and then create the application without recreating the S3 bucket.

That's all! You have successfully migrate the management of the S3 bucket to KubeVela!

## What's more

For more information about the `backup_restore` tool, please read [the doc](https://github.com/kubevela/terraform-controller/blob/master/hack/tool/backup_restore/README.md). If you have any problem, issues and pull requests are always welcome.