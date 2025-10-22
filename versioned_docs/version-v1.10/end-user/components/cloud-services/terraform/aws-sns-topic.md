---
title:  AWS SNS-TOPIC
---

## Description

Terraform Module to Provide an Amazon Simple Notification Service (SNS)

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 allowed_aws_services_for_sns_published | AWS services that will have permission to publish to SNS topic. Used when no external JSON policy is used | list(string) | false |  
 allowed_iam_arns_for_sns_publish | IAM role/user ARNs that will have permission to publish to SNS topic. Used when no external json policy is used. | list(string) | false |  
 content_based_deduplication | Enable content-based deduplication for FIFO topics | bool | false |  
 delivery_policy | The SNS delivery policy as JSON. | string | false |  
 encryption_enabled | Whether or not to use encryption for SNS Topic. If set to `true` and no custom value for KMS key (kms_master_key_id) is provided, it uses the default `alias/aws/sns` KMS key. | bool | false |  
 fifo_queue_enabled | Whether or not to create a FIFO (first-in-first-out) queue | bool | false |  
 fifo_topic | Whether or not to create a FIFO (first-in-first-out) topic | bool | false |  
 kms_master_key_id | The ID of an AWS-managed customer master key (CMK) for Amazon SNS or a custom CMK. | string | false |  
 redrive_policy | The SNS redrive policy as JSON. This overrides `var.redrive_policy_max_receiver_count` and the `deadLetterTargetArn` (supplied by `var.fifo_queue = true`) passed in by the module. | string | false |  
 redrive_policy_max_receiver_count | The number of times a message is delivered to the source queue before being moved to the dead-letter queue. When the ReceiveCount for a message exceeds the maxReceiveCount for a queue, Amazon SQS moves the message to the dead-letter-queue. | number | false |  
 sns_topic_policy_json | The fully-formed AWS policy as JSON | string | false |  
 sqs_dlq_enabled | Enable delivery of failed notifications to SQS and monitor messages in queue. | bool | false |  
 sqs_dlq_max_message_size | The limit of how many bytes a message can contain before Amazon SQS rejects it. An integer from 1024 bytes (1 KiB) up to 262144 bytes (256 KiB). The default for this attribute is 262144 (256 KiB). | number | false |  
 sqs_dlq_message_retention_seconds | The number of seconds Amazon SQS retains a message. Integer representing seconds, from 60 (1 minute) to 1209600 (14 days). | number | false |  
 sqs_queue_kms_data_key_reuse_period_seconds | The length of time, in seconds, for which Amazon SQS can reuse a data key to encrypt or decrypt messages before calling AWS KMS again | number | false |  
 sqs_queue_kms_master_key_id | The ID of an AWS-managed customer master key (CMK) for Amazon SQS Queue or a custom CMK | string | false |  
 subscribers | Configuration for SNS topic subscribers. See [AWS SNS Subscription documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sns_topic_subscription) for details. | `map(any)` | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
