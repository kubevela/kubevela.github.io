---
title:  Azure VIRTUAL-NETWORK
---

## Description

Azure Virtual Network

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 resource_group_name | The name of an existing resource group to be imported. | string | true |  
 address_space | The address space that is used by the virtual network. | string | false |  
 address_spaces | The list of the address spaces that is used by the virtual network. | list(string) | false |  
 dns_servers | The DNS servers to be used with vNet. | list(string) | false |  
 tags | The tags to associate with your network and subnets. | map(string) | false |  
 vnet_name | Name of the vnet to create. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
