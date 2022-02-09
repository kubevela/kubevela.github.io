---
title:  AWS SQS
---

## Description

Terraform module which creates SQS resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 receive_wait_time_seconds | The time for which a ReceiveMessage call will wait for a message to arrive (long polling) before returning. An integer from 0 to 20 (seconds) | number | false |  
 policy | The JSON policy for the SQS queue | string | false |  
 redrive_allow_policy | The JSON policy to set up the Dead Letter Queue redrive permission, see AWS docs. | string | false |  
 fifo_throughput_limit | Specifies whether the FIFO queue throughput quota applies to the entire queue or per message group | string | false |  
 name_prefix | A unique name beginning with the specified prefix. | string | false |  
 visibility_timeout_seconds | The visibility timeout for the queue. An integer from 0 to 43200 (12 hours) | number | false |  
 max_message_size | The limit of how many bytes a message can contain before Amazon SQS rejects it. An integer from 1024 bytes (1 KiB) up to 262144 bytes (256 KiB) | number | false |  
 redrive_policy | The JSON policy to set up the Dead Letter Queue, see AWS docs. Note: when specifying maxReceiveCount, you must specify it as an integer (5), and not a string ("5") | string | false |  
 fifo_queue | Boolean designating a FIFO queue | bool | false |  
 create | Whether to create SQS queue | bool | false |  
 name | This is the human-readable name of the queue. If omitted, Terraform will assign a random name. | string | false |  
 message_retention_seconds | The number of seconds Amazon SQS retains a message. Integer representing seconds, from 60 (1 minute) to 1209600 (14 days) | number | false |  
 content_based_deduplication | Enables content-based deduplication for FIFO queues | bool | false |  
 kms_data_key_reuse_period_seconds | The length of time, in seconds, for which Amazon SQS can reuse a data key to encrypt or decrypt messages before calling AWS KMS again. An integer representing seconds, between 60 seconds (1 minute) and 86,400 seconds (24 hours) | number | false |  
 delay_seconds | The time in seconds that the delivery of all messages in the queue will be delayed. An integer from 0 to 900 (15 minutes) | number | false |  
 kms_master_key_id | The ID of an AWS-managed customer master key (CMK) for Amazon SQS or a custom CMK | string | false |  
 deduplication_scope | Specifies whether message deduplication occurs at the message group or queue level | string | false |  
 tags | A mapping of tags to assign to all resources | map(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
