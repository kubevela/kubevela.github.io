---
title:  阿里云 SAE-AUTO-CONFIG-APPLICATION
---

## 描述

Alibaba SAE application to be deployed in auto-config mode

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
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

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述 
 ------------ | ------------- 
 app_id | The id of the application
 app_name | The name of the application
