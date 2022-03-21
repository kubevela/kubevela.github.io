---
title:  AWS IAM-NOFILE
---

## 描述

Terraform module Terraform module for creating AWS IAM Roles with heredocs

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | Resource name | string | true |  
 type | IAM Role type: ec2/lambda/etc. Used for assume_role_policy principal; service names that have *.amazonaws.com identifiers should work. | string | true |  
 policy_json | IAM Role Policy Document (JSON) | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
