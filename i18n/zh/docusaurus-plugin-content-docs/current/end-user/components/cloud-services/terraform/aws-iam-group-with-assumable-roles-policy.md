---
title:  AWS IAM-GROUP-WITH-ASSUMABLE-ROLES-POLICY
---

## 描述

Terraform module which creates IAM resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 assumable_roles | List of IAM roles ARNs which can be assumed by the group | list(string) | false |  
 group_users | List of IAM users to have in an IAM group which can assume the role | list(string) | false |  
 name | Name of IAM policy and IAM group | string | true |  
 tags | A map of tags to add to all resources. | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
