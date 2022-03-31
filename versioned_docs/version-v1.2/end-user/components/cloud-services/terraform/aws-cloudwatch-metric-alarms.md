---
title:  AWS CLOUDWATCH-METRIC-ALARMS
---

## Description

Terraform module which creates Cloudwatch resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 alarm_name | The descriptive name for the alarm. This name must be unique within the user's AWS account. | string | true |  
 comparison_operator | The arithmetic operation to use when comparing the specified Statistic and Threshold. The specified Statistic value is used as the first operand. Either of the following is supported: GreaterThanOrEqualToThreshold, GreaterThanThreshold, LessThanThreshold, LessThanOrEqualToThreshold. | string | true |  
 evaluation_periods | The number of periods over which data is compared to the specified threshold. | number | true |  
 namespace | The namespace for the alarm's associated metric. See docs for the list of namespaces. See docs for supported metrics. | string | false |  
 alarm_actions | The list of actions to execute when this alarm transitions into an ALARM state from any other state. Each action is specified as an Amazon Resource Name (ARN). | list(string) | false |  
 create_metric_alarm | Whether to create the Cloudwatch metric alarm | bool | false |  
 insufficient_data_actions | The list of actions to execute when this alarm transitions into an INSUFFICIENT_DATA state from any other state. Each action is specified as an Amazon Resource Name (ARN). | list(string) | false |  
 extended_statistic | The percentile statistic for the metric associated with the alarm. Specify a value between p0.0 and p100. | string | false |  
 metric_query | Enables you to create an alarm based on a metric math expression. You may specify at most 20. | any | false |  
 unit | The unit for the alarm's associated metric. | string | false |  
 period | The period in seconds over which the specified statistic is applied. | string | false |  
 ok_actions | The list of actions to execute when this alarm transitions into an OK state from any other state. Each action is specified as an Amazon Resource Name (ARN). | list(string) | false |  
 evaluate_low_sample_count_percentiles | Used only for alarms based on percentiles. If you specify ignore, the alarm state will not change during periods with too few data points to be statistically significant. If you specify evaluate or omit this parameter, the alarm will always be evaluated and possibly change state no matter how many data points are available. The following values are supported: ignore, and evaluate. | string | false |  
 tags | A mapping of tags to assign to all resources | map(string) | false |  
 alarm_description | The description for the alarm. | string | false |  
 threshold | The value against which the specified statistic is compared. | number | true |  
 metric_name | The name for the alarm's associated metric. See docs for supported metrics. | string | false |  
 statistic | The statistic to apply to the alarm's associated metric. Either of the following is supported: SampleCount, Average, Sum, Minimum, Maximum | string | false |  
 actions_enabled | Indicates whether or not actions should be executed during any changes to the alarm's state. Defaults to true. | bool | false |  
 datapoints_to_alarm | The number of datapoints that must be breaching to trigger the alarm. | number | false |  
 dimensions | The dimensions for the alarm's associated metric. | any | false |  
 treat_missing_data | Sets how this alarm is to handle missing data points. The following values are supported: missing, ignore, breaching and notBreaching. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
