---
title:  Tencent-Vpc
---

## 描述

Terraform configuration for Tencent Cloud VPC

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 vpc_dns_servers | Specify the vpc dns servers when 'vpc_id' is not specified. | list(string) | false |  
 vpc_tags | Additional tags for the vpc. | map(string) | false |  
 vpc_name | The vpc name used to launch a new vpc when 'vpc_id' is not specified. | string | false |  
 vpc_cidr | The cidr block used to launch a new vpc when 'vpc_id' is not specified. | string | false |  
 vpc_is_multicast | Specify the vpc is multicast when 'vpc_id' is not specified. | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述 
 ------------ | ------------- 
 VPC_ID | The id of vpc.
