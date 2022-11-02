---
title:  AWS VPC
---

## 描述

AWS VPC

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cidr | The CIDR block for the VPC. Default value is a valid CIDR, but not acceptable by AWS and should be overridden | string | false |  
 create_vpc | Controls if VPC should be created (it affects almost all resources) | bool | false |  
 enable_classiclink | Should be true to enable ClassicLink for the VPC. Only valid in regions and accounts that support EC2 Classic. | bool | false |  
 enable_classiclink_dns_support | Should be true to enable ClassicLink DNS Support for the VPC. Only valid in regions and accounts that support EC2 Classic. | bool | false |  
 enable_dns_hostnames | Should be true to enable DNS hostnames in the VPC | bool | false |  
 enable_dns_support | Should be true to enable DNS support in the VPC | bool | false |  
 enable_ipv6 | Requests an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC. You cannot specify the range of IP addresses, or the size of the CIDR block. | bool | false |  
 instance_tenancy | A tenancy option for instances launched into the VPC | string | false |  
 name | Name to be used on all the resources as identifier | string | false |  
 tags | A map of tags to add to all resources | map(string) | false |  
 vpc_tags | Additional tags for the VPC | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
