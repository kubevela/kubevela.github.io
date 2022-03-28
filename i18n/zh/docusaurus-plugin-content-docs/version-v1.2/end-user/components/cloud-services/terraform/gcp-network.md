---
title:  Gcp-Network
---

## 描述

Terraform configuration for GCP network

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 description | An optional description of this resource. The resource must be recreated to modify this field. | string | false |  
 auto_create_subnetworks | When set to true, the network is created in 'auto subnet mode' and it will create a subnet for each region automatically across the 10.128.0.0/9 address range. When set to false, the network is created in 'custom subnet mode' so the user can explicitly connect subnetwork resources. | bool | false |  
 shared_vpc_host | Makes this project a Shared VPC host if 'true' (default 'false') | bool | false |  
 subnets | The list of subnets being created | list(map(string)) | true |  
 firewall_rules | List of firewall rules | any | false |  
 delete_default_internet_gateway_routes | If set, ensure that all routes within the network specified whose names begin with 'default-route' and with a next hop of 'default-internet-gateway' are deleted | bool | false |  
 routes | List of routes being created in this VPC | list(map(string)) | false |  
 mtu | The network MTU. Must be a value between 1460 and 1500 inclusive. If set to 0 (meaning MTU is unset), the network will default to 1460 automatically. | number | false |  
 project_id | The ID of the project where this VPC will be created |  | true |  
 network_name | The name of the network being created |  | true |  
 routing_mode | The network routing mode (default 'GLOBAL') | string | false |  
 secondary_ranges | Secondary ranges that will be used in some of the subnets | map(list(object({ range_name = string, ip_cidr_range = string }))) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
