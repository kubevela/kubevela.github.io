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

## GCP Terraform Provider 插件

  执行如下命令开启 Terraform 对 GCP 的支持，可以[创建和消费云资源](../../end-user/components/cloud-services/provision-and-consume-cloud-services)：

  参考[Add Credentials Guide](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/getting_started#adding-credentials)，设置参数 `GOOGLE_CREDENTIALS` 。参考 [Configure Provider Guide](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/getting_started#configuring-the-provider)，设置参数`GOOGLE_PROJECT` 。

  参考[Google Cloud Platform Region 列表](https://cloud.google.com/compute/docs/regions-zones)中的`Region`设置 `GOOGLE_REGION` 。

```shell
vela addon enable provider-gcp GOOGLE_CREDENTIALS=<aaa> GOOGLE_PROJECT=<bbb> GOOGLE_REGION=<region>
```

## 腾讯云 Terraform Provider 插件

参考[文档](https://cloud.tencent.com/document/product/1213/67093) 获取 `TENCENTCLOUD_SECRET_ID` 和 `TENCENTCLOUD_SECRET_KEY`。
在[腾讯云区域列表](https://cloud.tencent.com/document/api/1140/40509#.E5.9C.B0.E5.9F.9F.E5.88.97.E8.A1.A8)中选择一个 RegionId 作为 `TENCENTCLOUD_REGION`。

  ```shell
  vela addon enable terraform-tencent TENCENTCLOUD_SECRET_ID=<xxx> TENCENTCLOUD_SECRET_KEY=<yyy> TENCENTCLOUD_REGION=<region>
  ```
