---
title:  Gcp-Staticip
---

## 描述

A simple Terraform module to build an instance a static public IP

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 image | Instance Image | map(any) | false |  
 machine_type | Instance machine type | string | false |  
 zone | GCP Zone | string | false |  
 common_tags | This is a map type for applying tags on resources | map(any) | true |  
 name | Name of the instance |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
