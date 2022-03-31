---
title:  AWS IAM-ASSUMABLE-ROLES-WITH-SAML
---

## 描述

Terraform module which creates IAM resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 provider_id | ID of the SAML Provider. Use provider_ids to specify several IDs. | string | false |  
 poweruser_role_name | IAM role with poweruser access | string | false |  
 readonly_role_name | IAM role with readonly access | string | false |  
 readonly_role_tags | A map of tags to add to readonly role resource. | map(string) | false |  
 force_detach_policies | Whether policies should be detached from this role when destroying | bool | false |  
 provider_ids | List of SAML Provider IDs | list(string) | false |  
 admin_role_path | Path of admin IAM role | string | false |  
 create_poweruser_role | Whether to create poweruser role | bool | false |  
 poweruser_role_permissions_boundary_arn | Permissions boundary ARN to use for poweruser role | string | false |  
 readonly_role_path | Path of readonly IAM role | string | false |  
 readonly_role_policy_arns | List of policy ARNs to use for readonly role | list(string) | false |  
 max_session_duration | Maximum CLI/API session duration in seconds between 3600 and 43200 | number | false |  
 aws_saml_endpoint | AWS SAML Endpoint | string | false |  
 admin_role_name | IAM role with admin access | string | false |  
 admin_role_permissions_boundary_arn | Permissions boundary ARN to use for admin role | string | false |  
 poweruser_role_policy_arns | List of policy ARNs to use for poweruser role | list(string) | false |  
 create_readonly_role | Whether to create readonly role | bool | false |  
 create_admin_role | Whether to create admin role | bool | false |  
 admin_role_policy_arns | List of policy ARNs to use for admin role | list(string) | false |  
 admin_role_tags | A map of tags to add to admin role resource. | map(string) | false |  
 poweruser_role_path | Path of poweruser IAM role | string | false |  
 poweruser_role_tags | A map of tags to add to poweruser role resource. | map(string) | false |  
 readonly_role_permissions_boundary_arn | Permissions boundary ARN to use for readonly role | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
