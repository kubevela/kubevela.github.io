---
title:  AWS CLOUDWATCH-LOG-GROUP
---

## Description

Terraform module which creates Cloudwatch resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 tags | A map of tags to add to Cloudwatch log group | map(string) | false |  
 create | Whether to create the Cloudwatch log group | bool | false |  
 name | A name for the log group | string | false |  
 name_prefix | A name prefix for the log group | string | false |  
 retention_in_days | Specifies the number of days you want to retain log events in the specified log group | number | false |  
 kms_key_id | The ARN of the KMS Key to use when encrypting logs | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
