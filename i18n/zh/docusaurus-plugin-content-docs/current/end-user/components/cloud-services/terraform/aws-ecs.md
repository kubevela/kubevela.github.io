---
title:  AWS ECS
---

## 描述

Terraform module which creates AWS ECS resources

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 capacity_providers | List of short names of one or more capacity providers to associate with the cluster. Valid values also include FARGATE and FARGATE_SPOT. | list(string) | false |  
 container_insights | Controls if ECS Cluster has container insights enabled | bool | false |  
 create_ecs | Controls if ECS should be created | bool | false |  
 default_capacity_provider_strategy | The capacity provider strategy to use by default for the cluster. Can be one or more. | list(map(any)) | false |  
 name | Name to be used on all the resources as identifier, also the name of the ECS cluster | string | false |  
 tags | A map of tags to add to ECS Cluster | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
