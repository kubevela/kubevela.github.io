---
title:  AWS IAM-SYSTEM-USER
---

## Description

Terraform Module to Provision a Basic IAM System User Suitable for CI/CD Systems (E.g. TravisCI, CircleCI)

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_iam_access_key | Whether or not to create IAM access keys | bool | false |  
 force_destroy | Destroy the user even if it has non-Terraform-managed IAM access keys, login profile or MFA devices | bool | false |  
 iam_access_key_max_age | Maximum age of IAM access key (seconds). Defaults to 30 days. Set to 0 to disable expiration. | number | false |  
 inline_policies | Inline policies to attach to our created user | list(string) | false |  
 inline_policies_map | Inline policies to attach (descriptive key => policy) | map(string) | false |  
 path | Path in which to create the user | string | false |  
 permissions_boundary | Permissions Boundary ARN to attach to our created user | string | false |  
 policy_arns | Policy ARNs to attach to our created user | list(string) | false |  
 policy_arns_map | Policy ARNs to attach (descriptive key => arn) | map(string) | false |  
 ssm_enabled | Whether or not to write the IAM access key and secret key to SSM Parameter Store | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
