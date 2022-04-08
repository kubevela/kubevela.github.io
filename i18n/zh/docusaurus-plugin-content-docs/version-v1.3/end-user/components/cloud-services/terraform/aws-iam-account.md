---
title:  AWS IAM-ACCOUNT
---

## 描述

Terraform module which creates IAM resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 account_alias | AWS IAM account alias for this account | string | true |  
 allow_users_to_change_password | Whether to allow users to change their own password | bool | false |  
 create_account_password_policy | Whether to create AWS IAM account password policy | bool | false |  
 get_caller_identity | Whether to get AWS account ID, User ID, and ARN in which Terraform is authorized | bool | false |  
 hard_expiry | Whether users are prevented from setting a new password after their password has expired (i.e. require administrator reset) | bool | false |  
 max_password_age | The number of days that an user password is valid. | number | false |  
 minimum_password_length | Minimum length to require for user passwords | number | false |  
 password_reuse_prevention | The number of previous passwords that users are prevented from reusing | number | false |  
 require_lowercase_characters | Whether to require lowercase characters for user passwords | bool | false |  
 require_numbers | Whether to require numbers for user passwords | bool | false |  
 require_symbols | Whether to require symbols for user passwords | bool | false |  
 require_uppercase_characters | Whether to require uppercase characters for user passwords | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
