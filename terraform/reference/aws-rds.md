---
title:  AWS RDS
---

## Description

AWS RDS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 allocated_storage | The allocated storage in gigabytes | string | false |  
 allow_major_version_upgrade | Indicates that major version upgrades are allowed. Changing this parameter does not result in an outage and the change is asynchronously applied as soon as possible | bool | false |  
 apply_immediately | Specifies whether any database modifications are applied immediately, or during the next maintenance window | bool | false |  
 auto_minor_version_upgrade | Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window | bool | false |  
 availability_zone | The Availability Zone of the RDS instance | string | false |  
 backup_retention_period | The days to retain backups for | number | false |  
 backup_window | The daily time range (in UTC) during which automated backups are created if they are enabled. Example: '09:46-10:16'. Must not overlap with maintenance_window | string | false |  
 ca_cert_identifier | Specifies the identifier of the CA certificate for the DB instance | string | false |  
 character_set_name | The character set name to use for DB encoding in Oracle instances. This can't be changed. See Oracle Character Sets Supported in Amazon RDS and Collations and Character Sets for Microsoft SQL Server for more information. This can only be set on creation | string | false |  
 cloudwatch_log_group_kms_key_id | The ARN of the KMS Key to use when encrypting log data | string | false |  
 cloudwatch_log_group_retention_in_days | The number of days to retain CloudWatch logs for the DB instance | number | false |  
 copy_tags_to_snapshot | On delete, copy all Instance tags to the final snapshot | bool | false |  
 create_cloudwatch_log_group | Determines whether a CloudWatch log group is created for each `enabled_cloudwatch_logs_exports` | bool | false |  
 create_db_instance | Whether to create a database instance | bool | false |  
 create_db_option_group | Create a database option group | bool | false |  
 create_db_parameter_group | Whether to create a database parameter group | bool | false |  
 create_db_subnet_group | Whether to create a database subnet group | bool | false |  
 create_monitoring_role | Create IAM role with a defined name that permits RDS to send enhanced monitoring metrics to CloudWatch Logs | bool | false |  
 create_random_password | Whether to create random password for RDS primary cluster | bool | false |  
 db_instance_tags | Additional tags for the DB instance | map(string) | false |  
 db_name | The DB name to create. If omitted, no database is created initially | string | false |  
 db_option_group_tags | Additional tags for the DB option group | map(string) | false |  
 db_parameter_group_tags | Additional tags for the  DB parameter group | map(string) | false |  
 db_subnet_group_description | Description of the DB subnet group to create | string | false |  
 db_subnet_group_name | Name of DB subnet group. DB instance will be created in the VPC associated with the DB subnet group. If unspecified, will be created in the default VPC | string | false |  
 db_subnet_group_tags | Additional tags for the DB subnet group | map(string) | false |  
 db_subnet_group_use_name_prefix | Determines whether to use `subnet_group_name` as is or create a unique name beginning with the `subnet_group_name` as the prefix | bool | false |  
 delete_automated_backups | Specifies whether to remove automated backups immediately after the DB instance is deleted | bool | false |  
 deletion_protection | The database can't be deleted when this value is set to true | bool | false |  
 domain | The ID of the Directory Service Active Directory domain to create the instance in | string | false |  
 domain_iam_role_name | (Required if domain is provided) The name of the IAM role to be used when making API calls to the Directory Service | string | false |  
 enabled_cloudwatch_logs_exports | List of log types to enable for exporting to CloudWatch logs. If omitted, no logs will be exported. Valid values (depending on engine): alert, audit, error, general, listener, slowquery, trace, postgresql (PostgreSQL), upgrade (PostgreSQL) | list(string) | false |  
 engine | The database engine to use | string | false |  
 engine_version | The engine version to use | string | false |  
 family | The family of the DB parameter group | string | false |  
 final_snapshot_identifier_prefix | The name which is prefixed to the final snapshot on cluster destroy | string | false |  
 iam_database_authentication_enabled | Specifies whether or not the mappings of AWS Identity and Access Management (IAM) accounts to database accounts are enabled | bool | false |  
 identifier | The name of the RDS instance | string | true |  
 instance_class | The instance type of the RDS instance | string | false |  
 iops | The amount of provisioned IOPS. Setting this implies a storage_type of 'io1' | number | false |  
 kms_key_id | The ARN for the KMS encryption key. If creating an encrypted replica, set this to the destination KMS ARN. If storage_encrypted is set to true and kms_key_id is not specified the default KMS key created in your account will be used | string | false |  
 license_model | License model information for this DB instance. Optional, but required for some DB engines, i.e. Oracle SE1 | string | false |  
 maintenance_window | The window to perform maintenance in. Syntax: 'ddd:hh24:mi-ddd:hh24:mi'. Eg: 'Mon:00:00-Mon:03:00' | string | false |  
 major_engine_version | Specifies the major version of the engine that this option group should be associated with | string | false |  
 max_allocated_storage | Specifies the value for Storage Autoscaling | number | false |  
 monitoring_interval | The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance. To disable collecting Enhanced Monitoring metrics, specify 0. The default is 0. Valid Values: 0, 1, 5, 10, 15, 30, 60 | number | false |  
 monitoring_role_arn | The ARN for the IAM role that permits RDS to send enhanced monitoring metrics to CloudWatch Logs. Must be specified if monitoring_interval is non-zero | string | false |  
 monitoring_role_description | Description of the monitoring IAM role | string | false |  
 monitoring_role_name | Name of the IAM role which will be created when create_monitoring_role is enabled | string | false |  
 multi_az | Specifies if the RDS instance is multi-AZ | bool | false |  
 option_group_description | The description of the option group | string | false |  
 option_group_name | Name of the option group | string | false |  
 option_group_timeouts | Define maximum timeout for deletion of `aws_db_option_group` resource | map(string) | false |  
 option_group_use_name_prefix | Determines whether to use `option_group_name` as is or create a unique name beginning with the `option_group_name` as the prefix | bool | false |  
 options | A list of Options to apply | any | false |  
 parameter_group_description | Description of the DB parameter group to create | string | false |  
 parameter_group_name | Name of the DB parameter group to associate or create | string | false |  
 parameter_group_use_name_prefix | Determines whether to use `parameter_group_name` as is or create a unique name beginning with the `parameter_group_name` as the prefix | bool | false |  
 parameters | A list of DB parameters (map) to apply | list(map(string)) | false |  
 password | Password for the master DB user. Note that this may show up in logs, and it will be stored in the state file | string | false |  
 performance_insights_enabled | Specifies whether Performance Insights are enabled | bool | false |  
 performance_insights_kms_key_id | The ARN for the KMS key to encrypt Performance Insights data | string | false |  
 performance_insights_retention_period | The amount of time in days to retain Performance Insights data. Either 7 (7 days) or 731 (2 years) | number | false |  
 port | The port on which the DB accepts connections | string | false |  
 publicly_accessible | Bool to control if instance is publicly accessible | bool | false |  
 putin_khuylo | Do you agree that Putin doesn't respect Ukrainian sovereignty and territorial integrity? More info: https://en.wikipedia.org/wiki/Putin_khuylo! | bool | false |  
 random_password_length | Length of random password to create | number | false |  
 replica_mode | Specifies whether the replica is in either mounted or open-read-only mode. This attribute is only supported by Oracle instances. Oracle replicas operate in open-read-only mode unless otherwise specified | string | false |  
 replicate_source_db | Specifies that this resource is a Replicate database, and to use this value as the source database. This correlates to the identifier of another Amazon RDS Database to replicate | string | false |  
 restore_to_point_in_time | Restore to a point in time (MySQL is NOT supported) | map(string) | false |  
 s3_import | Restore from a Percona Xtrabackup in S3 (only MySQL is supported) | map(string) | false |  
 skip_final_snapshot | Determines whether a final DB snapshot is created before the DB instance is deleted. If true is specified, no DBSnapshot is created. If false is specified, a DB snapshot is created before the DB instance is deleted | bool | false |  
 snapshot_identifier | Specifies whether or not to create this database from a snapshot. This correlates to the snapshot ID you'd find in the RDS console, e.g: rds:production-2015-06-26-06-05 | string | false |  
 storage_encrypted | Specifies whether the DB instance is encrypted | bool | false |  
 storage_type | One of 'standard' (magnetic), 'gp2' (general purpose SSD), or 'io1' (provisioned IOPS SSD). The default is 'io1' if iops is specified, 'gp2' if not | string | false |  
 subnet_ids | A list of VPC subnet IDs | list(string) | false |  
 tags | A mapping of tags to assign to all resources | map(string) | false |  
 timeouts | Updated Terraform resource management timeouts. Applies to `aws_db_instance` in particular to permit resource management times | map(string) | false |  
 timezone | Time zone of the DB instance. timezone is currently only supported by Microsoft SQL Server. The timezone can only be set on creation. See MSSQL User Guide for more information | string | false |  
 username | Username for the master DB user | string | false |  
 vpc_security_group_ids | List of VPC security groups to associate | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
