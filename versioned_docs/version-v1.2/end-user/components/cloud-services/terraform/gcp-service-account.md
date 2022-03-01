---
title:  Gcp-Service-Account
---

## Description

Terraform module that creates a service account to provide Lacework read-only access to Google Cloud Platform Organizations and Projects

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 service_account_name | The service account name | string | false |  
 project_id | A project ID different from the default defined inside the provider | string | false |  
 create | Set to false to prevent the module from creating any resources | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
