---
title:  Gcp-Instance-Module
---

## Description

Lazy GCP instance via Terraform

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 region |  |  | false |  
 project |  |  | true |  
 ssh_user |  |  | true |  
 image |  |  | false |  
 machine_type |  |  | false |  
 preemptible |  |  | false |  
 service_account_file |  |  | false |  
 zone |  |  | false |  
 github_user |  |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
