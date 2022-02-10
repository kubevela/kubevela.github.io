---
title:  AWS SSM-PARAMETER-STORE
---

## Description

Terraform module to populate AWS Systems Manager (SSM) Parameter Store with values from Terraform. Works great with Chamber.

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 kms_arn | The ARN of a KMS key used to encrypt and decrypt SecretString values | string | false |  
 parameter_write_defaults | Parameter write default settings | map(any) | false |  
 ignore_value_changes | Whether to ignore future external changes in paramater values | bool | false |  
 parameter_read | List of parameters to read from SSM. These must already exist otherwise an error is returned. Can be used with `parameter_write` as long as the parameters are different. | list(string) | false |  
 parameter_write | List of maps with the parameter values to write to SSM Parameter Store | list(map(string)) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
