---
title:  AWS CIS-ALARMS
---

## Description

Terraform module which creates Cloudwatch resources on AWS

## Specification

### Properties  
 Name | Description | Type | Required | Default 
------------|------------|------------|------------|------------
 actions_enabled | Indicates whether or not actions should be executed during any changes to the alarm's state. | bool | false |  
 alarm_actions | List of ARNs to put as Cloudwatch Alarms actions (eg, ARN of SNS topic) | list(string) | false |  
 create | Whether to create the Cloudwatch log metric filter and metric alarms | bool | false |  
 disabled_controls | List of IDs of disabled CIS controls | list(string) | false |  
 log_group_name | The name of the log group to associate the metric filter with | string | false |  
 name_prefix | A name prefix for the cloudwatch alarm (if use_random_name_prefix is true, this will be ignored) | string | false |  
 namespace | The namespace where metric filter and metric alarm should be cleated | string | false |  
 tags | A mapping of tags to assign to all resources | map(string) | false |  
 use_random_name_prefix | Whether to prefix resource names with random prefix | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
