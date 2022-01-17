---
title:  Alibaba Cloud VSWITCH
---

## Description

Terraform configuration for Alibaba Cloud VSwitch

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_vpc | Whether to create vpc. If false, you can specify an existing vpc by setting 'vpc_id'. | bool | true |  
 vpc_name | The vpc name used to launch a new vpc. | string | true |  
 vpc_cidr | The cidr block used to launch a new vpc. | string | true |  
 vpc_id | The vpc id used to launch several vswitches. If set, the 'create' will be ignored. | string | true |  
 vswitch_description | The vswitch description used to launch several new vswitch. | string | true |  
 vswitch_name | The vswitch name prefix used to launch several new vswitches. |  | true |  
 vpc_description | The vpc description used to launch a new vpc. | string | true |  
 vswitch_cidr | cidr blocks used to launch a new vswitch. | string | true |  
 zone_id | Availability Zone ID | string | true |  
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
 VSWITCH_ID | 
 VPC_ID | 
