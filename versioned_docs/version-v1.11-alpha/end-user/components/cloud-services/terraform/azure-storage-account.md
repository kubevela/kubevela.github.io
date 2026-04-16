---
title:  Azure STORAGE-ACCOUNT
---

## Description

Terraform configuration for Azure Blob Storage Account

## Samples

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

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_rsg | Conditional if resource group should be created. Defaults to 'true'. | bool | false |  
 location | Location of storage account. Defaults to 'West Europe'. | string | false |  
 name | Name of storage account. Defaults to 'storageaccount'. | string | false |  
 resource_group_name | Name of resource group. Defaults to 'rsg'. | string | false |  
 static_website | Static website configuration. Defaults to disabled. | list(map(string)) | false |  
 tags | Tags for storage account. Defaults to '{}'. | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description 
 ------------ | ------------- 
 BLOB_CONNECTION_STRING | Blob storage connection string
 BLOB_WEB_ENDPOINT | Blob storage static web endpoint
