---
title:  AWS NOTIFY-SLACK
---

## 描述

Terraform module which creates SNS topic and Lambda function which sends notifications to Slack

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 lambda_function_tags | Additional tags for the Lambda function | map(string) | false |  
 lambda_function_vpc_subnet_ids | List of subnet ids when Lambda Function should run in the VPC. Usually private or intra subnets. | list(string) | false |  
 lambda_role | IAM role attached to the Lambda Function.  If this is set then a role will not be created for you. | string | false |  
 sns_topic_name | The name of the SNS topic to create | string | true |  
 slack_channel | The name of the channel in Slack for notifications | string | true |  
 cloudwatch_log_group_retention_in_days | Specifies the number of days you want to retain log events in log group for Lambda. | number | false |  
 tags | A map of tags to add to all resources | map(string) | false |  
 lambda_function_name | The name of the Lambda function to create | string | false |  
 slack_webhook_url | The URL of Slack webhook | string | true |  
 slack_emoji | A custom emoji that will appear on Slack messages | string | false |  
 subscription_filter_policy | (Optional) A valid filter policy that will be used in the subscription to filter messages seen by the target resource. | string | false |  
 create_sns_topic | Whether to create new SNS topic | bool | false |  
 iam_policy_path | Path of policies to that should be added to IAM role for Lambda Function | string | false |  
 sns_topic_tags | Additional tags for the SNS topic | map(string) | false |  
 cloudwatch_log_group_tags | Additional tags for the Cloudwatch log group | map(string) | false |  
 kms_key_arn | ARN of the KMS key used for decrypting slack webhook url | string | false |  
 lambda_function_vpc_security_group_ids | List of security group ids when Lambda Function should run in the VPC. | list(string) | false |  
 lambda_function_s3_bucket | S3 bucket to store artifacts | string | false |  
 create | Whether to create all resources | bool | false |  
 sns_topic_kms_key_id | ARN of the KMS key used for enabling SSE on the topic | string | false |  
 recreate_missing_package | Whether to recreate missing Lambda package if it is missing locally or not | bool | false |  
 reserved_concurrent_executions | The amount of reserved concurrent executions for this lambda function. A value of 0 disables lambda from being triggered and -1 removes any concurrency limitations | number | false |  
 iam_role_tags | Additional tags for the IAM role | map(string) | false |  
 lambda_function_store_on_s3 | Whether to store produced artifacts on S3 or locally. | bool | false |  
 lambda_description | The description of the Lambda function | string | false |  
 slack_username | The username that will appear on Slack messages | string | true |  
 cloudwatch_log_group_kms_key_id | The ARN of the KMS Key to use when encrypting log data for Lambda | string | false |  
 iam_role_path | Path of IAM role to use for Lambda Function | string | false |  
 log_events | Boolean flag to enabled/disable logging of incoming events | bool | false |  
 iam_role_boundary_policy_arn | The ARN of the policy that is used to set the permissions boundary for the role | string | false |  
 iam_role_name_prefix | A unique role name beginning with the specified prefix | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
