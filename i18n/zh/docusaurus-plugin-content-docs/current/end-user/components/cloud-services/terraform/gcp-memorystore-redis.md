---
title:  Gcp-Memorystore-Redis
---

## 描述

Terraform gcp memorystore redis example

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 tier | the service tier of the instance |  | false |  
 labels | resource labels to represent user provided metadata |  | false |  
 memory_size_gb | memory size in GiB |  | false |  
 location_id | The zone where the instance will be provisioned |  | false |  
 reserved_ip_range | the CIDR range of internal addresses that are reserved for this instance |  | false |  
 authorized_network | name of the memorystore authorized network |  | false |  
 alternative_location_id | The alternative zone where the instance will be provisioned |  | false |  
 redis_version | the version of Redis software |  | false |  
 display_name | an arbitrary and optional user-provided name for the instance |  | false |  
 project |  |  | false |  
 environment | Environment to deploy |  | true |  
 region | gcp region to use |  | false |  
 name | name of the memorystore instance |  | true |  
 enable_apis | enable redis api | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
