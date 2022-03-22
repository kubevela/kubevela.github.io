---
title:  Alibaba Cloud SAE-APPLICATION
---

## Description

Alibaba SAE application

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 namespace_name | Namespace Name | string | true |  
 namespace_id | Namespace ID | string | true |  
 description | The description of the security group rule | string | false |  
 app_name | The name of the application | string | true |  
 memory | The memory of the application, in unit of MB | string | false |  
 package_type | The package type of the application | string | false |  
 namespace_description | Namespace Description |  | false |  
 port_range | The port range of the security group rule | string | false |  
 zone_id | Availability Zone ID | string | false |  
 image_url | The image url of the application, like `registry.cn-hangzhou.aliyuncs.com/google_containers/nginx-slim:0.9` | string | true |  
 name | The name of the security group rule | string | false |  
 cidr_ip | cidr blocks used to create a new security group rule | string | false |  
 app_description | The description of the application | string | false |  
 cpu | The cpu of the application, in unit of millicore | string | false |  
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
 namespace_id | Namespace ID
 app_id | The id of the application
 app_name | The name of the application
