---
title:  阿里云 VSWITCH
---

## 描述

用于部署阿里云 VSwitch 的组件说明

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_vpc | Whether to create vpc. If false, you can specify an existing vpc by setting 'vpc_id'. | bool | false |  
 vpc_cidr | The cidr block used to launch a new vpc. | string | false |  
 vpc_description | The vpc description used to launch a new vpc. | string | false |  
 vpc_id | The vpc id used to launch several vswitches. If set, the 'create' will be ignored. | string | false |  
 vpc_name | The vpc name used to launch a new vpc. | string | false |  
 vswitch_cidr | cidr blocks used to launch a new vswitch. | string | false |  
 vswitch_description | The vswitch description used to launch several new vswitch. | string | false |  
 vswitch_name | The vswitch name prefix used to launch several new vswitches. |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_id | Availability Zone ID | string | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述 
 ------------ | ------------- 
 VPC_ID | VPC ID
 VSWITCH_ID | VSwitch ID
