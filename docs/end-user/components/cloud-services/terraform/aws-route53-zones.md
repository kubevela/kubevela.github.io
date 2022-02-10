---
title:  AWS ROUTE53-ZONES
---

## Description

Terraform module which creates Route53 resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 zones | Map of Route53 zone parameters | any | false |  
 tags | Tags added to all zones. Will take precedence over tags from the 'zones' variable | map(any) | false |  
 create | Whether to create Route53 zone | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
