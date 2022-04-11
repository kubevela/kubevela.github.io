---
title:  AWS RECORDS
---

## Description

Terraform module which creates Route53 resources on AWS

## Specification

### Properties  
 Name | Description | Type | Required | Default 
------------|------------|------------|------------|------------
 create | Whether to create DNS records | bool | false |  
 private_zone | Whether Route53 zone is private or public | bool | false |  
 records | List of maps of DNS records | any | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_id | ID of DNS zone | string | false |  
 zone_name | Name of DNS zone | string | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
