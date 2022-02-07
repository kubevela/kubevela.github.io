---
title:  Alibaba Cloud SLS-STORE
---

## Description

Terraform configuration for Alibaba Cloud SLS Store

## Samples

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

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 store_auto_split | Determines whether to automatically split a shard. Default to true. | bool | false |  
 store_max_split_shard_count | The maximum number of shards for automatic split, which is in the range of 1 to 64. You must specify this parameter when autoSplit is true. | number | false |  
 store_append_meta | Determines whether to append log meta automatically. The meta includes log receive time and client IP address. Default to true. | bool | false |  
 project_name | Name of security group. It is used to create a new security group. | string | false |  
 description | Description of security group | string | false |  
 store_shard_count | The number of shards in this log store. Default to 2. You can modify it by 'Split' or 'Merge' operations. | number | false |  
 create_project | Whether to create log resources | string | false |  
 store_name | Log store name. | string | false |  
 store_retention_period | The data retention time (in days). Valid values: [1-3650]. Default to 30. Log store data will be stored permanently when the value is '3650'. | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
