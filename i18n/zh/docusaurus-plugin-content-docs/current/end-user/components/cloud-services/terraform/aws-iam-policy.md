---
title:  AWS IAM-POLICY
---

## 描述

Terraform module which creates IAM resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 policy | The path of the policy in IAM (tpl file) | string | false |  
 tags | A map of tags to add to all resources. | map(string) | false |  
 create_policy | Whether to create the IAM policy | bool | false |  
 name | The name of the policy | string | false |  
 path | The path of the policy in IAM | string | false |  
 description | The description of the policy | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
