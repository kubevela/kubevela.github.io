---
title:  AWS IAM-ASSUMABLE-ROLE-WITH-SAML
---

## 描述

Terraform module which creates IAM resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 tags | A map of tags to add to IAM role resources | map(string) | false |  
 role_name_prefix | IAM role name prefix | string | false |  
 number_of_role_policy_arns | Number of IAM policies to attach to IAM role | number | false |  
 provider_id | ID of the SAML Provider. Use provider_ids to specify several IDs. | string | false |  
 aws_saml_endpoint | AWS SAML Endpoint | string | false |  
 role_path | Path of IAM role | string | false |  
 role_policy_arns | List of ARNs of IAM policies to attach to IAM role | list(string) | false |  
 create_role | Whether to create a role | bool | false |  
 max_session_duration | Maximum CLI/API session duration in seconds between 3600 and 43200 | number | false |  
 force_detach_policies | Whether policies should be detached from this role when destroying | bool | false |  
 provider_ids | List of SAML Provider IDs | list(string) | false |  
 role_name | IAM role name | string | false |  
 role_description | IAM Role description | string | false |  
 role_permissions_boundary_arn | Permissions boundary ARN to use for IAM role | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
