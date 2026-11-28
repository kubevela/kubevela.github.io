---
title:  AWS GUARDDUTY
---

## Description

Terraform module to provision AWS Guard Duty

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cloudwatch_event_rule_pattern_detail_type | The detail-type pattern used to match events that will be sent to SNS.\n\nFor more information, see:\nhttps://docs.aws.amazon.com/AmazonCloudWatch/latest/events/CloudWatchEventsandEventPatterns.html\nhttps://docs.aws.amazon.com/eventbridge/latest/userguide/event-types.html\nhttps://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html\n | string | false |  
 create_sns_topic | Flag to indicate whether an SNS topic should be created for notifications.\nIf you want to send findings to a new SNS topic, set this to true and provide a valid configuration for subscribers.\n | bool | false |  
 enable_cloudwatch | Flag to indicate whether an CloudWatch logging should be enabled for GuardDuty\n | bool | false |  
 finding_publishing_frequency | The frequency of notifications sent for finding occurrences. If the detector is a GuardDuty member account, the value\nis determined by the GuardDuty master account and cannot be modified, otherwise it defaults to SIX_HOURS.\n\nFor standalone and GuardDuty master accounts, it must be configured in Terraform to enable drift detection.\nValid values for standalone and master accounts: FIFTEEN_MINUTES, ONE_HOUR, SIX_HOURS."\n\nFor more information, see:\nhttps://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html#guardduty_findings_cloudwatch_notification_frequency\n | string | false |  
 findings_notification_arn | The ARN for an SNS topic to send findings notifications to. This is only used if create_sns_topic is false.\nIf you want to send findings to an existing SNS topic, set the value of this to the ARN of the existing topic and set\ncreate_sns_topic to false.\n | string | false |  
 subscribers | A map of subscription configurations for SNS topics. Each subscriber should be an object with the following fields:

- `protocol`: The protocol to use. Supported values: `sqs`, `sms`, `lambda`, `application`, `http`, `https` (http/https have partial support, email is not supported).
- `endpoint`: The endpoint to send data to (format varies by protocol).
- `endpoint_auto_confirms`: Whether the endpoint can auto-confirm subscriptions (default: `false`).
- `raw_message_delivery`: Whether to enable raw message delivery (default: `false`).

Example:
```json
{
  "pagerduty": {
    "protocol": "https",
    "endpoint": "https://events.pagerduty.com/integration/...",
    "endpoint_auto_confirms": true,
    "raw_message_delivery": false
  },
  "lambda": {
    "protocol": "lambda",
    "endpoint": "arn:aws:lambda:us-west-2:123456789012:function:my-function",
    "endpoint_auto_confirms": true,
    "raw_message_delivery": true
  }
}
```

[More details on SNS topic subscriptions](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sns_topic_subscription#argument-reference)
 | `map<{
  protocol: string,
  endpoint: string,
  endpoint_auto_confirms: boolean,
  raw_message_delivery: boolean
}>` | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
