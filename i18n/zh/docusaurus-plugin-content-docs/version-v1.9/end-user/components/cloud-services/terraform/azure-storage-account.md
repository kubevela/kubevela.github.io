---
title:  Azure STORAGE-ACCOUNT
---

## 描述

用于部署 Azure Blob Storage 账号的的组件说明

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: storage-account-dev
spec:
  components:
    - name: storage-account-dev
      type: azure-storage-account
      properties:
        create_rsg: false
        resource_group_name: "weursgappdev01"
        location: "West Europe"
        name: "appdev01"
        tags: |
          {
            ApplicationName       = "Application01"
            Terraform             = "Yes"
          } 
        static_website: |
          [{
            index_document = "index.html"
            error_404_document = "index.html"
          }]

        writeConnectionSecretToRef:
          name: storage-account-dev
          namespace: vela-system
```

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_rsg | Conditional if resource group should be created. Defaults to 'true'. | bool | false |  
 location | Location of storage account. Defaults to 'West Europe'. | string | false |  
 name | Name of storage account. Defaults to 'storageaccount'. | string | false |  
 resource_group_name | Name of resource group. Defaults to 'rsg'. | string | false |  
 static_website | Static website configuration. Defaults to disabled. | list(map(string)) | false |  
 tags | Tags for storage account. Defaults to '{}'. | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述 
 ------------ | ------------- 
 BLOB_CONNECTION_STRING | Blob storage connection string
 BLOB_WEB_ENDPOINT | Blob storage static web endpoint
