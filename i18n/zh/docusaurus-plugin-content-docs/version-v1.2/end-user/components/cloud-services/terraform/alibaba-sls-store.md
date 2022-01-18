---
title:  阿里云 SLS-STORE
---

## 描述

Terraform configuration for Alibaba Cloud SLS Store

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 store_name | Log store name. | string | true |  
 store_retention_period | The data retention time (in days). Valid values: [1-3650]. Default to 30. Log store data will be stored permanently when the value is '3650'. | number | true |  
 store_shard_count | The number of shards in this log store. Default to 2. You can modify it by 'Split' or 'Merge' operations. | number | true |  
 store_max_split_shard_count | The maximum number of shards for automatic split, which is in the range of 1 to 64. You must specify this parameter when autoSplit is true. | number | true |  
 description | Description of security group | string | true |  
 create_project | Whether to create log resources | string | true |  
 store_append_meta | Determines whether to append log meta automatically. The meta includes log receive time and client IP address. Default to true. | bool | true |  
 project_name | Name of security group. It is used to create a new security group. | string | true |  
 store_auto_split | Determines whether to automatically split a shard. Default to true. | bool | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
