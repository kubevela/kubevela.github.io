---
title:  Alibaba Cloud OSS-WEBSITE
---

## Description

Alibaba Cloud OSS static webstie bucket

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 bucket | OSS bucket name | string | false |  
 acl | OSS bucket ACL, supported 'private', 'public-read', 'public-read-write' | string | false |  
 index_document | OSS bucket static website index document | string | false |  
 error_document | OSS bucket static website error document | string | false |  
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
 BUCKET_NAME | 
 EXTRANET_ENDPOINT | OSS bucket external endpoint
 INTRANET_ENDPOINT | OSS bucket internal endpoint
