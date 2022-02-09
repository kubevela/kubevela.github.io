---
title:  AWS SNS-TOPIC
---

## Description

Terraform Module to Provide an Amazon Simple Notification Service (SNS)

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 kms_master_key_id | The ID of an AWS-managed customer master key (CMK) for Amazon SNS or a custom CMK. | string | false |  
 encryption_enabled | Whether or not to use encryption for SNS Topic. If set to `true` and no custom value for KMS key (kms_master_key_id) is provided, it uses the default `alias/aws/sns` KMS key. | bool | false |  
 fifo_topic | Whether or not to create a FIFO (first-in-first-out) topic | bool | false |  
 fifo_queue_enabled | Whether or not to create a FIFO (first-in-first-out) queue | bool | false |  
 sqs_dlq_enabled | Enable delivery of failed notifications to SQS and monitor messages in queue. | bool | false |  
 sqs_dlq_message_retention_seconds | The number of seconds Amazon SQS retains a message. Integer representing seconds, from 60 (1 minute) to 1209600 (14 days). | number | false |  
 redrive_policy_max_receiver_count | The number of times a message is delivered to the source queue before being moved to the dead-letter queue. When the ReceiveCount for a message exceeds the maxReceiveCount for a queue, Amazon SQS moves the message to the dead-letter-queue. | number | false |  
 allowed_aws_services_for_sns_published | AWS services that will have permission to publish to SNS topic. Used when no external JSON policy is used | list(string) | false |  
 sqs_queue_kms_master_key_id | The ID of an AWS-managed customer master key (CMK) for Amazon SQS Queue or a custom CMK | string | false |  
 sqs_queue_kms_data_key_reuse_period_seconds | The length of time, in seconds, for which Amazon SQS can reuse a data key to encrypt or decrypt messages before calling AWS KMS again | number | false |  
 allowed_iam_arns_for_sns_publish | IAM role/user ARNs that will have permission to publish to SNS topic. Used when no external json policy is used. | list(string) | false |  
 sqs_dlq_max_message_size | The limit of how many bytes a message can contain before Amazon SQS rejects it. An integer from 1024 bytes (1 KiB) up to 262144 bytes (256 KiB). The default for this attribute is 262144 (256 KiB). | number | false |  
 content_based_deduplication | Enable content-based deduplication for FIFO topics | bool | false |  
 subscribers | Required configuration for subscibres to SNS topic. | map(object({
    protocol = string
    # The protocol to use. The possible values for this are: sqs, sms, lambda, application. (http or https are partially supported, see below) (email is an option but is unsupported, see below).
    endpoint = string
    # The endpoint to send data to, the contents will vary with the protocol. (see below for more information)
    endpoint_auto_confirms = bool
    # Boolean indicating whether the end point is capable of auto confirming subscription e.g., PagerDuty (default is false)
    raw_message_delivery = bool
    # Boolean indicating whether or not to enable raw message delivery (the original message is directly passed, not wrapped in JSON with the original message in the message property) (default is false)
  })) | false |  
 sns_topic_policy_json | The fully-formed AWS policy as JSON | string | false |  
 delivery_policy | The SNS delivery policy as JSON. | string | false |  
 redrive_policy | The SNS redrive policy as JSON. This overrides `var.redrive_policy_max_receiver_count` and the `deadLetterTargetArn` (supplied by `var.fifo_queue = true`) passed in by the module. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
