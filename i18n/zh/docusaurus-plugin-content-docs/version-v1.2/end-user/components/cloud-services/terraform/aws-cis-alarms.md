---
title:  AWS CIS-ALARMS
---

## 描述

Terraform module which creates Cloudwatch resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create | Whether to create the Cloudwatch log metric filter and metric alarms | bool | false |  
 alarm_actions | List of ARNs to put as Cloudwatch Alarms actions (eg, ARN of SNS topic) | list(string) | false |  
 actions_enabled | Indicates whether or not actions should be executed during any changes to the alarm's state. | bool | false |  
 use_random_name_prefix | Whether to prefix resource names with random prefix | bool | false |  
 name_prefix | A name prefix for the cloudwatch alarm (if use_random_name_prefix is true, this will be ignored) | string | false |  
 disabled_controls | List of IDs of disabled CIS controls | list(string) | false |  
 namespace | The namespace where metric filter and metric alarm should be cleated | string | false |  
 log_group_name | The name of the log group to associate the metric filter with | string | false |  
 tags | A mapping of tags to assign to all resources | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
