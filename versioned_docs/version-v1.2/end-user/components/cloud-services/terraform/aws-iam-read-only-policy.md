---
title:  AWS IAM-READ-ONLY-POLICY
---

## Description

Terraform module which creates IAM resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_policy | Whether to create the IAM policy | bool | false |  
 name | The name of the policy | string | false |  
 path | The path of the policy in IAM | string | false |  
 additional_policy_json | JSON policy document if you want to add custom actions | string | false |  
 allow_cloudwatch_logs_query | Allows StartQuery/StopQuery/FilterLogEvents CloudWatch actions | bool | false |  
 description | The description of the policy | string | false |  
 allowed_services | List of services to allow Get/List/Describe/View options. Service name should be the same as corresponding service IAM prefix. See what it is for each service here https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html | list(string) | true |  
 tags | A map of tags to add to all resources. | map(string) | false |  
 allow_predefined_sts_actions | Allows GetCallerIdentity/GetSessionToken/GetAccessKeyInfo sts actions | bool | false |  
 allow_web_console_services | Allows List/Get/Describe/View actions for services used when browsing AWS console (e.g. resource-groups, tag, health services) | bool | false |  
 web_console_services | List of web console services to allow | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
