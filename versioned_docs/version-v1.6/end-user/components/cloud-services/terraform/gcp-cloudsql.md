---
title:  Gcp-Cloudsql
---

## Description

A module to create a private database setup

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 database | A list of objects that describes if any databases to be created | list(object({\n    name = string\n  })) | false |  
 instance |  | map(any) | false |  
 name | The name of the database instance | string | true |  
 network_name | The name of the VCP to provision this in to | string | true |  
 project | The name of the GCP project | string | true |  
 require_ssl | Require SSL connections or not. | bool | false |  
 users | A list of user that belong to a database instance | list(object({\n    name     = string\n    password = string\n  })) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
