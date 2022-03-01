---
title:  Gcp-Kthw
---

## Description

Kubernetes Cluster On GCP with Terraform

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 project |  |  | false |  
 region |  |  | false |  
 network |  | map | false |  
 machines |  | map | false |  
 zones |  | list | false |  
 number_of_controller |  |  | false |  
 number_of_worker |  |  | false |  
 kube_api_port |  |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
