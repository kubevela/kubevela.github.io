---
title:  Gcp-Kthw
---

## 描述

Kubernetes Cluster On GCP with Terraform

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 number_of_worker |  |  | false |  
 kube_api_port |  |  | false |  
 project |  |  | false |  
 region |  |  | false |  
 network |  | map | false |  
 machines |  | map | false |  
 zones |  | list | false |  
 number_of_controller |  |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
