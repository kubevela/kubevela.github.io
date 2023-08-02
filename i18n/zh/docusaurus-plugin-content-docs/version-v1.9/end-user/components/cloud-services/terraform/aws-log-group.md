---
title:  AWS LOG-GROUP
---

## 描述

Terraform module which creates Cloudwatch resources on AWS

## 参数说明

### 属性  
 名称 | 描述 | 类型 | 是否必须 | 默认值 
------------|------------|------------|------------|------------
 create | Whether to create the Cloudwatch log group | bool | false |  
 kms_key_id | The ARN of the KMS Key to use when encrypting logs | string | false |  
 name | A name for the log group | string | false |  
 name_prefix | A name prefix for the log group | string | false |  
 retention_in_days | Specifies the number of days you want to retain log events in the specified log group | number | false |  
 tags | A map of tags to add to Cloudwatch log group | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
