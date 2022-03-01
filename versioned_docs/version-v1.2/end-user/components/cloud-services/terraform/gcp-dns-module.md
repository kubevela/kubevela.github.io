---
title:  Gcp-Dns-Module
---

## Description

GCP Dns-Module

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 region |  |  | false |  
 service_account_file |  |  | false |  
 zone |  |  | false |  
 dns_name |  |  | true |  
 instance_ip_addr |  |  | true |  
 managed_zone |  |  | true |  
 project |  |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
