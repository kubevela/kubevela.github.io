---
title:  阿里云 SAE-NAMESPACE
---

## 描述

Alibaba SAE namespace。

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 namespace_description | Namespace Description。 |  | false |  
 namespace_id | Namespace ID。 | string | true |  
 namespace_name | Namespace Name。 | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to。 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to。 | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to。 | string | false |  


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述 
 ------------ | ------------- 
 namespace_id | Namespace ID
