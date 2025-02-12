---
title:  Gcp-Storage
---

## Description

A basic terraform module example, which the example uses for a helm repo

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 acl | Flag to create and ACL or not, alternative is to use a bucket policy/binding | number | false |  
 binding_members |  |  | true |  
 binding_role |  |  | true |  
 bucket_name | The name of the bucket | string | true |  
 common_tags | This is to help you add tags to your cloud objects | map(any) | true |  
 force_destroy | Flag to set to destroy buckets with content | bool | false |  
 kms_key | Which key to encrypt with | string | false |  
 location | Where the bucket is | string | false |  
 predefined_acl |  | string | false |  
 project | The GCP projec name | string | true |  
 versioning |  | map(any) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
