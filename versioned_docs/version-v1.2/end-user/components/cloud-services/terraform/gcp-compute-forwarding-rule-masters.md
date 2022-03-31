---
title:  Gcp-Compute-Forwarding-Rule-Masters
---

## Description

Creates an GCP forwarding rule for DC/OS masters

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 disable | Do not create load balancer and its resources |  | false |  
 name_prefix | Name Prefix |  | false |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 name_format | printf style format for naming the ELB. Gets truncated to 32 characters. (input cluster_name) |  | false |  
 masters_self_link | List of master instances self links | list | false |  
 additional_rules | List of additional rules |  | false |  
 labels | Add custom labels to all resources | map | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
