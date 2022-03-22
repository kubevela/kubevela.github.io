---
title:  Gcp-Storage
---

## Description

A basic terraform module example, which the example uses for a helm repo

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 location | Where the bucket is | string | false |  
 kms_key | Which key to encrypt with | string | false |  
 predefined_acl |  | string | false |  
 versioning |  | map(any) | false |  
 bucket_name | The name of the bucket | string | true |  
 force_destroy | Flag to set to destroy buckets with content | bool | false |  
 binding_role |  |  | true |  
 binding_members |  |  | true |  
 common_tags | This is to help you add tags to your cloud objects | map(any) | true |  
 project | The GCP projec name | string | true |  
 acl | Flag to create and ACL or not, alternative is to use a bucket policy/binding | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
