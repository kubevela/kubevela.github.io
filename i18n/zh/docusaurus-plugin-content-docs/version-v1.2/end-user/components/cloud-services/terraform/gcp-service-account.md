---
title:  Gcp-Service-Account
---

## 描述

Terraform module that creates a service account to provide Lacework read-only access to Google Cloud Platform Organizations and Projects

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 service_account_name | The service account name | string | false |  
 project_id | A project ID different from the default defined inside the provider | string | false |  
 create | Set to false to prevent the module from creating any resources | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
