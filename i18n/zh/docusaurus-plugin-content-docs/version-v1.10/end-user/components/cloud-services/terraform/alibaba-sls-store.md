---
title:  阿里云 SLS-STORE
---

## 描述

用于部署阿里云 SLS Store 的组件说明。

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-sls-store-sample
spec:
  components:
    - name: sample-sls-store
      type: alibaba-sls-store
      properties:
        store_name: kubevela-1111
        store_retention_period: 30
        store_shard_count: 2
        store_max_split_shard_count: 2

        writeConnectionSecretToRef:
          name: sls-store-conn
```

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_project | Whether to create log resources。 | string | false |  
 description | Description of security group。 | string | false |  
 project_name | Name of security group. It is used to create a new security group。 | string | false |  
 store_append_meta | Determines whether to append log meta automatically. The meta includes log receive time and client IP address. Default to true。 | bool | false |  
 store_auto_split | Determines whether to automatically split a shard. Default to true。 | bool | false |  
 store_max_split_shard_count | The maximum number of shards for automatic split, which is in the range of 1 to 64. You must specify this parameter when autoSplit is true。 | number | false |  
 store_name | Log store name。 | string | false |  
 store_retention_period | The data retention time (in days). Valid values: [1-3650]. Default to 30. Log store data will be stored permanently when the value is '3650'。 | number | false |  
 store_shard_count | The number of shards in this log store. Default to 2. You can modify it by 'Split' or 'Merge' operations。 | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to。 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to。 | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to。 | string | false |  
