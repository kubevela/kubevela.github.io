---
title:  Gcp-Cloudfunction
---

## Description

For your cloud functions to GCP

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 common_tags | This is to help you add tags to your cloud objects | map(any) | true |  
 lambda | A map object that populates the majority of cloudfunction settings | map(any) | true |  
 location |  | string | false |  
 project | GCP project | string | true |  
 region | GCP region | string | true |  
 sourcezippath | Full path to source zip file  | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
