---
title:  Alibaba Cloud RAM-FC
---

## Description

Create a functional computing service based on Terraform under AliCloud's RAM role

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 policy_type | The specification of module policy type. | string | false |  
 logstore | The specification of logstore. | string | false |  
 project | The specification of project. | string | false |  
 name | The specification of module name. | string | false |  
 document | Authorization strategy of the RAM role. | string | false |  
 ram_role_description | The specification of module ram role description. | string | false |  
 force | This parameter is used for resource destroy | bool | false |  
 policy_name | The specification of module ram role description. | string | false |  
 fc_service_description | The specification of module fc service description. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
