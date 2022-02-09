---
title:  AWS SECURITY-HUB
---

## 描述

Terraform module to provision AWS Security Hub

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 imported_findings_notification_arn | The ARN for an SNS topic to send findings notifications to. This is only used if create_sns_topic is false.

If you want to send findings to an existing SNS topic, set the value of this to the ARN of the existing topic and set 
create_sns_topic to false.
 | string | false |  
 cloudwatch_event_rule_pattern_detail_type | The detail-type pattern used to match events that will be sent to SNS. 

For more information, see:
https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/CloudWatchEventsandEventPatterns.html
 | string | false |  
 enabled_standards | A list of standards/rulesets to enable

See https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/securityhub_standards_subscription#argument-reference

The possible values are:

  - standards/aws-foundational-security-best-practices/v/1.0.0
  - ruleset/cis-aws-foundations-benchmark/v/1.2.0
  - standards/pci-dss/v/3.2.1
 | list(any) | false |  
 create_sns_topic | Flag to indicate whether an SNS topic should be created for notifications

If you want to send findings to a new SNS topic, set this to true and provide a valid configuration for subscribers
 | bool | false |  
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
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
