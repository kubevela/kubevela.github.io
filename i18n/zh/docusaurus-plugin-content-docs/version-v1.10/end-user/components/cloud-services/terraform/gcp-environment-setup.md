---
title:  Gcp-Environment-Setup
---

## 描述

IAC for provisioning Infrastructure component like network, subnetworks, route 

## 参数说明

### 属性  
 名称 | 描述 | 类型 | 是否必须 | 默认值 
------------|------------|------------|------------|------------
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
