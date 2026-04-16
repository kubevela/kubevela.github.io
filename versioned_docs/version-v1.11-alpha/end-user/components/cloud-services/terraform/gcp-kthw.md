---
title:  Gcp-Kthw
---

## Description

Kubernetes Cluster On GCP with Terraform

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 kube_api_port |  |  | false |  
 machines |  | map | false |  
 network |  | map | false |  
 number_of_controller |  |  | false |  
 number_of_worker |  |  | false |  
 project |  |  | false |  
 region |  |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zones |  | list | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
