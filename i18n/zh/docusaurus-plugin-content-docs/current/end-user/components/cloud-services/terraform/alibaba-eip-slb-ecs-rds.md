---
title:  阿里云 EIP-SLB-ECS-RDS
---

## 描述

Create a lightweight web service based on Terraform under AliCloud's VPC, including: EIP, SLB, ECS, RDS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 ecs_size | The specification of the ecs size. | number | false |  
 availability_zone | The available zone to launch modules. | string | false |  
 monitoring_period | The specification of the monitoring period. | string | false |  
 image_id | The specification of the image id. | string | false |  
 category | The specification of the category. | string | false |  
 engine_version | The specification of the engine version. | string | false |  
 data_disks_name | The name of the data disk. | string | false |  
 eip_internet_charge_type | The specification of the eip internet charge type. | string | false |  
 slb_spec | The specification of the slb spec. | string | false |  
 slb_tags_info | The specification of the slb tags info. | string | false |  
 system_disk_category | The specification of the system disk category. | string | false |  
 system_disk_description | The specification of the system disk description. | string | false |  
 encrypted | Encrypted the data in this disk. | bool | false |  
 instance_storage | The specification of the instance storage. | string | false |  
 system_disk_name | The specification of the system disk name. | string | false |  
 internet_max_bandwidth_out | The specification of the internet max bandwidth out. | number | false |  
 slb_address_type | The specification of the slb intranet. | string | false |  
 description | The specification of module description. | string | false |  
 engine | The specification of the engine. | string | false |  
 rds_instance_type | The specification of the rds instance type. | string | false |  
 name | The specification of module name. | string | false |  
 instance_type | The specification of the instance type. | string | false |  
 vswitch_id | VSwitch variables, if vswitch_id is empty, then the net_type = classic. | string | false |  
 security_group_ids | A list of security group ids to associate with. | list(string) | false |  
 available_disk_category | The specification of available disk category. | string | false |  
 eip_bandwidth | The specification of the eip bandwidth. | string | false |  
 instance_charge_type | The specification of the instance charge type. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
