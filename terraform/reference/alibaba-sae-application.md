---
title:  Alibaba Cloud SAE-APPLICATION
---

## Description

Alibaba SAE application.

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 app_description | The description of the application. | string | false |  
 app_name | The name of the application. | string | true |  
 cidr_ip | cidr blocks used to create a new security group rule. | string | false |  
 cpu | The cpu of the application, in unit of millicore. | string | false |  
 description | The description of the security group rule. | string | false |  
 image_url | The image url of the application, like `registry.cn-hangzhou.aliyuncs.com/google_containers/nginx-slim:0.9`. | string | true |  
 memory | The memory of the application, in unit of MB. | string | false |  
 name | The name of the security group rule. | string | false |  
 namespace_description | Namespace Description. |  | false |  
 namespace_id | Namespace ID. | string | true |  
 namespace_name | Namespace Name. | string | true |  
 package_type | The package type of the application. | string | false |  
 port_range | The port range of the security group rule. | string | false |  
 replicas | The replicas of the application. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_id | Availability Zone ID. | string | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to. | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description 
 ------------ | ------------- 
 app_id | The id of the application
 app_name | The name of the application
 namespace_id | Namespace ID
