---
title: Addon Cloud Resources
---


## Terraform addon

  ```shell
  vela addon enable terraform
  ```

## Terraform Provider addon for Alibaba Cloud

Enable Terraform Alibaba Cloud Provider as below to [provision and/or consume cloud resources](../../end-user/components/cloud-services/provision-and-consume-cloud-services).

Here is how to get [access key](https://help.aliyun.com/knowledge_detail/38738.html). Set the value for `ALICLOUD_REGION` by picking one `RegionId` from [Alibaba Cloud region list](https://www.alibabacloud.com/help/doc-detail/72379.htm).
You can also set the value for parameter `ALICLOUD_SECURITY_TOKEN`, which is optional, per [this doc](https://www.alibabacloud.com/help/doc-detail/28756.htm).

  ```shell
  vela addon enable provider-alibaba ALICLOUD_ACCESS_KEY=<xxx> ALICLOUD_SECRET_KEY=<yyy> ALICLOUD_REGION=<region>
  ```

## Terraform Provider addon for Azure

Enable Terraform Azure Provider as below to [provision and/or consume cloud resources](../../end-user/components/cloud-services/provision-and-consume-cloud-services).

Set these parameters below per [Authenticate Terraform to Azure](https://docs.microsoft.com/en-us/azure/developer/terraform/authenticate-to-azure?tabs=bash).

  ```shell
  vela addon enable provider-azure ARM_CLIENT_ID=<aaa> ARM_CLIENT_SECRET=<bbb> ARM_SUBSCRIPTION_ID=<ccc> ARM_TENANT_ID=<ddd>
  ```

## Terraform Provider addon for AWS

Enable Terraform AWS Provider as below to [provision and/or consume cloud resources](../../end-user/components/cloud-services/provision-and-consume-cloud-services).

Set these parameters below per [Authenticate Terraform to AWS](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#environment-variables).

  ```shell
  vela addon enable provider-aws AWS_ACCESS_KEY_ID=<aaa> AWS_SECRET_ACCESS_KEY=<bbb> AWS_DEFAULT_REGION=<region>
  ```
