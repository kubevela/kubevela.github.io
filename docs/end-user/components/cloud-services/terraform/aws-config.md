---
title:  AWS CONFIG
---

## Description

This module configures AWS Config, a service that enables you to assess, audit, and evaluate the configurations of your AWS resources.

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 central_resource_collector_account | The account ID of a central account that will aggregate AWS Config from other accounts | string | false |  
 child_resource_collector_accounts | The account IDs of other accounts that will send their AWS Configuration to this account | set(string) | false |  
 create_iam_role | Flag to indicate whether an IAM Role should be created to grant the proper permissions for AWS Config | bool | false |  
 create_sns_topic | Flag to indicate whether an SNS topic should be created for notifications\nIf you want to send findings to a new SNS topic, set this to true and provide a valid configuration for subscribers\n | bool | false |  
 disabled_aggregation_regions | A list of regions where config aggregation is disabled | list(string) | false |  
 findings_notification_arn | The ARN for an SNS topic to send findings notifications to. This is only used if create_sns_topic is false.\nIf you want to send findings to an existing SNS topic, set the value of this to the ARN of the existing topic and set\ncreate_sns_topic to false.\n | string | false |  
 force_destroy | A boolean that indicates all objects should be deleted from the bucket so that the bucket can be destroyed without error. These objects are not recoverable | bool | false |  
 global_resource_collector_region | The region that collects AWS Config data for global resources such as IAM | string | true |  
 iam_role_arn | The ARN for an IAM Role AWS Config uses to make read or write requests to the delivery channel and to describe the\nAWS resources associated with the account. This is only used if create_iam_role is false.\n\nIf you want to use an existing IAM Role, set the value of this to the ARN of the existing topic and set\ncreate_iam_role to false.\n\nSee the AWS Docs for further information:\nhttp://docs.aws.amazon.com/config/latest/developerguide/iamrole-permissions.html\n | string | false |  
 managed_rules | A list of AWS Managed Rules that should be enabled on the account.\n\nSee the following for a list of possible rules to enable:\nhttps://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html\n | map(object({\n    description      = string\n    identifier       = string\n    input_parameters = any\n    tags             = map(string)\n    enabled          = bool\n  })) | false |  
 s3_bucket_arn | The ARN of the S3 bucket used to store the configuration history | string | true |  
 s3_bucket_id | The id (name) of the S3 bucket used to store the configuration history | string | true |  
 s3_key_prefix | The prefix for AWS Config objects stored in the the S3 bucket. If this variable is set to null, the default, no\nprefix will be used.\n\nExamples:\n\nwith prefix:    {S3_BUCKET NAME}:/{S3_KEY_PREFIX}/AWSLogs/{ACCOUNT_ID}/Config/*.\nwithout prefix: {S3_BUCKET NAME}:/AWSLogs/{ACCOUNT_ID}/Config/*.\n | string | false |  
 sns_encryption_key_id | The ID of an AWS-managed customer master key (CMK) for Amazon SNS or a custom CMK. | string | false |  
 sqs_queue_kms_master_key_id | The ID of an AWS-managed customer master key (CMK) for Amazon SQS Queue or a custom CMK | string | false |  
 subscribers | A map of subscription configurations for SNS topics\n\nFor more information, see:\nhttps://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sns_topic_subscription#argument-reference\n\nprotocol:\n  The protocol to use. The possible values for this are: sqs, sms, lambda, application. (http or https are partially\n  supported, see link) (email is an option but is unsupported in terraform, see link).\nendpoint:\n  The endpoint to send data to, the contents will vary with the protocol. (see link for more information)\nendpoint_auto_confirms (Optional):\n  Boolean indicating whether the end point is capable of auto confirming subscription e.g., PagerDuty. Default is\n  false\nraw_message_delivery (Optional):\n  Boolean indicating whether or not to enable raw message delivery (the original message is directly passed, not wrapped in JSON with the original message in the message property). Default is false.\n | map(any) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
