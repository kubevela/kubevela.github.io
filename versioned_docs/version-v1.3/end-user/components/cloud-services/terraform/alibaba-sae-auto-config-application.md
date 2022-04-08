---
title:  Alibaba Cloud SAE-AUTO-CONFIG-APPLICATION
---

## Description

Alibaba SAE application to be deployed in auto-config mode

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 app_description | The description of the application | string | false |  
 app_name | The name of the application | string | true |  
 cpu | The cpu of the application, in unit of millicore | string | false |  
 image_url | The image url of the application, like `registry.cn-hangzhou.aliyuncs.com/google_containers/nginx-slim:0.9` | string | true |  
 memory | The memory of the application, in unit of MB | string | false |  
 package_type | The package type of the application | string | false |  
 replicas | The replicas of the application | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description 
 ------------ | ------------- 
 app_id | The id of the application
 app_name | The name of the application
