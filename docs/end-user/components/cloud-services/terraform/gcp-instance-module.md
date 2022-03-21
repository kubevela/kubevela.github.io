---
title:  Gcp-Instance-Module
---

## Description

Lazy GCP instance via Terraform

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 github_user |  |  | true |  
 machine_type |  |  | false |  
 zone |  |  | false |  
 region |  |  | false |  
 service_account_file |  |  | false |  
 project |  |  | true |  
 ssh_user |  |  | true |  
 image |  |  | false |  
 preemptible |  |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
