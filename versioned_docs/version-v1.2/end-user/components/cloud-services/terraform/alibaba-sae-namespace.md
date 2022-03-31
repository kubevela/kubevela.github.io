---
title:  Alibaba Cloud SAE-NAMESPACE
---

## Description

Alibaba SAE namespace

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 namespace_description | Namespace Description |  | false |  
 namespace_name | Namespace Name | string | true |  
 namespace_id | Namespace ID | string | true |  
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
 namespace_id | Namespace ID
