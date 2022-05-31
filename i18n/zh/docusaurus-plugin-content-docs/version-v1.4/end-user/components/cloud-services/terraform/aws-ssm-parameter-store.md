---
title:  AWS SSM-PARAMETER-STORE
---

## 描述

Terraform module to populate AWS Systems Manager (SSM) Parameter Store with values from Terraform. Works great with Chamber.

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 ignore_value_changes | Whether to ignore future external changes in paramater values | bool | false |  
 kms_arn | The ARN of a KMS key used to encrypt and decrypt SecretString values | string | false |  
 parameter_read | List of parameters to read from SSM. These must already exist otherwise an error is returned. Can be used with `parameter_write` as long as the parameters are different. | list(string) | false |  
 parameter_write | List of maps with the parameter values to write to SSM Parameter Store | list(map(string)) | false |  
 parameter_write_defaults | Parameter write default settings | map(any) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
