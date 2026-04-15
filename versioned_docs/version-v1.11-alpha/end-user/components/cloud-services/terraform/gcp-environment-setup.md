---
title:  Gcp-Environment-Setup
---

## Description

IAC for provisioning Infrastructure component like network, subnetworks, route 

## Specification

### Properties  
 Name | Description | Type | Required | Default 
------------|------------|------------|------------|------------
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
