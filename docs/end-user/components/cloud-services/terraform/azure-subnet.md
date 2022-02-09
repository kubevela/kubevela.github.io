---
title:  Azure SUBNET
---

## Description

Azure Subnet

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 subnet_enforce_private_link_endpoint_network_policies | A map with key (string) `subnet name`, value (bool) `true` or `false` to indicate enable or disable network policies for the private link endpoint on the subnet. Default value is false. | map(bool) | false |  
 subnet_service_endpoints | A map with key (string) `subnet name`, value (list(string)) to indicate enabled service endpoints on the subnet. Default value is []. | map(list(string)) | false |  
 subnet_prefixes | The address prefix to use for the subnet. | list(string) | false |  
 subnet_names | A list of public subnets inside the vNet. | list(string) | false |  
 tags | The tags to associate with your network and subnets. | map(string) | false |  
 vnet_name | Name of the vnet to create. | string | false |  
 resource_group_name | The name of an existing resource group to be imported. | string | true |  
 address_space | The address space that is used by the virtual network. | string | false |  
 address_spaces | The list of the address spaces that is used by the virtual network. | list(string) | false |  
 dns_servers | The DNS servers to be used with vNet. | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
