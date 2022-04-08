---
title:  Gcp-Googlecomputeinstance
---

## 描述

First step using GCP and Terraform

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 common_tags | Implements the common tags scheme | list(any) | true |  
 image |  | string | false |  
 machine_type |  | string | false |  
 project_id | GCP project ID | string | true |  
 region | GCP region | string | true |  
 username | I think you'll figure this one out | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone | GCP zone | string | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
