---
title:  Alibaba Cloud VPC-PRIVATELINK-CONNECTION
---

## Description

Terraform-based for creating VPC networks in AliCloud and creating private network links

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 auto_accept_connection | Whether to automatically accept terminal node connections. | bool | false |  
 connect_bandwidth |  The connection bandwidth. | number | false |  
 vpc_cidr_block | The secondary CIDR blocks for the VPC. | string | false |  
 vpc_name | The name of the VPC. | string | false |  
 vpc_privatelink_bandwidth | The bandwidth of VPC privatelink. | string | false |  
 vpc_privatelink_endpoint_name | The name of the VPC privatelink. | string | false |  
 vpc_privatelink_endpoint_service_description | The description of the VPC privatelink service. | string | false |  
 vpc_security_group_description | The security group description of the VPC. | string | false |  
 vpc_security_group_name | The security group name of the VPC. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
