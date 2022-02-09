---
title:  AWS ECS
---

## Description

Terraform module which creates AWS ECS resources

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_ecs | Controls if ECS should be created | bool | false |  
 name | Name to be used on all the resources as identifier, also the name of the ECS cluster | string | false |  
 capacity_providers | List of short names of one or more capacity providers to associate with the cluster. Valid values also include FARGATE and FARGATE_SPOT. | list(string) | false |  
 default_capacity_provider_strategy | The capacity provider strategy to use by default for the cluster. Can be one or more. | list(map(any)) | false |  
 container_insights | Controls if ECS Cluster has container insights enabled | bool | false |  
 tags | A map of tags to add to ECS Cluster | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
