---
title:  Gcp-Compute-Forwarding-Rule-Dcos
---

## 描述

This module creates forwarding rules for DC/OS.

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 public_agents_additional_rules | Additional list of rules for public agents. These Rules are an additon to the default rules. |  | false |  
 labels | Add custom labels to all resources | map | false |  
 disable_public_agents | [PUBLIC AGENTS] Do not create load balancer and its resources |  | false |  
 masters_additional_rules | Additional list of rules for masters. These Rules are an additon to the default rules. |  | false |  
 name_prefix | Name Prefix |  | false |  
 disable_masters | [MASTERS] Do not create load balancer and its resources |  | false |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 public_agents_self_link | List of public agent instances self links | list | false |  
 masters_self_link | List of master instances self links | list | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
