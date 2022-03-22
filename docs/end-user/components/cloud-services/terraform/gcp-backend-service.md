---
title:  Gcp-Backend-Service
---

## Description

Create an ILB to be used for DC/OS for GCP

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 dcos_role | DCOS Role |  | true |  
 project_id | project id |  | true |  
 region | region |  | true |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 network | Network Name |  | true |  
 target_pool | Target Pool |  | true |  
 instances_self_link | List of instance self links | list | true |  
 allow_ports | ports to allow | list | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
