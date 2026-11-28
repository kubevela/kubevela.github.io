---
title:  Alibaba Cloud MARKET-TENSORFLOW
---

## Description

Based on Terraform module, create ECS instances on Ali cloud to achieve one-click deployment of cloud marketplace Tensorflow.

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_instance | Whether to create ecs instance. | bool | false |  
 deletion_protection | Whether enable the deletion protection or not. 'true': Enable deletion protection. 'false': Disable deletion protection. | bool | false |  
 description | Description of the instance, This description can have a string of 2 to 256 characters, It cannot begin with http:// or https://. Default value is null. | string | false |  
 ecs_instance_name | The name of ECS Instance. | string | false |  
 ecs_instance_password | The password of ECS instance. | string | false |  
 ecs_instance_type | The instance type used to launch ecs instance. | string | false |  
 force_delete | If it is true, the 'PrePaid' instance will be change to 'PostPaid' and then deleted forcibly. However, because of changing instance charge type has CPU core count quota limitation, so strongly recommand that 'Don't modify instance charge type frequentlly in one month'. | bool | false |  
 image_id | The image id used to launch one ecs instance. If not set, a fetched market place image by product_keyword will be used. | string | false |  
 internet_charge_type | The internet charge type of ECS instance. Choices are 'PayByTraffic' and 'PayByBandwidth'. | string | false |  
 internet_max_bandwidth_out | The maximum internet out bandwidth of ECS instance. | number | false |  
 private_ip | Configure ECS Instance private IP address. | string | false |  
 product_keyword | The name keyword of Market Product used to fetch the specified product image. | string | false |  
 product_suggested_price | The suggested price of Market Product used to fetch the specified product image. | number | false |  
 product_supplier_name_keyword | The name keyword of Market Product supplier name used to fetch the specified product image. | string | false |  
 profile | (Deprecated from version 1.1.0) The profile name as set in the shared credentials file. If not set, it will be sourced from the ALICLOUD_PROFILE environment variable. | string | false |  
 region | (Deprecated from version 1.1.0) The region used to launch this module resources. | string | false |  
 resource_group_id | The Id of resource group which the ECS instance belongs. | string | false |  
 security_group_ids | A list of security group ids to associate with ECS. | list(string) | false |  
 shared_credentials_file | (Deprecated from version 1.1.0) This is the path to the shared credentials file. If this is not set and a profile is specified, $HOME/.aliyun/config.json will be used. | string | false |  
 skip_region_validation | (Deprecated from version 1.1.0) Skip static validation of region ID. Used by users of alternative AlibabaCloud-like APIs or users w/ access to regions that are not public (yet). | bool | false |  
 system_disk_category | The system disk category used to launch one ecs instance. | string | false |  
 system_disk_size | The system disk size used to launch ecs instance. | number | false |  
 tags | A mapping of tags to assign to the ECS. | map(string) | false |  
 vswitch_id | The virtual switch ID to launch ECS instance in VPC. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to. | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |  
