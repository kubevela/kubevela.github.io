---
title:  阿里云 VPC-PRIVATELINK-CONNECTION
---

## 描述

Terraform-based for creating VPC networks in AliCloud and creating private network links

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 auto_accept_connection | Whether to automatically accept terminal node connections. | bool | false |  
 connect_bandwidth |  The connection bandwidth. | number | false |  
 vpc_cidr_block | The secondary CIDR blocks for the VPC. | string | false |  
 vpc_name | The name of the VPC. | string | false |  
 vpc_privatelink_bandwidth | The bandwidth of VPC privatelink. | string | false |  
 vpc_privatelink_endpoint_name | The name of the VPC privatelink. | string | false |  
 vpc_privatelink_endpoint_service_description | The description of the VPC privatelink service. | string | false |  
 vpc_security_group_description | The security group description of the VPC. | string | false |  
 vpc_security_group_name | The security group name of the VPC. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
