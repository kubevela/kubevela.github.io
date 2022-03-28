---
title:  Gcp-Cloudfunction
---

## 描述

For your cloud functions to GCP

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 location |  | string | false |  
 common_tags | This is to help you add tags to your cloud objects | map(any) | true |  
 lambda | A map object that populates the majority of cloudfunction settings | map(any) | true |  
 project | GCP project | string | true |  
 region | GCP region | string | true |  
 sourcezippath | Full path to source zip file  | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
