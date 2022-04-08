---
title:  Alibaba Cloud SECURITY-GROUP
---

## Description

Terraform configuration for Alicloud SecurityGroup

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cidr_ip | cidr blocks used to create a new security group rule | string | false |  
 description | The description of the security group rule | string | false |  
 name | The name of the security group rule | string | false |  
 port_range | The port range of the security group rule | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_id | Availability Zone ID | string | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description 
 ------------ | ------------- 
 SECURITY_GROUP_ID | Security Group ID
 VPC_ID | VPC ID
 VSWITCH_ID | VSwitch ID
