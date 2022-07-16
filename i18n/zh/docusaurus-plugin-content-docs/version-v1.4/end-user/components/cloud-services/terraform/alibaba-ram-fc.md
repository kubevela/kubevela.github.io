---
title:  阿里云 RAM-FC
---

## 描述

Create a functional computing service based on Terraform under AliCloud's RAM role。

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 document | Authorization strategy of the RAM role。 | string | false |  
 fc_service_description | The specification of module fc service description。 | string | false |  
 force | This parameter is used for resource destroy。 | bool | false |  
 logstore | The specification of logstore。 | string | false |  
 name | The specification of module name。 | string | false |  
 policy_name | The specification of module ram role description。 | string | false |  
 policy_type | The specification of module policy type。 | string | false |  
 project | The specification of project。 | string | false |  
 ram_role_description | The specification of module ram role description。 | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to。 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to。 | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to。 | string | false |  
