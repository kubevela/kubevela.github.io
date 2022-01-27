---
title:  Tencent-Vpc
---

## Description

Terraform configuration for Tencent Cloud VPC

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 vpc_name | The vpc name used to launch a new vpc when 'vpc_id' is not specified. | string | false |  
 vpc_cidr | The cidr block used to launch a new vpc when 'vpc_id' is not specified. | string | false |  
 vpc_is_multicast | Specify the vpc is multicast when 'vpc_id' is not specified. | bool | false |  
 vpc_dns_servers | Specify the vpc dns servers when 'vpc_id' is not specified. | list(string) | false |  
 vpc_tags | Additional tags for the vpc. | map(string) | false |  
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
 VPC_ID | The id of vpc.
