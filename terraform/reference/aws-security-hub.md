---
title:  AWS SECURITY-HUB
---

## Description

Terraform module to provision AWS Security Hub

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cloudwatch_event_rule_pattern_detail_type | The detail-type pattern used to match events that will be sent to SNS. \n\nFor more information, see:\nhttps://docs.aws.amazon.com/AmazonCloudWatch/latest/events/CloudWatchEventsandEventPatterns.html\n | string | false |  
 create_sns_topic | Flag to indicate whether an SNS topic should be created for notifications\n\nIf you want to send findings to a new SNS topic, set this to true and provide a valid configuration for subscribers\n | bool | false |  
 enabled_standards | A list of standards/rulesets to enable\n\nSee https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/securityhub_standards_subscription#argument-reference\n\nThe possible values are:\n\n  - standards/aws-foundational-security-best-practices/v/1.0.0\n  - ruleset/cis-aws-foundations-benchmark/v/1.2.0\n  - standards/pci-dss/v/3.2.1\n | list(any) | false |  
 imported_findings_notification_arn | The ARN for an SNS topic to send findings notifications to. This is only used if create_sns_topic is false.\n\nIf you want to send findings to an existing SNS topic, set the value of this to the ARN of the existing topic and set \ncreate_sns_topic to false.\n | string | false |  
 subscribers | Configuration for SNS topic subscribers. See [AWS SNS Subscription documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sns_topic_subscription) for details. | `map(any)` | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
