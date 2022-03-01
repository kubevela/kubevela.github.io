---
title:  Gcp-Googlecomputeinstance
---

## Description

First step using GCP and Terraform

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 region | GCP region | string | true |  
 project_id | GCP project ID | string | true |  
 username | I think you'll figure this one out | string | true |  
 common_tags | Implements the common tags scheme | list(any) | true |  
 machine_type |  | string | false |  
 image |  | string | false |  
 zone | GCP zone | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
