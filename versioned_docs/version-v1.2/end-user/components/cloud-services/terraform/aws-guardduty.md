---
title:  AWS GUARDDUTY
---

## Description

Terraform module to provision AWS Guard Duty

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cloudwatch_event_rule_pattern_detail_type | The detail-type pattern used to match events that will be sent to SNS.

For more information, see:
https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/CloudWatchEventsandEventPatterns.html
https://docs.aws.amazon.com/eventbridge/latest/userguide/event-types.html
https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html
 | string | false |  
 create_sns_topic | Flag to indicate whether an SNS topic should be created for notifications.
If you want to send findings to a new SNS topic, set this to true and provide a valid configuration for subscribers.
 | bool | false |  
 subscribers | A map of subscription configurations for SNS topics

For more information, see:
https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sns_topic_subscription#argument-reference

protocol:
  The protocol to use. The possible values for this are: sqs, sms, lambda, application. (http or https are partially
  supported, see link) (email is an option but is unsupported in terraform, see link).
endpoint:
  The endpoint to send data to, the contents will vary with the protocol. (see link for more information)
endpoint_auto_confirms:
  Boolean indicating whether the end point is capable of auto confirming subscription e.g., PagerDuty. Default is
  false
raw_message_delivery:
  Boolean indicating whether or not to enable raw message delivery (the original message is directly passed, not wrapped in JSON with the original message in the message property).
  Default is false
 | map(object({
    protocol               = string
    endpoint               = string
    endpoint_auto_confirms = bool
    raw_message_delivery   = bool
  })) | false |  
 findings_notification_arn | The ARN for an SNS topic to send findings notifications to. This is only used if create_sns_topic is false.
If you want to send findings to an existing SNS topic, set the value of this to the ARN of the existing topic and set
create_sns_topic to false.
 | string | false |  
 finding_publishing_frequency | The frequency of notifications sent for finding occurrences. If the detector is a GuardDuty member account, the value
is determined by the GuardDuty master account and cannot be modified, otherwise it defaults to SIX_HOURS.

For standalone and GuardDuty master accounts, it must be configured in Terraform to enable drift detection.
Valid values for standalone and master accounts: FIFTEEN_MINUTES, ONE_HOUR, SIX_HOURS."

For more information, see:
https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html#guardduty_findings_cloudwatch_notification_frequency
 | string | false |  
 enable_cloudwatch | Flag to indicate whether an CloudWatch logging should be enabled for GuardDuty
 | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
