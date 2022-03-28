---
title:  Gcp-Mq
---

## 描述

GCP MQ

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 auto_minor_version_upgrade | Enables automatic upgrades to new minor versions for brokers, as Apache releases the versions | bool | false |  
 security_group_rules | A list of maps of Security Group rules. \nThe values of map is fully complated with `aws_security_group_rule` resource. \nTo get more info see https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group_rule .\n | list(any) | false |  
 kms_ssm_key_arn | ARN of the AWS KMS key used for SSM encryption | string | false |  
 use_aws_owned_key | Boolean to enable an AWS owned Key Management Service (KMS) Customer Master Key (CMK) for Amazon MQ encryption that is not in your account | bool | false |  
 engine_version | The version of the broker engine. See https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/broker-engine.html for more details | string | false |  
 maintenance_time_of_day | The maintenance time, in 24-hour format. e.g. 02:00 | string | false |  
 security_groups | A list of Security Group IDs to associate with AmazonMQ. | list(string) | false |  
 overwrite_ssm_parameter | Whether to overwrite an existing SSM parameter | bool | false |  
 engine_type | Type of broker engine, `ActiveMQ` or `RabbitMQ` | string | false |  
 maintenance_time_zone | The maintenance time zone, in either the Country/City format, or the UTC offset format. e.g. CET | string | false |  
 mq_admin_password | Admin password | string | false |  
 audit_log_enabled | Enables audit logging. User management action made using JMX or the ActiveMQ Web Console is logged | bool | false |  
 kms_mq_key_arn | ARN of the AWS KMS key used for Amazon MQ encryption | string | false |  
 deployment_mode | The deployment mode of the broker. Supported: SINGLE_INSTANCE and ACTIVE_STANDBY_MULTI_AZ | string | false |  
 mq_admin_user | Admin username | string | false |  
 security_group_description | The Security Group description. | string | false |  
 ssm_path | SSM path | string | false |  
 publicly_accessible | Whether to enable connections from applications outside of the VPC that hosts the broker's subnets | bool | false |  
 maintenance_day_of_week | The maintenance day of the week. e.g. MONDAY, TUESDAY, or WEDNESDAY | string | false |  
 subnet_ids | List of VPC subnet IDs | list(string) | true |  
 security_group_use_name_prefix | Whether to create a default Security Group with unique name beginning with the normalized prefix. | bool | false |  
 apply_immediately | Specifies whether any cluster modifications are applied immediately, or during the next maintenance window | bool | false |  
 mq_application_user | Application username | string | false |  
 security_group_enabled | Whether to create Security Group. | bool | false |  
 vpc_id | VPC ID to create the broker in | string | true |  
 ssm_parameter_name_format | SSM parameter name format | string | false |  
 encryption_enabled | Flag to enable/disable Amazon MQ encryption at rest | bool | false |  
 host_instance_type | The broker's instance type. e.g. mq.t2.micro or mq.m4.large | string | false |  
 general_log_enabled | Enables general logging via CloudWatch | bool | false |  
 mq_application_password | Application password | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
