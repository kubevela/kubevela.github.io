---
title:  阿里云 OSS-WEBSITE
---

## 描述

Alibaba Cloud OSS static webstie bucket

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 acl | OSS bucket ACL, supported 'private', 'public-read', 'public-read-write' | string | false |  
 bucket | OSS bucket name | string | false |  
 error_document | OSS bucket static website error document | string | false |  
 index_document | OSS bucket static website index document | string | false |  
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
 BUCKET_NAME | 
 EXTRANET_ENDPOINT | OSS bucket external endpoint
 INTRANET_ENDPOINT | OSS bucket internal endpoint
