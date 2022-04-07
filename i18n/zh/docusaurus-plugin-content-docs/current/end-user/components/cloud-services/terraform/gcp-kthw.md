---
title:  Gcp-Kthw
---

## 描述

Kubernetes Cluster On GCP with Terraform

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 kube_api_port |  |  | false |  
 machines |  | map | false |  
 network |  | map | false |  
 number_of_controller |  |  | false |  
 number_of_worker |  |  | false |  
 project |  |  | false |  
 region |  |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zones |  | list | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
