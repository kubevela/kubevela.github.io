---
title:  AWS SUBNET
---

## Description

AWS Subnet

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 assign_ipv6_address_on_creation | Assign IPv6 address on subnet, must be disabled to change IPv6 CIDRs. This is the IPv6 equivalent of map_public_ip_on_launch | bool | false |  
 availability_zone | An availability zone name in the region | string | false |  
 cidr | The CIDR block for the VPC. Default value is a valid CIDR, but not acceptable by AWS and should be overridden | string | false |  
 create_vpc | Controls if VPC should be created (it affects almost all resources) | bool | false |  
 enable_classiclink | Should be true to enable ClassicLink for the VPC. Only valid in regions and accounts that support EC2 Classic. | bool | false |  
 enable_classiclink_dns_support | Should be true to enable ClassicLink DNS Support for the VPC. Only valid in regions and accounts that support EC2 Classic. | bool | false |  
 enable_dns_hostnames | Should be true to enable DNS hostnames in the VPC | bool | false |  
 enable_dns_support | Should be true to enable DNS support in the VPC | bool | false |  
 enable_ipv6 | Requests an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC. You cannot specify the range of IP addresses, or the size of the CIDR block. | bool | false |  
 instance_tenancy | A tenancy option for instances launched into the VPC | string | false |  
 ipv6_cidr_block | The IPv6 CIDR block for the VPC. | string | false |  
 map_public_ip_on_launch | Should be false if you do not want to auto-assign public IP on launch | bool | false |  
 name | Name to be used on all the resources as identifier | string | false |  
 subnet_cidr | A list of subnets cidrs inside the VPC | string | false |  
 subnet_tags | A map of tags for the Subnet | map(string) | false |  
 vpc_id | The ID of the VPC | string | false |  
 vpc_tags | Additional tags for the VPC | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
