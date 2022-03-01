---
title:  Gcp-Helmrepo
---

## Description

A helm repository

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 common_tags | This is a map type for applying tags on resources | map(any) | true |  
 bucket_name | The name of the bucket | string | true |  
 project | The GCP project | string | true |  
 binding | Permissions to set on the bucket |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
