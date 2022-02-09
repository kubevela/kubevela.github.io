---
title:  AWS IAM-ASSUMABLE-ROLE
---

## Description

Terraform module which creates IAM resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 max_session_duration | Maximum CLI/API session duration in seconds between 3600 and 43200 | number | false |  
 role_permissions_boundary_arn | Permissions boundary ARN to use for IAM role | string | false |  
 trusted_role_actions | Actions of STS | list(string) | false |  
 role_path | Path of IAM role | string | false |  
 tags | A map of tags to add to IAM role resources | map(string) | false |  
 custom_role_trust_policy | A custorm role trust policy | string | false |  
 poweruser_role_policy_arn | Policy ARN to use for poweruser role | string | false |  
 attach_readonly_policy | Whether to attach a readonly policy to a role | bool | false |  
 force_detach_policies | Whether policies should be detached from this role when destroying | bool | false |  
 create_role | Whether to create a role | bool | false |  
 mfa_age | Max age of valid MFA (in seconds) for roles which require MFA | number | false |  
 create_instance_profile | Whether to create an instance profile | bool | false |  
 role_name | IAM role name | string | false |  
 number_of_custom_role_policy_arns | Number of IAM policies to attach to IAM role | number | false |  
 admin_role_policy_arn | Policy ARN to use for admin role | string | false |  
 attach_admin_policy | Whether to attach an admin policy to a role | bool | false |  
 attach_poweruser_policy | Whether to attach a poweruser policy to a role | bool | false |  
 trusted_role_arns | ARNs of AWS entities who can assume these roles | list(string) | false |  
 role_sts_externalid | STS ExternalId condition values to use with a role (when MFA is not required) | any | false |  
 role_requires_mfa | Whether role requires MFA | bool | false |  
 custom_role_policy_arns | List of ARNs of IAM policies to attach to IAM role | list(string) | false |  
 readonly_role_policy_arn | Policy ARN to use for readonly role | string | false |  
 role_description | IAM Role description | string | false |  
 trusted_role_services | AWS Services that can assume these roles | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
