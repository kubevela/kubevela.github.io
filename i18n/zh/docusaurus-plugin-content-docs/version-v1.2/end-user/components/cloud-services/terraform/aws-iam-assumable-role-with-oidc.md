---
title:  AWS IAM-ASSUMABLE-ROLE-WITH-OIDC
---

## 描述

Terraform module which creates IAM resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 role_permissions_boundary_arn | Permissions boundary ARN to use for IAM role | string | false |  
 oidc_fully_qualified_subjects | The fully qualified OIDC subjects to be added to the role policy | set(string) | false |  
 provider_url | URL of the OIDC Provider. Use provider_urls to specify several URLs. | string | false |  
 tags | A map of tags to add to IAM role resources | map(string) | false |  
 role_name_prefix | IAM role name prefix | string | false |  
 role_description | IAM Role description | string | false |  
 role_path | Path of IAM role | string | false |  
 role_policy_arns | List of ARNs of IAM policies to attach to IAM role | list(string) | false |  
 force_detach_policies | Whether policies should be detached from this role when destroying | bool | false |  
 create_role | Whether to create a role | bool | false |  
 aws_account_id | The AWS account ID where the OIDC provider lives, leave empty to use the account for the AWS provider | string | false |  
 oidc_subjects_with_wildcards | The OIDC subject using wildcards to be added to the role policy | set(string) | false |  
 oidc_fully_qualified_audiences | The audience to be added to the role policy. Set to sts.amazonaws.com for cross-account assumable role. Leave empty otherwise. | set(string) | false |  
 max_session_duration | Maximum CLI/API session duration in seconds between 3600 and 43200 | number | false |  
 number_of_role_policy_arns | Number of IAM policies to attach to IAM role | number | false |  
 provider_urls | List of URLs of the OIDC Providers | list(string) | false |  
 role_name | IAM role name | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
