---
title:  Gcp-Memorystore-Redis
---

## 描述

Terraform gcp memorystore redis example

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 project |  |  | false |  
 authorized_network | name of the memorystore authorized network |  | false |  
 display_name | an arbitrary and optional user-provided name for the instance |  | false |  
 enable_apis | enable redis api | string | false |  
 region | gcp region to use |  | false |  
 tier | the service tier of the instance |  | false |  
 location_id | The zone where the instance will be provisioned |  | false |  
 alternative_location_id | The alternative zone where the instance will be provisioned |  | false |  
 reserved_ip_range | the CIDR range of internal addresses that are reserved for this instance |  | false |  
 environment | Environment to deploy |  | true |  
 memory_size_gb | memory size in GiB |  | false |  
 redis_version | the version of Redis software |  | false |  
 labels | resource labels to represent user provided metadata |  | false |  
 name | name of the memorystore instance |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
