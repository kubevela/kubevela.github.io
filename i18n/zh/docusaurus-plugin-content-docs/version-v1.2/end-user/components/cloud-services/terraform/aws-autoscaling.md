---
title:  AWS AUTOSCALING
---

## 描述

Terraform module which creates Auto Scaling resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 enclave_options | Enable Nitro Enclaves on launched instances | map(string) | false |  
 ignore_desired_capacity_changes | Determines whether the `desired_capacity` value is ignored after initial apply. See README note for more details | bool | false |  
 wait_for_capacity_timeout | A maximum duration that Terraform should wait for ASG instances to be healthy before timing out. (See also Waiting for Capacity below.) Setting this to '0' causes Terraform to skip all Capacity Waiting behavior. | string | false |  
 termination_policies | A list of policies to decide how the instances in the Auto Scaling Group should be terminated. The allowed values are `OldestInstance`, `NewestInstance`, `OldestLaunchConfiguration`, `ClosestToNextInstanceHour`, `OldestLaunchTemplate`, `AllocationStrategy`, `Default` | list(string) | false |  
 service_linked_role_arn | The ARN of the service-linked role that the ASG will use to call other AWS services | string | false |  
 kernel_id | The kernel ID | string | false |  
 update_default_version | Whether to update Default Version each update. Conflicts with `default_version` | string | false |  
 placement | The placement of the instance | map(string) | false |  
 tag_specifications | The tags to apply to the resources during launch | list(any) | false |  
 min_elb_capacity | Setting this causes Terraform to wait for this number of instances to show up healthy in the ELB only on creation. Updates will not wait on ELB instance number changes | number | false |  
 suspended_processes | A list of processes to suspend for the Auto Scaling Group. The allowed values are `Launch`, `Terminate`, `HealthCheck`, `ReplaceUnhealthy`, `AZRebalance`, `AlarmNotification`, `ScheduledActions`, `AddToLoadBalancer`. Note that if you suspend either the `Launch` or `Terminate` process types, it can prevent your Auto Scaling Group from functioning properly | list(string) | false |  
 key_name | The key name that should be used for the instance | string | false |  
 user_data_base64 | The Base64-encoded user data to provide when launching the instance | string | false |  
 launch_template_description | Description of the launch template | string | false |  
 protect_from_scale_in | Allows setting instance protection. The autoscaling group will not select instances with this setting for termination during scale in events. | bool | false |  
 health_check_type | `EC2` or `ELB`. Controls how health checking is done | string | false |  
 default_cooldown | The amount of time, in seconds, after a scaling activity completes before another scaling activity can start | number | false |  
 load_balancers | A list of elastic load balancer names to add to the autoscaling group names. Only valid for classic load balancers. For ALBs, use `target_group_arns` instead | list(string) | false |  
 image_id | The AMI from which to launch the instance | string | false |  
 create_schedule | Determines whether to create autoscaling group schedule or not | bool | false |  
 create | Determines whether to create autoscaling group or not | bool | false |  
 instance_name | Name that is propogated to launched EC2 instances via a tag - if not provided, defaults to `var.name` | string | false |  
 instance_refresh | If this block is configured, start an Instance Refresh when this Auto Scaling Group is updated | any | false |  
 block_device_mappings | Specify volumes to attach to the instance besides the volumes specified by the AMI | list(any) | false |  
 hibernation_options | The hibernation options for the instance | map(string) | false |  
 placement_group | The name of the placement group into which you'll launch your instances, if any | string | false |  
 cpu_options | The CPU options for the instance | map(string) | false |  
 iam_instance_profile_arn | The IAM Instance Profile ARN to launch the instance with | string | false |  
 enabled_metrics | A list of metrics to collect. The allowed values are `GroupDesiredCapacity`, `GroupInServiceCapacity`, `GroupPendingCapacity`, `GroupMinSize`, `GroupMaxSize`, `GroupInServiceInstances`, `GroupPendingInstances`, `GroupStandbyInstances`, `GroupStandbyCapacity`, `GroupTerminatingCapacity`, `GroupTerminatingInstances`, `GroupTotalCapacity`, `GroupTotalInstances` | list(string) | false |  
 iam_instance_profile_name | The name attribute of the IAM instance profile to associate with launched instances | string | false |  
 default_version | Default Version of the launch template | string | false |  
 elastic_inference_accelerator | Configuration block containing an Elastic Inference Accelerator to attach to the instance | map(string) | false |  
 schedules | Map of autoscaling group schedule to create | map(any) | false |  
 vpc_zone_identifier | A list of subnet IDs to launch resources in. Subnets automatically determine which availability zones the group will reside. Conflicts with `availability_zones` | list(string) | false |  
 metadata_options | Customize the metadata options for the instance | map(string) | false |  
 create_launch_template | Determines whether to create launch template or not | bool | false |  
 ram_disk_id | The ID of the ram disk | string | false |  
 scaling_policies | Map of target scaling policy schedule to create | any | false |  
 license_specifications | A list of license specifications to associate with | map(string) | false |  
 launch_template_version | Launch template version. Can be version number, `$Latest`, or `$Default` | string | false |  
 initial_lifecycle_hooks | One or more Lifecycle Hooks to attach to the Auto Scaling Group before instances are launched. The syntax is exactly the same as the separate `aws_autoscaling_lifecycle_hook` resource, without the `autoscaling_group_name` attribute. Please note that this will only work when creating a new Auto Scaling Group. For all other use-cases, please use `aws_autoscaling_lifecycle_hook` resource | list(map(string)) | false |  
 disable_api_termination | If true, enables EC2 instance termination protection | bool | false |  
 credit_specification | Customize the credit specification of the instance | map(string) | false |  
 instance_market_options | The market (purchasing) option for the instance | any | false |  
 launch_template_use_name_prefix | Determines whether to use `launch_template_name` as is or create a unique name beginning with the `launch_template_name` as the prefix | bool | false |  
 network_interfaces | Customize network interfaces to be attached at instance boot time | list(any) | false |  
 create_scaling_policy | Determines whether to create target scaling policy schedule or not | bool | false |  
 target_group_arns | A set of `aws_alb_target_group` ARNs, for use with Application or Network Load Balancing | list(string) | false |  
 force_delete | Allows deleting the Auto Scaling Group without waiting for all instances in the pool to terminate. You can force an Auto Scaling Group to delete even if it's in the process of scaling a resource. Normally, Terraform drains all the instances before deleting the group. This bypasses that behavior and potentially leaves resources dangling | bool | false |  
 metrics_granularity | The granularity to associate with the metrics to collect. The only valid value is `1Minute` | string | false |  
 ebs_optimized | If true, the launched EC2 instance will be EBS-optimized | bool | false |  
 elastic_gpu_specifications | The elastic GPU to attach to the instance | map(string) | false |  
 delete_timeout | Delete timeout to wait for destroying autoscaling group | string | false |  
 name | Name used across the resources created | string | true |  
 availability_zone | A list of one or more availability zones for the group. Used for EC2-Classic and default subnets when not specified with `vpc_zone_identifier` argument. Conflicts with `vpc_zone_identifier` | list(string) | false |  
 desired_capacity | The number of Amazon EC2 instances that should be running in the autoscaling group | number | false |  
 wait_for_elb_capacity | Setting this will cause Terraform to wait for exactly this number of healthy instances in all attached load balancers on both create and update operations. Takes precedence over `min_elb_capacity` behavior. | number | false |  
 use_mixed_instances_policy | Determines whether to use a mixed instances policy in the autoscaling group or not | bool | false |  
 use_name_prefix | Determines whether to use `name` as is or create a unique name beginning with the `name` as the prefix | bool | false |  
 max_size | The maximum size of the autoscaling group | number | false |  
 capacity_rebalance | Indicates whether capacity rebalance is enabled | bool | false |  
 security_groups | A list of security group IDs to associate | list(string) | false |  
 capacity_reservation_specification | Targeting for EC2 capacity reservations | any | false |  
 tags | A map of tags to assign to resources | map(string) | false |  
 instance_type | The type of the instance to launch | string | false |  
 launch_template | Name of an existing launch template to be used (created outside of this module) | string | false |  
 health_check_grace_period | Time (in seconds) after instance comes into service before checking health | number | false |  
 max_instance_lifetime | The maximum amount of time, in seconds, that an instance can be in service, values must be either equal to 0 or between 86400 and 31536000 seconds | number | false |  
 instance_initiated_shutdown_behavior | Shutdown behavior for the instance. Can be `stop` or `terminate`. (Default: `stop`) | string | false |  
 putin_khuylo | Do you agree that Putin doesn't respect Ukrainian sovereignty and territorial integrity? More info: https://en.wikipedia.org/wiki/Putin_khuylo! | bool | false |  
 min_size | The minimum size of the autoscaling group | number | false |  
 mixed_instances_policy | Configuration block containing settings to define launch targets for Auto Scaling groups | any | false |  
 warm_pool | If this block is configured, add a Warm Pool to the specified Auto Scaling group | any | false |  
 enable_monitoring | Enables/disables detailed monitoring | bool | false |  
 launch_template_name | Name of launch template to be created | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
