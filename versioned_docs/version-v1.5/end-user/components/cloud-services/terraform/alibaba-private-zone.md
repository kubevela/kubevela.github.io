---
title:  Alibaba Cloud PRIVATE-ZONE
---

## Description

Terraform-based modules are used to create a Private Zone on AliCloud, while you can add records to the Zone and associate it with a VPC.

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 adjustment_type | (Deprecated from version 1.2.0) The method only used by the simple and step scaling rule to adjust the number of ECS instances. Valid values: QuantityChangeInCapacity, PercentChangeInCapacity and TotalCapacity. Use simple_rule_adjustment_type and step_rule_adjustment_type instead. | string | false |  
 adjustment_value | The number of ECS instances to be adjusted in the simple scaling rule. The number of ECS instances to be adjusted in a single scaling activity cannot exceed 500. | number | false |  
 alarm_description | The description for the alarm. | string | false |  
 alarm_task_metric_name | The monitoring index name. Details see `[system monitoring index](https://help.aliyun.com/document_detail/141651.htm)` and `[custom monidoring index](https://www.alibabacloud.com/help/doc-detail/74861.htm)`. | string | false |  
 alarm_task_metric_type | The monitoring type for alarm task. Valid values system, custom. `system` means the metric data is collected by Aliyun Cloud Monitor Service(CMS); `custom` means the metric data is upload to CMS by users. | string | false |  
 alarm_task_name | The name for alarm task. Default to a random string prefixed with `terraform-alarm-task-`. | string | false |  
 alarm_task_setting | The setting of monitoring index setting. It contains the following parameters: `period`(A reference period used to collect, summary, and compute data. Default to 60 seconds), `method`(The method used to statistics data, default to Average), `threshold`(Verify whether the statistics data value of a metric exceeds the specified threshold. Default to 0), `comparison_operator`(The arithmetic operation to use when comparing the specified method and threshold. Default to >=), `trigger_after`(You can select one the following options, such as 1, 2, 3, and 5 times. When the value of a metric exceeds the threshold for specified times, an event is triggered, and the specified scaling rule is applied. Default to 3 times.). | map(string) | false |  
 cooldown | The cooldown time of the simple scaling rule. Valid values: 0 to 86400. Unit: seconds. If not set, the scaling group's cooldown will be used. | number | false |  
 create_alarm_task | If true, the module will create a scheduled task for each scaling rule. | bool | false |  
 create_scheduled_task | If true, the module will create a scheduled task for each scaling rule. | bool | false |  
 create_simple_rule | Whether to create a simple scaling rule in the specified scaling group. | bool | false |  
 create_step_rule | Whether to create a step scaling rule in the specified scaling group. | bool | false |  
 create_target_tracking_rule | Whether to create a target tracking scaling rule in the specified scaling group. | bool | false |  
 disable_scale_in | Whether to disable scale-in. This parameter is applicable only to target tracking scaling rules. | bool | false |  
 enable_alarm_task | Whether to enable the alarm task. | bool | false |  
 enable_scheduled_task | Whether to enable the scheduled task. | bool | false |  
 estimated_instance_warmup | (Deprecated from version 1.2.0) The warm-up period of the ECS instances. It is applicable to target tracking and step scaling rules. The system adds ECS instances that are in the warm-up state to the scaling group, but does not report monitoring data during the warm-up period to CloudMonitor. Valid values: 0 to 86400. Unit: seconds. Use target_tracking_rule_estimated_instance_warmup and step_rule_estimated_instance_warmup instead. | number | false |  
 metric_name | (Deprecated from version 1.2.0) The monitoring index name. Details see `[system monitoring index](https://help.aliyun.com/document_detail/141651.htm)` and `[custom monidoring index](https://www.alibabacloud.com/help/doc-detail/74861.htm)`. Use target_tracking_rule_metric_name instead. | string | false |  
 profile | (Deprecated from version 1.1.0) The profile name as set in the shared credentials file. If not set, it will be sourced from the ALICLOUD_PROFILE environment variable. | string | false |  
 region | (Deprecated from version 1.1.0) The region ID used to launch this module resources. If not set, it will be sourced from followed by ALICLOUD_REGION environment variable and profile. | string | false |  
 scaling_group_id | Specifying existing autoscaling group ID. If not set, it can be retrieved automatically by specifying filter `scaling_group_name_regex`. | string | false |  
 scaling_group_name_regex | Using a name regex to retrieve existing scaling group automactially. | string | false |  
 scaling_rule_name | (Deprecated from version 1.2.0) The name for scaling rule. Default to a random string prefixed with `terraform-ess-<rule type>-`. Use scaling_simple_rule_name, scaling_target_tracking_rule_name and scaling_step_rule_name instead. | string | false |  
 scaling_simple_rule_name | The name for scaling rule. Default to a random string prefixed with `terraform-ess-<rule type>-`. | string | false |  
 scaling_step_rule_name | The name for scaling rule. Default to a random string prefixed with `terraform-ess-<rule type>-`. | string | false |  
 scaling_target_tracking_rule_name | The name for scaling rule. Default to a random string prefixed with `terraform-ess-<rule type>-`. | string | false |  
 scheduled_task_description | Description of the scheduled task, which is 2-200 characters (English or Chinese) long. | string | false |  
 scheduled_task_name | The name for scheduled task. Default to a random string prefixed with `terraform-scheduled-task-`. | string | false |  
 scheduled_task_setting | The setting of running a scheduled task. It contains basic and recurrence setting. Deails see `run_at`(the time at which the scheduled task is triggered), `retry_interval`(the time period during which a failed scheduled task is retried, default to 600 seconds), `recurrence_type`(the recurrence type of the scheduled task: Daily, Weekly, Monthly or Cron, default to empty), `recurrence_value`(the recurrence frequency of the scheduled task, it must be set when `recurrence_type` is set) and `end_at`(the end time after which the scheduled task is no longer repeated. it will ignored if `recurrence_type` is not set). | map(string) | false |  
 shared_credentials_file | (Deprecated from version 1.1.0) This is the path to the shared credentials file. If this is not set and a profile is specified, $HOME/.aliyun/config.json will be used. | string | false |  
 simple_rule_adjustment_type | The method only used by the simple and step scaling rule to adjust the number of ECS instances. Valid values: QuantityChangeInCapacity, PercentChangeInCapacity and TotalCapacity. | string | false |  
 skip_region_validation | (Deprecated from version 1.1.0) Skip static validation of region ID. Used by users of alternative AlibabaCloud-like APIs or users w/ access to regions that are not public (yet). | bool | false |  
 step_adjustments | The predefined metric to monitor. This parameter is required and applicable only to step scaling rules. Each item contains the following parameters: `lower_limit`(The lower limit value specified. Valid values: -9.999999E18 to 9.999999E18.), `upper_limit`(The upper limit value specified. Valid values: -9.999999E18 to 9.999999E18.), `adjustment_value`(The specified number of ECS instances to be adjusted). | list(map(string)) | false |  
 step_rule_adjustment_type | The method only used by the simple and step scaling rule to adjust the number of ECS instances. Valid values: QuantityChangeInCapacity, PercentChangeInCapacity and TotalCapacity. | string | false |  
 step_rule_estimated_instance_warmup | The warm-up period of the ECS instances. It is applicable to target tracking and step scaling rules. The system adds ECS instances that are in the warm-up state to the scaling group, but does not report monitoring data during the warm-up period to CloudMonitor. Valid values: 0 to 86400. Unit: seconds. | number | false |  
 target_tracking_rule_estimated_instance_warmup | The warm-up period of the ECS instances. It is applicable to target tracking and step scaling rules. The system adds ECS instances that are in the warm-up state to the scaling group, but does not report monitoring data during the warm-up period to CloudMonitor. Valid values: 0 to 86400. Unit: seconds. | number | false |  
 target_tracking_rule_metric_name | The predefined metric to monitor. This parameter is required and applicable only to target tracking scaling rules. See valid values: https://www.alibabacloud.com/help/doc-detail/25948.htm. | string | false |  
 target_value | The target value of a metric. This parameter is required and applicable only to target tracking scaling rules. It must be greater than 0 and can have a maximum of three decimal places. | string | false |  
 task_actions | The list of actions to execute when this alarm transition into an ALARM state. | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to. | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |  
