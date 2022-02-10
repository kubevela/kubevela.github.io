---
title:  AWS AUTOSCALING
---

## 描述

Terraform module which creates Auto Scaling resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 load_balancers | A list of elastic load balancer names to add to the autoscaling group names. Only valid for classic load balancers. For ALBs, use `target_group_arns` instead | list(string) | false |  
 create_lt | Determines whether to create launch template or not | bool | false |  
 license_specifications | (LT) A list of license specifications to associate with | map(string) | false |  
 use_name_prefix | Determines whether to use `name` as is or create a unique name beginning with the `name` as the prefix | bool | false |  
 desired_capacity | The number of Amazon EC2 instances that should be running in the autoscaling group | number | false |  
 default_cooldown | The amount of time, in seconds, after a scaling activity completes before another scaling activity can start | number | false |  
 force_delete | Allows deleting the Auto Scaling Group without waiting for all instances in the pool to terminate. You can force an Auto Scaling Group to delete even if it's in the process of scaling a resource. Normally, Terraform drains all the instances before deleting the group. This bypasses that behavior and potentially leaves resources dangling | bool | false |  
 enabled_metrics | A list of metrics to collect. The allowed values are `GroupDesiredCapacity`, `GroupInServiceCapacity`, `GroupPendingCapacity`, `GroupMinSize`, `GroupMaxSize`, `GroupInServiceInstances`, `GroupPendingInstances`, `GroupStandbyInstances`, `GroupStandbyCapacity`, `GroupTerminatingCapacity`, `GroupTerminatingInstances`, `GroupTotalCapacity`, `GroupTotalInstances` | list(string) | false |  
 use_mixed_instances_policy | Determines whether to use a mixed instances policy in the autoscaling group or not | bool | false |  
 termination_policies | A list of policies to decide how the instances in the Auto Scaling Group should be terminated. The allowed values are `OldestInstance`, `NewestInstance`, `OldestLaunchConfiguration`, `ClosestToNextInstanceHour`, `OldestLaunchTemplate`, `AllocationStrategy`, `Default` | list(string) | false |  
 instance_refresh | If this block is configured, start an Instance Refresh when this Auto Scaling Group is updated | any | false |  
 enable_monitoring | Enables/disables detailed monitoring | bool | false |  
 metadata_options | Customize the metadata options for the instance | map(string) | false |  
 use_lc | Determines whether to use a launch configuration in the autoscaling group or not | bool | false |  
 create_asg | Determines whether to create autoscaling group or not | bool | false |  
 launch_template | Name of an existing launch template to be used (created outside of this module) | string | false |  
 health_check_grace_period | Time (in seconds) after instance comes into service before checking health | number | false |  
 capacity_reservation_specification | (LT) Targeting for EC2 capacity reservations | any | false |  
 enclave_options | (LT) Enable Nitro Enclaves on launched instances | map(string) | false |  
 iam_instance_profile_arn | (LT) The IAM Instance Profile ARN to launch the instance with | string | false |  
 associate_public_ip_address | (LC) Associate a public ip address with an instance in a VPC | bool | false |  
 availability_zone | A list of one or more availability zones for the group. Used for EC2-Classic and default subnets when not specified with `vpc_zone_identifier` argument. Conflicts with `vpc_zone_identifier` | list(string) | false |  
 tags | A list of tag blocks. Each element should have keys named key, value, and propagate_at_launch | list(map(string)) | false |  
 create_lc | Determines whether to create launch configuration or not | bool | false |  
 placement_group | The name of the placement group into which you'll launch your instances, if any | string | false |  
 description | (LT) Description of the launch template | string | false |  
 placement | (LT) The placement of the instance | map(string) | false |  
 metrics_granularity | The granularity to associate with the metrics to collect. The only valid value is `1Minute` | string | false |  
 user_data_base64 | The Base64-encoded user data to provide when launching the instance. You should use this for Launch Templates instead user_data | string | false |  
 security_groups | A list of security group IDs to associate | list(string) | false |  
 lc_name | Name of launch configuration to be created | string | false |  
 ephemeral_block_device | (LC) Customize Ephemeral (also known as 'Instance Store') volumes on the instance | list(map(string)) | false |  
 name | Name used across the resources created | string | true |  
 wait_for_elb_capacity | Setting this will cause Terraform to wait for exactly this number of healthy instances in all attached load balancers on both create and update operations. Takes precedence over `min_elb_capacity` behavior. | number | false |  
 wait_for_capacity_timeout | A maximum duration that Terraform should wait for ASG instances to be healthy before timing out. (See also Waiting for Capacity below.) Setting this to '0' causes Terraform to skip all Capacity Waiting behavior. | string | false |  
 schedules | Map of autoscaling group schedule to create | map(any) | false |  
 lt_use_name_prefix | Determines whether to use `lt_name` as is or create a unique name beginning with the `lt_name` as the prefix | bool | false |  
 instance_market_options | (LT) The market (purchasing) option for the instance | any | false |  
 create_schedule | Determines whether to create autoscaling group schedule or not | bool | false |  
 tags_as_map | A map of tags and values in the same format as other resources accept. This will be converted into the non-standard format that the aws_autoscaling_group requires. | map(string) | false |  
 user_data | (LC) The user data to provide when launching the instance. Do not pass gzip-compressed data via this argument nor when using Launch Templates; see `user_data_base64` instead | string | false |  
 lt_name | Name of launch template to be created | string | false |  
 network_interfaces | (LT) Customize network interfaces to be attached at instance boot time | list(any) | false |  
 tag_specifications | (LT) The tags to apply to the resources during launch | list(any) | false |  
 protect_from_scale_in | Allows setting instance protection. The autoscaling group will not select instances with this setting for termination during scale in events. | bool | false |  
 ebs_optimized | If true, the launched EC2 instance will be EBS-optimized | bool | false |  
 key_name | The key name that should be used for the instance | string | false |  
 image_id | The AMI from which to launch the instance | string | false |  
 update_default_version | (LT) Whether to update Default Version each update. Conflicts with `default_version` | string | false |  
 kernel_id | (LT) The kernel ID | string | false |  
 create_scaling_policy | Determines whether to create target scaling policy schedule or not | bool | false |  
 lt_version | Launch template version. Can be version number, `$Latest`, or `$Default` | string | false |  
 target_group_arns | A set of `aws_alb_target_group` ARNs, for use with Application or Network Load Balancing | list(string) | false |  
 suspended_processes | A list of processes to suspend for the Auto Scaling Group. The allowed values are `Launch`, `Terminate`, `HealthCheck`, `ReplaceUnhealthy`, `AZRebalance`, `AlarmNotification`, `ScheduledActions`, `AddToLoadBalancer`. Note that if you suspend either the `Launch` or `Terminate` process types, it can prevent your Auto Scaling Group from functioning properly | list(string) | false |  
 instance_type | The type of the instance to launch | string | false |  
 placement_tenancy | (LC) The tenancy of the instance. Valid values are `default` or `dedicated` | string | false |  
 disable_api_termination | (LT) If true, enables EC2 instance termination protection | bool | false |  
 cpu_options | (LT) The CPU options for the instance | map(string) | false |  
 launch_configuration | Name of an existing launch configuration to be used (created outside of this module) | string | false |  
 min_size | The minimum size of the autoscaling group | number | false |  
 mixed_instances_policy | Configuration block containing settings to define launch targets for Auto Scaling groups | any | false |  
 propagate_name | Determines whether to propagate the `var.instance_name`/`var.name` tag to launch instances | bool | false |  
 warm_pool | If this block is configured, add a Warm Pool to the specified Auto Scaling group | any | false |  
 scaling_policies | Map of target scaling policy schedule to create | any | false |  
 elastic_gpu_specifications | (LT) The elastic GPU to attach to the instance | map(string) | false |  
 elastic_inference_accelerator | (LT) Configuration block containing an Elastic Inference Accelerator to attach to the instance | map(string) | false |  
 instance_name | Name that is propogated to launched EC2 instances via a tag - if not provided, defaults to `var.name` | string | false |  
 capacity_rebalance | Indicates whether capacity rebalance is enabled | bool | false |  
 initial_lifecycle_hooks | One or more Lifecycle Hooks to attach to the Auto Scaling Group before instances are launched. The syntax is exactly the same as the separate `aws_autoscaling_lifecycle_hook` resource, without the `autoscaling_group_name` attribute. Please note that this will only work when creating a new Auto Scaling Group. For all other use-cases, please use `aws_autoscaling_lifecycle_hook` resource | list(map(string)) | false |  
 iam_instance_profile_name | The name attribute of the IAM instance profile to associate with launched instances | string | false |  
 root_block_device | (LC) Customize details about the root block device of the instance | list(map(string)) | false |  
 max_instance_lifetime | The maximum amount of time, in seconds, that an instance can be in service, values must be either equal to 0 or between 86400 and 31536000 seconds | number | false |  
 lc_use_name_prefix | Determines whether to use `lc_name` as is or create a unique name beginning with the `lc_name` as the prefix | bool | false |  
 default_version | (LT) Default Version of the launch template | string | false |  
 block_device_mappings | (LT) Specify volumes to attach to the instance besides the volumes specified by the AMI | list(any) | false |  
 vpc_zone_identifier | A list of subnet IDs to launch resources in. Subnets automatically determine which availability zones the group will reside. Conflicts with `availability_zones` | list(string) | false |  
 max_size | The maximum size of the autoscaling group | number | false |  
 min_elb_capacity | Setting this causes Terraform to wait for this number of instances to show up healthy in the ELB only on creation. Updates will not wait on ELB instance number changes | number | false |  
 instance_initiated_shutdown_behavior | (LT) Shutdown behavior for the instance. Can be `stop` or `terminate`. (Default: `stop`) | string | false |  
 credit_specification | (LT) Customize the credit specification of the instance | map(string) | false |  
 health_check_type | `EC2` or `ELB`. Controls how health checking is done | string | false |  
 delete_timeout | Delete timeout to wait for destroying autoscaling group | string | false |  
 use_lt | Determines whether to use a launch template in the autoscaling group or not | bool | false |  
 ram_disk_id | (LT) The ID of the ram disk | string | false |  
 hibernation_options | (LT) The hibernation options for the instance | map(string) | false |  
 service_linked_role_arn | The ARN of the service-linked role that the ASG will use to call other AWS services | string | false |  
 spot_price | (LC) The maximum price to use for reserving spot instances (defaults to on-demand price) | string | false |  
 ebs_block_device | (LC) Additional EBS block devices to attach to the instance | list(map(string)) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
