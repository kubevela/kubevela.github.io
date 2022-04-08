---
title:  Gcp-Compute-Forwarding-Rule
---

## 描述

GCP Compute-Forwarding-Rule

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 additional_rules | List of additional rules |  | false |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 disable | Do not create load balancer and its resources |  | false |  
 health_check | Health check definition. Setting partial keys is allowed. E.g. only setting `port` or `request_path` |  | false |  
 instances_self_link | List of instance self links | list | false |  
 labels | Add custom labels to all resources | map | false |  
 name_format | printf style format for naming the ELB. Gets truncated to 32 characters. (input cluster_name) |  | false |  
 name_prefix | Name Prefix |  | false |  
 rules | List of rules. By default HTTP and HTTPS are set. If set it overrides the default rules. | list | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
