---
title:  Gcp-Sfabric
---

## Description

Terraform module for launching a Service Fabric Dev Environment on GCP

## Specification

### Properties  
 Name | Description | Type | Required | Default 
------------|------------|------------|------------|------------
 region | The region to create the nat gateway instance in. |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
