---
title:  Alibaba Cloud ECS
---

## Description

Terraform configuration for Alibaba Cloud Elastic Compute Service

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 associate_public_ip_address | Whether to associate a public ip address with an instance in a VPC. | bool | false |  
 credit_specification | Performance mode of the t5 burstable instance. Valid values: 'Standard', 'Unlimited'. | string | false |  
 data_disks | Additional data disks to attach to the scaled ECS instance. | list(map(string)) | false |  
 deletion_protection | Whether enable the deletion protection or not. 'true': Enable deletion protection. 'false': Disable deletion protection. | bool | false |  
 description | Description of all instances. | string | false |  
 dry_run | Whether to pre-detection. When it is true, only pre-detection and not actually modify the payment type operation. Default to false. | bool | false |  
 force_delete | If it is true, the 'PrePaid' instance will be change to 'PostPaid' and then deleted forcibly. However, because of changing instance charge type has CPU core count quota limitation, so strongly recommand that 'Don't modify instance charge type frequentlly in one month'. | bool | false |  
 host_name | Host name used on all instances as prefix. Like if the value is TF-ECS-Host-Name and then the final host name would be TF-ECS-Host-Name001, TF-ECS-Host-Name002 and so on. | string | false |  
 image_id | The image id used to launch one or more ecs instances. | string | false |  
 instance_charge_type | The charge type of instance. Choices are 'PostPaid' and 'PrePaid'. | string | false |  
 instance_type | The instance type used to launch one or more ecs instances. | string | false |  
 internet_charge_type | The internet charge type of instance. Choices are 'PayByTraffic' and 'PayByBandwidth'. | string | false |  
 internet_max_bandwidth_in | (Deprecated from version v1.121.2) The maximum internet in bandwidth of instance. The attribute is invalid and no any affect for the instance. So it has been deprecated from version v1.121.2. | number | false |  
 internet_max_bandwidth_out | The maximum internet out bandwidth of instance. | number | false |  
 key_name | The name of SSH key pair that can login ECS instance successfully without password. If it is specified, the password would be invalid. | string | false |  
 kms_encrypted_password | An KMS encrypts password used to an instance. It is conflicted with 'password'. | string | false |  
 kms_encryption_context | An KMS encryption context used to decrypt 'kms_encrypted_password' before creating or updating an instance with 'kms_encrypted_password'. | map(string) | false |  
 name | Name to be used on all resources as prefix. Default to 'TF-Module-ECS-Instance'. The final default name would be TF-Module-ECS-Instance001, TF-Module-ECS-Instance002 and so on. | string | false |  
 number_of_instances | The number of instances to be created. | number | false |  
 password | The password of instance. | string | false |  
 ports | A list of ports open in security group. | list(number) | false |  
 private_ip | Configure Instance private IP address. | string | false |  
 private_ips | A list to configure Instance private IP address | list(string) | false |  
 resource_group_id | The Id of resource group which the instance belongs. | string | false |  
 role_name | Instance RAM role name. The name is provided and maintained by RAM. You can use 'alicloud_ram_role' to create a new one. | string | false |  
 security_enhancement_strategy | The security enhancement strategy. | string | false |  
 security_group_ids | A list of security group ids to associate with. | list(string) | false |  
 spot_price_limit | The hourly price threshold of a instance, and it takes effect only when parameter 'spot_strategy' is 'SpotWithPriceLimit'. Three decimals is allowed at most. | number | false |  
 spot_strategy | The spot strategy of a Pay-As-You-Go instance, and it takes effect only when parameter 'instance_charge_type' is 'PostPaid'. Value range: 'NoSpot': A regular Pay-As-You-Go instance. 'SpotWithPriceLimit': A price threshold for a spot instance. 'SpotAsPriceGo': A price that is based on the highest Pay-As-You-Go instance. | string | false |  
 subscription | A mapping of fields for Prepaid ECS instances created.  | map(string) | false |  
 system_disk_auto_snapshot_policy_id | The ID of the automatic snapshot policy applied to the system disk. | string | false |  
 system_disk_category | The system disk category used to launch one or more ecs instances. | string | false |  
 system_disk_size | The system disk size used to launch one or more ecs instances. | number | false |  
 tags | A mapping of tags to assign to the resource. | map(string) | false |  
 use_num_suffix | Always append numerical suffix(like 001, 002 and so on) to instance name and host name, even if number_of_instances is 1. | bool | false |  
 user_data_path | User data to pass to instance on boot. | string | false |  
 volume_tags | A mapping of tags to assign to the devices created by the instance at launch time. | map(string) | false |  
 vswitch_id | The virtual switch ID to launch in VPC. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
