---
title:  Gcp-Backend-Service
---

## 描述

Create an ILB to be used for DC/OS for GCP

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 instances_self_link | List of instance self links | list | true |  
 allow_ports | ports to allow | list | false |  
 dcos_role | DCOS Role |  | true |  
 project_id | project id |  | true |  
 region | region |  | true |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 network | Network Name |  | true |  
 target_pool | Target Pool |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
