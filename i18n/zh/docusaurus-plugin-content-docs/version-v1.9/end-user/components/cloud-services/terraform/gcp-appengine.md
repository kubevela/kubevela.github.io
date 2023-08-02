---
title:  Gcp-Appengine
---

## 描述

Get your container running, simply.

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 app | A map of all the service properties | map(any) | true |  
 common_labels | This is to help you add tags to your cloud objects | map(any) | true |  
 location |  | string | false |  
 project | GCP Project | string | true |  
 sourcezip | The Source zip file payload for app engine | string | true |  
 storage_class |  |  | false |  
 versioning | Switch for versioning | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
