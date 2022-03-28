---
title:  Alibaba Cloud ASK
---

## Description

Terraform configuration for Alibaba Cloud Serverless Kubernetes (ASK)

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | ASK name | string | false |  
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
 RESOURCE_IDENTIFIER | The identifier of the resource
 Name | Cluster Name
 API_SERVER_INTRANET | The API server intranet address of the kubernetes cluster.
 API_SERVER_INTERNET | The API server internet address of the kubernetes cluster.
 KUBECONFIG | The KubeConfig string of the kubernetes cluster.
