---
title:  Alibaba Cloud KUBERNETES-NETWORKING
---

## Description

Create a set of network environment related resources for Kubernetes clusters on AliCloud based on Terraform module

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 availability_zones | List available zones to launch several VSwitches. | list(string) | false |  
 create | Whether to create kubernetes networking resources. | bool | false |  
 eip_bandwidth | The eip bandwidth. | number | false |  
 eip_instance_charge_type | (Deprecated from version 1.3.0) Elastic IP instance charge type. | string | false |  
 eip_internet_charge_type | Internet charge type of the EIP, Valid values are `PayByBandwidth`, `PayByTraffic`.  | string | false |  
 eip_name | The name prefix used to launch the eip.  | string | false |  
 eip_payment_type | The billing method of the NAT gateway. | string | false |  
 eip_period | The duration that you will buy the EIP, in month. | number | false |  
 eip_tags | The tags used to launch the eip. | map(string) | false |  
 existing_vpc_id | An existing vpc id used to create several vswitches and other resources. | string | false |  
 nat_gateway_name | The name prefix used to launch the nat gateway. | string | false |  
 nat_instance_charge_type | (Deprecated from version 1.3.0) The charge type of the nat gateway. Choices are 'PostPaid' and 'PrePaid'. | string | false |  
 nat_internet_charge_type | The internet charge type. Valid values PayByLcu and PayBySpec. | string | false |  
 nat_payment_type | The billing method of the NAT gateway. | string | false |  
 nat_period | The charge duration of the PrePaid nat gateway, in month. | number | false |  
 nat_specification | The specification of nat gateway. | string | false |  
 nat_type | The type of NAT gateway. | string | false |  
 profile | (Deprecated from version 1.2.0) The profile name as set in the shared credentials file. If not set, it will be sourced from the ALICLOUD_PROFILE environment variable. | string | false |  
 region | (Deprecated from version 1.2.0) The region used to launch this module resources. | string | false |  
 shared_credentials_file | (Deprecated from version 1.2.0) This is the path to the shared credentials file. If this is not set and a profile is specified, $HOME/.aliyun/config.json will be used. | string | false |  
 skip_region_validation | (Deprecated from version 1.2.0) Skip static validation of region ID. Used by users of alternative AlibabaCloud-like APIs or users w/ access to regions that are not public (yet). | bool | false |  
 vpc_cidr | The cidr block used to launch a new vpc when 'vpc_id' is not specified. | string | false |  
 vpc_name | The vpc name used to launch a new vpc. | string | false |  
 vpc_tags | The tags used to launch a new vpc. | map(string) | false |  
 vswitch_cidrs | List of cidr blocks used to create several new vswitches when 'vswitch_ids' is not specified. | list(string) | false |  
 vswitch_name | The name prefix used to launch the vswitch.  | string | false |  
 vswitch_tags | The tags used to launch serveral vswitches. | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
