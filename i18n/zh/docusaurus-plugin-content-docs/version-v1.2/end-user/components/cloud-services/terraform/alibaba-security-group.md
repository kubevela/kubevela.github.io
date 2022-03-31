---
title:  阿里云 SECURITY-GROUP
---

## 描述

Terraform configuration for Alicloud SecurityGroup

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 description | The description of the security group rule | string | false |  
 port_range | The port range of the security group rule | string | false |  
 cidr_ip | cidr blocks used to create a new security group rule | string | false |  
 zone_id | Availability Zone ID | string | false |  
 name | The name of the security group rule | string | false |  
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
 SECURITY_GROUP_ID | Security Group ID
 VSWITCH_ID | VSwitch ID
 VPC_ID | VPC ID
