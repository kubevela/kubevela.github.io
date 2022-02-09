---
title:  AWS IAM-ASSUMABLE-ROLES
---

## Description

Terraform module which creates IAM resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 admin_role_requires_mfa | Whether admin role requires MFA | bool | false |  
 poweruser_role_policy_arns | List of policy ARNs to use for poweruser role | list(string) | false |  
 readonly_role_name | IAM role with readonly access | string | false |  
 readonly_role_requires_mfa | Whether readonly role requires MFA | bool | false |  
 readonly_role_policy_arns | List of policy ARNs to use for readonly role | list(string) | false |  
 readonly_role_tags | A map of tags to add to readonly role resource. | map(string) | false |  
 trusted_role_services | AWS Services that can assume these roles | list(string) | false |  
 admin_role_path | Path of admin IAM role | string | false |  
 admin_role_policy_arns | List of policy ARNs to use for admin role | list(string) | false |  
 poweruser_role_tags | A map of tags to add to poweruser role resource. | map(string) | false |  
 readonly_role_permissions_boundary_arn | Permissions boundary ARN to use for readonly role | string | false |  
 max_session_duration | Maximum CLI/API session duration in seconds between 3600 and 43200 | number | false |  
 admin_role_name | IAM role with admin access | string | false |  
 create_admin_role | Whether to create admin role | bool | false |  
 admin_role_tags | A map of tags to add to admin role resource. | map(string) | false |  
 poweruser_role_requires_mfa | Whether poweruser role requires MFA | bool | false |  
 create_readonly_role | Whether to create readonly role | bool | false |  
 readonly_role_path | Path of readonly IAM role | string | false |  
 trusted_role_arns | ARNs of AWS entities who can assume these roles | list(string) | false |  
 admin_role_permissions_boundary_arn | Permissions boundary ARN to use for admin role | string | false |  
 create_poweruser_role | Whether to create poweruser role | bool | false |  
 poweruser_role_name | IAM role with poweruser access | string | false |  
 poweruser_role_path | Path of poweruser IAM role | string | false |  
 poweruser_role_permissions_boundary_arn | Permissions boundary ARN to use for poweruser role | string | false |  
 force_detach_policies | Whether policies should be detached from this role when destroying | bool | false |  
 mfa_age | Max age of valid MFA (in seconds) for roles which require MFA | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
