---
title:  Tencent-Subnet
---

## Description

Tencent Cloud Subnet

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cidr_block | Subnet CIDR block | string | false |  
 is_multicast | Subnet is multicast | bool | false |  
 availability_zone | Availability Zone | string | false |  
 name | Subnet name | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description 
 ------------ | ------------- 
 SUBNET_ID | Subnet ID
