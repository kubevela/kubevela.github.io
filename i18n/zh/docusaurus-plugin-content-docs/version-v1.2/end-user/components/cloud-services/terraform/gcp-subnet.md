---
title:  Gcp-Subnet
---

## 描述

 Terraform module for creating Subnets on Google Cloud

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 subnet-region | Zone associated with the subnet. Defaults to the region configured in the provider. |  | false |  
 ip_cidr_range | IP range - format 0.0.0.0/0 |  | true |  
 name | Subnet name |  | true |  
 vpc | VPC to link the subnet to |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
