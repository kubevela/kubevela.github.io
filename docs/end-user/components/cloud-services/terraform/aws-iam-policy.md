---
title:  AWS IAM-POLICY
---

## Description

Terraform module which creates IAM resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 description | The description of the policy | string | false |  
 policy | The path of the policy in IAM (tpl file) | string | false |  
 tags | A map of tags to add to all resources. | map(string) | false |  
 create_policy | Whether to create the IAM policy | bool | false |  
 name | The name of the policy | string | false |  
 path | The path of the policy in IAM | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
