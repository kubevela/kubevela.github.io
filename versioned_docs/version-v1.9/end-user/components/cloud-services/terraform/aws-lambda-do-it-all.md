---
title:  AWS LAMBDA-DO-IT-ALL
---

## Description

Terraform module to provision a lambda with full permissions

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 additional_assume_role_policies | List of objects defining additional non-Lambda IAM trust relationship statements | list(object({\n    Action = list(string)\n    Principal = object({\n      Service = string\n    })\n    Effect = string\n  })) | false |  
 alias | Lambda alias name | string | false |  
 architecture | The CPU architecture to use |  | false |  
 aws_profile | The account profile to deploy the lamnda function within | string | true |  
 aws_region | The region in which to deploy the lambda function | string | true |  
 custom_role_name | Override for the default lambda role name | string | false |  
 dead_letter_target | Target ARN for an SQS queue or SNS topic to notify on failed invocations | string | false |  
 dead_letter_target_type | The type of the dlq target, must be 'SNS' or 'SQS' | string | false |  
 description | Description of what the Lambda Function does | string | false |  
 environment_vars |  | map(string) | false |  
 handler | Path to the lambda handler | string | true |  
 insights_enabled | Turn on Lambda insights for the Lambda (limited regions only) | bool | false |  
 instant_alias_update | Whether to immediately point the alias at the latest version | bool | false |  
 lambda_concurrency | Limit concurrent executions of the lambda fn | number | false |  
 lambda_runtime | Runtime to invoke the lambda with | string | true |  
 layers | List of lambda layer ARNs to attach | list(string) | false |  
 log_retention | Time in days to retain logs for | number | false |  
 memory_size | Memory allocation for the lambda function | number | false |  
 name | The name to give to the lambda function | string | true |  
 policies | List of objects defining IAM policy statements | list(object({\n    Action   = list(string)\n    Resource = list(string)\n    Effect   = string\n  })) | false |  
 publish | Should this be published as a version | bool | false |  
 s3_bucket | The S3 bucket your lambda artifact is stored in | string | true |  
 s3_key | The name of the lambda artifact in the bucket | string | true |  
 tags | Tags to attach to all resources | map(string) | true |  
 timeout | Function timeout, execution gets cancelled after this many seconds | number | false |  
 tracing_config_mode | X Ray tracing mode to use | string | false |  
 vpc_security_groups | VPC security groups to apply to the lambda | list(string) | false |  
 vpc_subnets | VPC subnets to run the lambda in | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
