---
title:  阿里云 VPC-ECS-EIP
---

## 描述

Create a lightweight WEB service based on Terraform under AliCloud's VPC, including: VPC, ECS, EIP。

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 availability_zone | The available zone to launch modules。 | string | false |  
 category | The specification of the category。 | string | false |  
 cidr_block | The cidr block of VPC。 | string | false |  
 data_disks_name | The name of the data disk。 | string | false |  
 description | The specification of module description。 | string | false |  
 ecs_size | The specification of the ecs size。 | number | false |  
 eip_instance_type | The instance type of EIP。 | string | false |  
 eip_internet_charge_type | The specification of the eip internet charge type。 | string | false |  
 eip_isp | The ISP of EIP address。 | string | false |  
 eip_payment_type | The payment type of EIP address。 | string | false |  
 encrypted | Encrypted the data in this disk。 | bool | false |  
 image_id | The specification of the image id。 | string | false |  
 instance_type | The specification of the instance type。 | string | false |  
 internet_max_bandwidth_out | The specification of the internet max bandwidth out。 | number | false |  
 name | The specification of module name。 | string | false |  
 primary_ip_address | The primary private IP address of the ENI. The specified IP address must be available within the CIDR block of the VSwitch. If this parameter is not specified, an available IP address is assigned from the VSwitch CIDR block at random。 | string | false |  
 secondary_private_ip_address_count | The secondary private ip address count of EIP。 | number | false |  
 system_disk_category | The specification of the system disk category。 | string | false |  
 system_disk_description | The specification of the system disk description。 | string | false |  
 system_disk_name | The specification of the system disk name。 | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to。 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to。 | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to。 | string | false |  
