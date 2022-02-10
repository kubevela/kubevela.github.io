---
title:  AWS ELASTICACHE-REDIS
---

## 描述

Terraform module to provision an ElastiCache Redis Cluster

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 maintenance_window | Maintenance window | string | false |  
 elasticache_subnet_group_name | Subnet group name for the ElastiCache instance | string | false |  
 alarm_actions | Alarm action list | list(string) | false |  
 vpc_id | VPC ID | string | true |  
 alarm_memory_threshold_bytes | Ram threshold alarm level | number | false |  
 availability_zones | Availability zone IDs | list(string) | false |  
 cloudwatch_metric_alarms_enabled | Boolean flag to enable/disable CloudWatch metrics alarms | bool | false |  
 parameter_group_description | Managed by Terraform | string | false |  
 cluster_size | Number of nodes in cluster. *Ignored when `cluster_mode_enabled` == `true`* | number | false |  
 instance_type | Elastic cache instance type | string | false |  
 transit_encryption_enabled | Set `true` to enable encryption in transit. Forced `true` if `var.auth_token` is set.\nIf this is enabled, use the [following guide](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/in-transit-encryption.html#connect-tls) to access redis.\n | bool | false |  
 notification_topic_arn | Notification topic arn | string | false |  
 dns_subdomain | The subdomain to use for the CNAME record. If not provided then the CNAME record will use var.name. | string | false |  
 auth_token | Auth token for password protecting redis, `transit_encryption_enabled` must be set to `true`. Password must be longer than 16 chars | string | false |  
 snapshot_arns | A single-element string list containing an Amazon Resource Name (ARN) of a Redis RDB snapshot file stored in Amazon S3. Example: arn:aws:s3:::my_bucket/snapshot1.rdb | list(string) | false |  
 subnets | Subnet IDs | list(string) | false |  
 apply_immediately | Apply changes immediately | bool | false |  
 snapshot_window | The daily time range (in UTC) during which ElastiCache will begin taking a daily snapshot of your cache cluster. | string | false |  
 cluster_mode_enabled | Flag to enable/disable creation of a native redis cluster. `automatic_failover_enabled` must be set to `true`. Only 1 `cluster_mode` block is allowed | bool | false |  
 ok_actions | The list of actions to execute when this alarm transitions into an OK state from any other state. Each action is specified as an Amazon Resource Number (ARN) | list(string) | false |  
 automatic_failover_enabled | Automatic failover (Not available for T1/T2 instances) | bool | false |  
 multi_az_enabled | Multi AZ (Automatic Failover must also be enabled.  If Cluster Mode is enabled, Multi AZ is on by default, and this setting is ignored) | bool | false |  
 replication_group_id | Replication group ID with the following constraints: \nA name must contain from 1 to 20 alphanumeric characters or hyphens. \n The first character must be a letter. \n A name cannot end with a hyphen or contain two consecutive hyphens. | string | false |  
 cluster_mode_replicas_per_node_group | Number of replica nodes in each node group. Valid values are 0 to 5. Changing this number will force a new resource | number | false |  
 family | Redis family | string | false |  
 zone_id | Route53 DNS Zone ID as list of string (0 or 1 items). If empty, no custom DNS name will be published.\nIf the list contains a single Zone ID, a custom DNS name will be pulished in that zone.\nCan also be a plain string, but that use is DEPRECATED because of Terraform issues.\n | any | false |  
 kms_key_id | The ARN of the key that you wish to use if encrypting at rest. If not supplied, uses service managed encryption. `at_rest_encryption_enabled` must be set to `true` | string | false |  
 final_snapshot_identifier | The name of your final node group (shard) snapshot. ElastiCache creates the snapshot from the primary node in the cluster. If omitted, no final snapshot will be made. | string | false |  
 cluster_mode_num_node_groups | Number of node groups (shards) for this Redis replication group. Changing this number will trigger an online resizing operation before other settings modifications | number | false |  
 parameter | A list of Redis parameters to apply. Note that parameters may differ from one Redis family to another | list(object({\n    name  = string\n    value = string\n  })) | false |  
 engine_version | Redis engine version | string | false |  
 at_rest_encryption_enabled | Enable encryption at rest | bool | false |  
 alarm_cpu_threshold_percent | CPU threshold alarm level | number | false |  
 snapshot_name | The name of a snapshot from which to restore data into the new node group. Changing the snapshot_name forces a new resource. | string | false |  
 snapshot_retention_limit | The number of days for which ElastiCache will retain automatic cache cluster snapshots before deleting them. | number | false |  
 port | Redis port | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
