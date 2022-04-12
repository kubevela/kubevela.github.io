---
title:  AWS KEY-PAIR
---

## Description

Terraform module which creates EC2 key pair on AWS

## Specification

### Properties  
 Name | Description | Type | Required | Default 
------------|------------|------------|------------|------------
 create_key_pair | Controls if key pair should be created | bool | false |  
 key_name | The name for the key pair. | string | false |  
 key_name_prefix | Creates a unique name beginning with the specified prefix. Conflicts with key_name. | string | false |  
 public_key | The public key material. | string | false |  
 tags | A map of tags to add to key pair resource. | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
