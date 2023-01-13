---
title:  AWS GUARDDUTY
---

## 描述

Terraform module to provision AWS Guard Duty

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cloudwatch_event_rule_pattern_detail_type | The detail-type pattern used to match events that will be sent to SNS.\n\nFor more information, see:\nhttps://docs.aws.amazon.com/AmazonCloudWatch/latest/events/CloudWatchEventsandEventPatterns.html\nhttps://docs.aws.amazon.com/eventbridge/latest/userguide/event-types.html\nhttps://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html\n | string | false |  
 create_sns_topic | Flag to indicate whether an SNS topic should be created for notifications.\nIf you want to send findings to a new SNS topic, set this to true and provide a valid configuration for subscribers.\n | bool | false |  
 enable_cloudwatch | Flag to indicate whether an CloudWatch logging should be enabled for GuardDuty\n | bool | false |  
 finding_publishing_frequency | The frequency of notifications sent for finding occurrences. If the detector is a GuardDuty member account, the value\nis determined by the GuardDuty master account and cannot be modified, otherwise it defaults to SIX_HOURS.\n\nFor standalone and GuardDuty master accounts, it must be configured in Terraform to enable drift detection.\nValid values for standalone and master accounts: FIFTEEN_MINUTES, ONE_HOUR, SIX_HOURS."\n\nFor more information, see:\nhttps://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html#guardduty_findings_cloudwatch_notification_frequency\n | string | false |  
 findings_notification_arn | The ARN for an SNS topic to send findings notifications to. This is only used if create_sns_topic is false.\nIf you want to send findings to an existing SNS topic, set the value of this to the ARN of the existing topic and set\ncreate_sns_topic to false.\n | string | false |  
 subscribers | A map of subscription configurations for SNS topics\n\nFor more information, see:\nhttps://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sns_topic_subscription#argument-reference\n\nprotocol:\n  The protocol to use. The possible values for this are: sqs, sms, lambda, application. (http or https are partially\n  supported, see link) (email is an option but is unsupported in terraform, see link).\nendpoint:\n  The endpoint to send data to, the contents will vary with the protocol. (see link for more information)\nendpoint_auto_confirms:\n  Boolean indicating whether the end point is capable of auto confirming subscription e.g., PagerDuty. Default is\n  false\nraw_message_delivery:\n  Boolean indicating whether or not to enable raw message delivery (the original message is directly passed, not wrapped in JSON with the original message in the message property).\n  Default is false\n | map(object({\n    protocol               = string\n    endpoint               = string\n    endpoint_auto_confirms = bool\n    raw_message_delivery   = bool\n  })) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
