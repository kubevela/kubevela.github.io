---
title:  AWS IAM-NOFILE
---

## Description

Terraform module Terraform module for creating AWS IAM Roles with heredocs

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | Resource name | string | true |  
 policy_json | IAM Role Policy Document (JSON) | string | true |  
 type | IAM Role type: ec2/lambda/etc. Used for assume_role_policy principal; service names that have *.amazonaws.com identifiers should work. | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
