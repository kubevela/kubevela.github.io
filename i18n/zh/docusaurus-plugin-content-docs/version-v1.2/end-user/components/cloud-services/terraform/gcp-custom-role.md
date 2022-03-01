---
title:  Gcp-Custom-Role
---

## 描述

Base IAM role module to create GCP IAM Role from other roles and adhoc permissions

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 role_id | Role IAM ID |  | true |  
 title | Role readable title |  | true |  
 description | Role readable description |  | true |  
 roles | Roles to be merged into developer role | list(string) | false |  
 permissions | Permissions to be merged into developer role | list(string) | false |  
 remove_permissions | In some cases, the roles contains permissions which are not needed, remove them with this list | list(string) | false |  
 project | Google cloud project name |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
