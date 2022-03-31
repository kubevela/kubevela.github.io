---
title:  AWS RDS-AURORA
---

## 描述

Terraform module which creates RDS Aurora resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 instances_use_identifier_prefix | Determines whether cluster instance identifiers are used as prefixes | bool | false |  
 iam_roles | Map of IAM roles and supported feature names to associate with the cluster | map(map(string)) | false |  
 engine_version | The database engine version. Updating this argument results in an outage | string | false |  
 create_random_password | Determines whether to create random password for RDS primary cluster | bool | false |  
 random_password_length | Length of random password to create. Defaults to `10` | number | false |  
 port | The port on which the DB accepts connections | string | false |  
 copy_tags_to_snapshot | Copy all Cluster `tags` to snapshots | bool | false |  
 cluster_tags | A map of tags to add to only the cluster. Used for AWS Instance Scheduler tagging | map(string) | false |  
 create_security_group | Determines whether to create security group for RDS cluster | bool | false |  
 snapshot_identifier | Specifies whether or not to create this cluster from a snapshot. You can use either the name or ARN when specifying a DB cluster snapshot, or the ARN when specifying a DB snapshot | string | false |  
 performance_insights_enabled | Specifies whether Performance Insights is enabled or not | bool | false |  
 iam_role_max_session_duration | Maximum session duration (in seconds) that you want to set for the monitoring role | number | false |  
 autoscaling_target_connections | Average number of connections threshold which will initiate autoscaling. Default value is 70% of db.r4/r5/r6g.large's default max_connections | number | false |  
 instance_class | Instance type to use at master instance. Note: if `autoscaling_enabled` is `true`, this will be the same instance class used on instances created by autoscaling | string | false |  
 db_parameter_group_name | The name of the DB parameter group to associate with instances | string | false |  
 create_db_subnet_group | Determines whether to create the databae subnet group or use existing | bool | false |  
 subnets | List of subnet IDs used by database subnet group created | list(string) | false |  
 enable_global_write_forwarding | Whether cluster should forward writes to an associated global cluster. Applied to secondary clusters to enable them to forward writes to an `aws_rds_global_cluster`'s primary cluster | bool | false |  
 engine | The name of the database engine to be used for this DB cluster. Defaults to `aurora`. Valid Values: `aurora`, `aurora-mysql`, `aurora-postgresql` | string | false |  
 preferred_backup_window | The daily time range during which automated backups are created if automated backups are enabled using the `backup_retention_period` parameter. Time in UTC | string | false |  
 cluster_timeouts | Create, update, and delete timeout configurations for the cluster | map(string) | false |  
 autoscaling_min_capacity | Minimum number of read replicas permitted when autoscaling is enabled | number | false |  
 autoscaling_target_cpu | CPU threshold which will initiate autoscaling | number | false |  
 security_group_egress_rules | A map of security group egress rule defintions to add to the security group created | map(any) | false |  
 tags | A map of tags to add to all resources | map(string) | false |  
 monitoring_interval | The interval, in seconds, between points when Enhanced Monitoring metrics are collected for instances. Set to `0` to disble. Default is `0` | number | false |  
 performance_insights_retention_period | Amount of time in days to retain Performance Insights data. Either 7 (7 days) or 731 (2 years) | number | false |  
 iam_role_managed_policy_arns | Set of exclusive IAM managed policy ARNs to attach to the monitoring role | list(string) | false |  
 autoscaling_max_capacity | Maximum number of read replicas permitted when autoscaling is enabled | number | false |  
 allowed_cidr_blocks | A list of CIDR blocks which are allowed to access the database | list(string) | false |  
 instances | Map of cluster instances and any specific/overriding attributes to be created | any | false |  
 iam_role_path | Path for the monitoring role | string | false |  
 vpc_id | ID of the VPC where to create security group | string | false |  
 replication_source_identifier | ARN of a source DB cluster or DB instance if this DB cluster is to be created as a Read Replica | string | false |  
 storage_encrypted | Specifies whether the DB cluster is encrypted. The default is `true` | bool | false |  
 iam_role_description | Description of the monitoring role | string | false |  
 master_username | Username for the master DB user | string | false |  
 allowed_security_groups | A list of Security Group ID's to allow access to | list(string) | false |  
 database_name | Name for an automatically created database on cluster creation | string | false |  
 skip_final_snapshot | Determines whether a final snapshot is created before the cluster is deleted. If true is specified, no snapshot is created | bool | false |  
 backup_retention_period | The days to retain backups for. Default `7` | number | false |  
 vpc_security_group_ids | List of VPC security groups to associate to the cluster in addition to the SG we create in this module | list(string) | false |  
 security_group_tags | Additional tags for the security group | map(string) | false |  
 db_subnet_group_name | The name of the subnet group name (existing or created) | string | false |  
 kms_key_id | The ARN for the KMS encryption key. When specifying `kms_key_id`, `storage_encrypted` needs to be set to `true` | string | false |  
 auto_minor_version_upgrade | Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window. Default `true` | bool | false |  
 iam_role_force_detach_policies | Whether to force detaching any policies the monitoring role has before destroying it | bool | false |  
 autoscaling_scale_in_cooldown | Cooldown in seconds before allowing further scaling operations after a scale in | number | false |  
 iam_role_use_name_prefix | Determines whether to use `iam_role_name` as is or create a unique name beginning with the `iam_role_name` as the prefix | bool | false |  
 autoscaling_scale_out_cooldown | Cooldown in seconds before allowing further scaling operations after a scale out | number | false |  
 engine_mode | The database engine mode. Valid values: `global`, `multimaster`, `parallelquery`, `provisioned`, `serverless`. Defaults to: `provisioned` | string | false |  
 apply_immediately | Specifies whether any cluster modifications are applied immediately, or during the next maintenance window. Default is `false` | bool | false |  
 scaling_configuration | Map of nested attributes with scaling properties. Only valid when `engine_mode` is set to `serverless` | map(string) | false |  
 publicly_accessible | Determines whether instances are publicly accessible. Default false | bool | false |  
 performance_insights_kms_key_id | The ARN for the KMS key to encrypt Performance Insights data | string | false |  
 create_monitoring_role | Determines whether to create the IAM role for RDS enhanced monitoring | bool | false |  
 allow_major_version_upgrade | Enable to allow major engine version upgrades when changing engine versions. Defaults to `false` | bool | false |  
 name | Name used across resources created | string | false |  
 deletion_protection | If the DB instance should have deletion protection enabled. The database can't be deleted when this value is set to `true`. The default is `false` | bool | false |  
 db_cluster_parameter_group_name | A cluster parameter group to associate with the cluster | string | false |  
 db_cluster_db_instance_parameter_group_name | Instance parameter group to associate with all instances of the DB cluster. The `db_cluster_db_instance_parameter_group_name` is only valid in combination with `allow_major_version_upgrade` | string | false |  
 monitoring_role_arn | IAM role used by RDS to send enhanced monitoring metrics to CloudWatch | string | false |  
 security_group_description | The description of the security group. If value is set to empty string it will contain cluster name in the description | string | false |  
 create_cluster | Whether cluster should be created (affects nearly all resources) | bool | false |  
 is_primary_cluster | Determines whether cluster is primary cluster with writer instance (set to `false` for global cluster and replica clusters) | bool | false |  
 restore_to_point_in_time | Map of nested attributes for cloning Aurora cluster | map(string) | false |  
 iam_role_permissions_boundary | The ARN of the policy that is used to set the permissions boundary for the monitoring role | string | false |  
 autoscaling_enabled | Determines whether autoscaling of the cluster read replicas is enabled | bool | false |  
 predefined_metric_type | The metric type to scale on. Valid values are `RDSReaderAverageCPUUtilization` and `RDSReaderAverageDatabaseConnections` | string | false |  
 source_region | The source region for an encrypted replica DB cluster | string | false |  
 enable_http_endpoint | Enable HTTP endpoint (data API). Only valid when engine_mode is set to `serverless` | bool | false |  
 preferred_maintenance_window | The weekly time range during which system maintenance can occur, in (UTC) | string | false |  
 backtrack_window | The target backtrack window, in seconds. Only available for `aurora` engine currently. To disable backtracking, set this value to 0. Must be between 0 and 259200 (72 hours) | number | false |  
 enabled_cloudwatch_logs_exports | Set of log types to export to cloudwatch. If omitted, no logs will be exported. The following log types are supported: `audit`, `error`, `general`, `slowquery`, `postgresql` | list(string) | false |  
 endpoints | Map of additional cluster endpoints and their attributes to be created | any | false |  
 master_password | Password for the master DB user. Note - when specifying a value here, 'create_random_password' should be set to `false` | string | false |  
 final_snapshot_identifier_prefix | The prefix name to use when creating a final snapshot on cluster destroy; a 8 random digits are appended to name to ensure it's unique | string | false |  
 s3_import | Configuration map used to restore from a Percona Xtrabackup in S3 (only MySQL is supported) | map(string) | false |  
 ca_cert_identifier | The identifier of the CA certificate for the DB instance | string | false |  
 global_cluster_identifier | The global cluster identifier specified on `aws_rds_global_cluster` | string | false |  
 iam_database_authentication_enabled | Specifies whether or mappings of AWS Identity and Access Management (IAM) accounts to database accounts is enabled | bool | false |  
 instance_timeouts | Create, update, and delete timeout configurations for the cluster instance(s) | map(string) | false |  
 iam_role_name | Friendly name of the monitoring role | string | false |  
 putin_khuylo | Do you agree that Putin doesn't respect Ukrainian sovereignty and territorial integrity? More info: https://en.wikipedia.org/wiki/Putin_khuylo! | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
