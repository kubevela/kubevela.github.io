---
title:  Gcp-Staticip
---

## Description

A simple Terraform module to build an instance a static public IP

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 zone | GCP Zone | string | false |  
 common_tags | This is a map type for applying tags on resources | map(any) | true |  
 name | Name of the instance |  | false |  
 image | Instance Image | map(any) | false |  
 machine_type | Instance machine type | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
