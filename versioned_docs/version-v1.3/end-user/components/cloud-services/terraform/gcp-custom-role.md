---
title:  Gcp-Custom-Role
---

## Description

Base IAM role module to create GCP IAM Role from other roles and adhoc permissions

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 description | Role readable description |  | true |  
 permissions | Permissions to be merged into developer role | list(string) | false |  
 project | Google cloud project name |  | true |  
 remove_permissions | In some cases, the roles contains permissions which are not needed, remove them with this list | list(string) | false |  
 role_id | Role IAM ID |  | true |  
 roles | Roles to be merged into developer role | list(string) | false |  
 title | Role readable title |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
