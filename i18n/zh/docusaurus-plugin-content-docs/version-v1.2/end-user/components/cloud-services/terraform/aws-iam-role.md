---
title:  AWS IAM-ROLE
---

## 描述

A Terraform module that creates IAM role with provided JSON IAM polices documents.

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 principals | Map of service name as key and a list of ARNs to allow assuming the role as value (e.g. map(`AWS`, list(`arn:aws:iam:::role/admin`))) | map(list(string)) | false |  
 policy_documents | List of JSON IAM policy documents | list(string) | false |  
 max_session_duration | The maximum session duration (in seconds) for the role. Can have a value from 1 hour to 12 hours | number | false |  
 permissions_boundary | ARN of the policy that is used to set the permissions boundary for the role | string | false |  
 policy_description | The description of the IAM policy that is visible in the IAM policy manager | string | false |  
 assume_role_conditions | List of conditions for the assume role policy | list(object({\n    test     = string\n    variable = string\n    values   = list(string)\n  })) | false |  
 path | Path to the role and policy. See [IAM Identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html) for more information. | string | false |  
 use_fullname | If set to 'true' then the full ID for the IAM role name (e.g. `[var.namespace]-[var.environment]-[var.stage]`) will be used.\n\nOtherwise, `var.name` will be used for the IAM role name.\n | bool | false |  
 policy_document_count | Number of policy documents (length of policy_documents list) | number | false |  
 managed_policy_arns | List of managed policies to attach to created role | set(string) | false |  
 role_description | The description of the IAM role that is visible in the IAM role manager | string | true |  
 assume_role_actions | The IAM action to be granted by the AssumeRole policy | list(string) | false |  
 instance_profile_enabled | Create EC2 Instance Profile for the role | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
