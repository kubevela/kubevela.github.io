---
title:  AWS ELB
---

## Description

Terraform module which creates ELB resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 internal | If true, ELB will be an internal ELB | bool | false |  
 listener | A list of listener blocks | list(map(string)) | true |  
 name | The name of the ELB | string | false |  
 security_groups | A list of security group IDs to assign to the ELB | list(string) | true |  
 health_check | A health check block | map(string) | true |  
 number_of_instances | Number of instances to attach to ELB | number | false |  
 name_prefix | The prefix name of the ELB | string | false |  
 idle_timeout | The time in seconds that the connection is allowed to be idle | number | false |  
 connection_draining | Boolean to enable connection draining | bool | false |  
 tags | A mapping of tags to assign to the resource | map(string) | false |  
 create_elb | Create the elb or not | bool | false |  
 subnets | A list of subnet IDs to attach to the ELB | list(string) | true |  
 cross_zone_load_balancing | Enable cross-zone load balancing | bool | false |  
 connection_draining_timeout | The time in seconds to allow for connections to drain | number | false |  
 access_logs | An access logs block | map(string) | false |  
 instances | List of instances ID to place in the ELB pool | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
