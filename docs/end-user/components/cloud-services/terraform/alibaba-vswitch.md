---
title:  Alibaba Cloud VSWITCH
---

## Description

Terraform configuration for Alibaba Cloud VSwitch

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_vpc | Whether to create vpc. If false, you can specify an existing vpc by setting 'vpc_id'. | bool | false |  
 vpc_cidr | The cidr block used to launch a new vpc. | string | false |  
 vpc_description | The vpc description used to launch a new vpc. | string | false |  
 vpc_id | The vpc id used to launch several vswitches. If set, the 'create' will be ignored. | string | false |  
 vpc_name | The vpc name used to launch a new vpc. | string | false |  
 vswitch_cidr | cidr blocks used to launch a new vswitch. | string | false |  
 vswitch_description | The vswitch description used to launch several new vswitch. | string | false |  
 vswitch_name | The vswitch name prefix used to launch several new vswitches. |  | false |  
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
 VPC_ID | VPC ID
 VSWITCH_ID | VSwitch ID
