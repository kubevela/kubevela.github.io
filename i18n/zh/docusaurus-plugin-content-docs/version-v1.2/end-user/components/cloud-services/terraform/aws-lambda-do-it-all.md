---
title:  AWS LAMBDA-DO-IT-ALL
---

## 描述

Terraform module to provision a lambda with full permissions

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 dead_letter_target_type | The type of the dlq target, must be 'SNS' or 'SQS' | string | false |  
 lambda_concurrency | Limit concurrent executions of the lambda fn | number | false |  
 environment_vars |  | map(string) | false |  
 description | Description of what the Lambda Function does | string | false |  
 handler | Path to the lambda handler | string | true |  
 s3_bucket | The S3 bucket your lambda artifact is stored in | string | true |  
 alias | Lambda alias name | string | false |  
 aws_region | The region in which to deploy the lambda function | string | true |  
 lambda_runtime | Runtime to invoke the lambda with | string | true |  
 architecture | The CPU architecture to use |  | false |  
 timeout | Function timeout, execution gets cancelled after this many seconds | number | false |  
 tracing_config_mode | X Ray tracing mode to use | string | false |  
 vpc_subnets | VPC subnets to run the lambda in | list(string) | false |  
 additional_assume_role_policies | List of objects defining additional non-Lambda IAM trust relationship statements | list(object({
    Action = list(string)
    Principal = object({
      Service = string
    })
    Effect = string
  })) | false |  
 aws_profile | The account profile to deploy the lamnda function within | string | true |  
 log_retention | Time in days to retain logs for | number | false |  
 custom_role_name | Override for the default lambda role name | string | false |  
 insights_enabled | Turn on Lambda insights for the Lambda (limited regions only) | bool | false |  
 tags | Tags to attach to all resources | map(string) | true |  
 instant_alias_update | Whether to immediately point the alias at the latest version | bool | false |  
 memory_size | Memory allocation for the lambda function | number | false |  
 publish | Should this be published as a version | bool | false |  
 policies | List of objects defining IAM policy statements | list(object({
    Action   = list(string)
    Resource = list(string)
    Effect   = string
  })) | false |  
 dead_letter_target | Target ARN for an SQS queue or SNS topic to notify on failed invocations | string | false |  
 layers | List of lambda layer ARNs to attach | list(string) | false |  
 vpc_security_groups | VPC security groups to apply to the lambda | list(string) | false |  
 name | The name to give to the lambda function | string | true |  
 s3_key | The name of the lambda artifact in the bucket | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
