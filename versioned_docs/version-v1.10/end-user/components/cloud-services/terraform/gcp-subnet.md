---
title:  Gcp-Subnet
---

## Description

 Terraform module for creating Subnets on Google Cloud

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 ip_cidr_range | IP range - format 0.0.0.0/0 |  | true |  
 name | Subnet name |  | true |  
 subnet-region | Zone associated with the subnet. Defaults to the region configured in the provider. |  | false |  
 vpc | VPC to link the subnet to |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
