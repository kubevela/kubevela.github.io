---
title:  Gcp-Cloudsql
---

## 描述

A module to create a private database setup

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 instance |  | map(any) | false |  
 require_ssl | Require SSL connections or not. | bool | false |  
 network_name | The name of the VCP to provision this in to | string | true |  
 project | The name of the GCP project | string | true |  
 name | The name of the database instance | string | true |  
 database | A list of objects that describes if any databases to be created | list(object({
    name = string
  })) | false |  
 users | A list of user that belong to a database instance | list(object({
    name     = string
    password = string
  })) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
