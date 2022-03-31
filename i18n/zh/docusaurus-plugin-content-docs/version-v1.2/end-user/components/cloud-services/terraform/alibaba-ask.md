---
title:  阿里云 ASK
---

## 描述

用于部署阿里云 Serverless Kubernetes (ASK) 的组件说明

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | ASK name | string | false |  
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
 RESOURCE_IDENTIFIER | The identifier of the resource
 Name | Cluster Name
 API_SERVER_INTRANET | The API server intranet address of the kubernetes cluster.
 API_SERVER_INTERNET | The API server internet address of the kubernetes cluster.
 KUBECONFIG | The KubeConfig string of the kubernetes cluster.
