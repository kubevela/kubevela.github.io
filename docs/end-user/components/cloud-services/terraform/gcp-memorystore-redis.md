---
title:  Gcp-Memorystore-Redis
---

## Description

Terraform gcp memorystore redis example

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 project |  |  | false |  
 display_name | an arbitrary and optional user-provided name for the instance |  | false |  
 reserved_ip_range | the CIDR range of internal addresses that are reserved for this instance |  | false |  
 region | gcp region to use |  | false |  
 memory_size_gb | memory size in GiB |  | false |  
 labels | resource labels to represent user provided metadata |  | false |  
 enable_apis | enable redis api | string | false |  
 name | name of the memorystore instance |  | true |  
 authorized_network | name of the memorystore authorized network |  | false |  
 tier | the service tier of the instance |  | false |  
 environment | Environment to deploy |  | true |  
 location_id | The zone where the instance will be provisioned |  | false |  
 alternative_location_id | The alternative zone where the instance will be provisioned |  | false |  
 redis_version | the version of Redis software |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
