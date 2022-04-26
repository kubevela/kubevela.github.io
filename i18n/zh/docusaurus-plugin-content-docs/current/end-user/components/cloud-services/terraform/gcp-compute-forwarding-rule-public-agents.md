---
title:  Gcp-Compute-Forwarding-Rule-Public-Agents
---

## 描述

This module creates an GCP forwarding rule for DC/OS public agents

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 additional_rules | List of additional rules |  | false |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 disable | Do not create load balancer and its resources |  | false |  
 labels | Add custom labels to all resources | map | false |  
 name_format | printf style format for naming the ELB. Gets truncated to 32 characters. (input cluster_name) |  | false |  
 name_prefix | Name Prefix |  | false |  
 public_agents_self_link | List of public agent instances self links | list | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
