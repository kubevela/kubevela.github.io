---
title:  AWS SECURITY-HUB
---

## 描述

Terraform module to provision AWS Security Hub

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 enabled_standards | A list of standards/rulesets to enable\n\nSee https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/securityhub_standards_subscription#argument-reference\n\nThe possible values are:\n\n  - standards/aws-foundational-security-best-practices/v/1.0.0\n  - ruleset/cis-aws-foundations-benchmark/v/1.2.0\n  - standards/pci-dss/v/3.2.1\n | list(any) | false |  
 create_sns_topic | Flag to indicate whether an SNS topic should be created for notifications\n\nIf you want to send findings to a new SNS topic, set this to true and provide a valid configuration for subscribers\n | bool | false |  
 subscribers | Required configuration for subscibres to SNS topic. | map(object({\n    protocol = string\n    # The protocol to use. The possible values for this are: sqs, sms, lambda, application. (http or https are partially supported, see below) (email is an option but is unsupported, see below).\n    endpoint = string\n    # The endpoint to send data to, the contents will vary with the protocol. (see below for more information)\n    endpoint_auto_confirms = bool\n    # Boolean indicating whether the end point is capable of auto confirming subscription e.g., PagerDuty (default is false)\n    raw_message_delivery = bool\n    # Boolean indicating whether or not to enable raw message delivery (the original message is directly passed, not wrapped in JSON with the original message in the message property) (default is false)\n  })) | false |  
 imported_findings_notification_arn | The ARN for an SNS topic to send findings notifications to. This is only used if create_sns_topic is false.\n\nIf you want to send findings to an existing SNS topic, set the value of this to the ARN of the existing topic and set \ncreate_sns_topic to false.\n | string | false |  
 cloudwatch_event_rule_pattern_detail_type | The detail-type pattern used to match events that will be sent to SNS. \n\nFor more information, see:\nhttps://docs.aws.amazon.com/AmazonCloudWatch/latest/events/CloudWatchEventsandEventPatterns.html\n | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
