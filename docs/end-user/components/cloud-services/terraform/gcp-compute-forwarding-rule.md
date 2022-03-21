---
title:  Gcp-Compute-Forwarding-Rule
---

## Description

GCP Compute-Forwarding-Rule

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 instances_self_link | List of instance self links | list | false |  
 disable | Do not create load balancer and its resources |  | false |  
 name_prefix | Name Prefix |  | false |  
 labels | Add custom labels to all resources | map | false |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 name_format | printf style format for naming the ELB. Gets truncated to 32 characters. (input cluster_name) |  | false |  
 rules | List of rules. By default HTTP and HTTPS are set. If set it overrides the default rules. | list | false |  
 additional_rules | List of additional rules |  | false |  
 health_check | Health check definition. Setting partial keys is allowed. E.g. only setting `port` or `request_path` |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
