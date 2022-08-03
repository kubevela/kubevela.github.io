---
title:  Gcp-Sfabric
---

## 描述

Terraform module for launching a Service Fabric Dev Environment on GCP

## 参数说明

### 属性  
 名称 | 描述 | 类型 | 是否必须 | 默认值 
------------|------------|------------|------------|------------
 region | The region to create the nat gateway instance in. |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
