---
title: 云资源插件
---

## Terraform 插件
  ```shell
  vela addon enable terraform
  ```

## 阿里云 Terraform Provider 插件

执行如下命令开启 Terraform 对阿里云的支持，可以[创建和消费云资源](../../end-user/components/cloud-services/provision-and-consume-cloud-services)：

其中，请参考[如何获取 Access Key](https://help.aliyun.com/knowledge_detail/38738.html)设置 Access Key，参考 [Region 列表](https://www.alibabacloud.com/help/doc-detail/72379.htm) 中的 `RegionId` 设置 `ALICLOUD_REGION`。
参数 `ALICLOUD_SECURITY_TOKEN` 是可选的，你可以通过 [这篇介绍](https://www.alibabacloud.com/help/zh/doc-detail/28756.htm) 设置。

  ```shell
  vela addon enable terraform-alibaba ALICLOUD_ACCESS_KEY=<xxx> ALICLOUD_SECRET_KEY=<yyy> ALICLOUD_REGION=<region>
  ```

## Azure Terraform Provider 插件

执行如下命令开启 Terraform 对 Azure 的支持，可以[创建和消费云资源](../../end-user/components/cloud-services/provision-and-consume-cloud-services)：

参考 [Authenticate Terraform to Azure](https://docs.microsoft.com/en-us/azure/developer/terraform/authenticate-to-azure?tabs=bash)，设置如下参数。

  ```shell
  vela addon enable terraform-azure ARM_CLIENT_ID=<aaa> ARM_CLIENT_SECRET=<bbb> ARM_SUBSCRIPTION_ID=<ccc> ARM_TENANT_ID=<ddd>
  ```

## AWS Terraform Provider 插件

执行如下命令开启 Terraform 对 AWS 的支持，可以[创建和消费云资源](../../end-user/components/cloud-services/provision-and-consume-cloud-services)：

参考 [Authenticate Terraform to AWS](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#environment-variables)，设置如下参数。

  ```shell
  vela addon enable terraform-aws AWS_ACCESS_KEY_ID=<aaa> AWS_SECRET_ACCESS_KEY=<bbb> AWS_DEFAULT_REGION=<region>
  ```
