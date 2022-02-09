---
title:  AWS IAM-S3-USER
---

## Description

Terraform module to provision a basic IAM user with permissions to access S3 resources, e.g. to give the user read/write/delete access to the objects in an S3 bucket

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 s3_actions | Actions to allow in the policy | list(string) | false |  
 s3_resources | S3 resources to apply the actions specified in the policy | list(string) | true |  
 force_destroy | Destroy even if it has non-Terraform-managed IAM access keys, login profiles or MFA devices | bool | false |  
 path | Path in which to create the user | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
