---
title:  AWS EMR
---

## Description

Terraform module which creates EMR on AWS

## Specification

### Properties  
 Name | Description | Type | Required | Default 
------------|------------|------------|------------|------------
 additional_info | A JSON string for selecting additional features such as adding proxy information. Note: Currently there is no API to retrieve the value of this argument after EMR cluster creation from provider, therefore Terraform cannot detect drift from the actual EMR cluster if its value is changed outside Terraform | string | false |  
 additional_master_security_group | The name of the existing additional security group that will be used for EMR master node. If empty, a new security group will be created | string | false |  
 additional_slave_security_group | The name of the existing additional security group that will be used for EMR core & task nodes. If empty, a new security group will be created | string | false |  
 applications | A list of applications for the cluster. Valid values are: Flink, Ganglia, Hadoop, HBase, HCatalog, Hive, Hue, JupyterHub, Livy, Mahout, MXNet, Oozie, Phoenix, Pig, Presto, Spark, Sqoop, TensorFlow, Tez, Zeppelin, and ZooKeeper (as of EMR 5.25.0). Case insensitive | list(string) | true |  
 bootstrap_action | List of bootstrap actions that will be run before Hadoop is started on the cluster nodes. Each action should be an object with `path`, `name`, and `args` fields. Example:
```json
{
  "path": "s3://my-bucket/my-script.sh",
  "name": "SetupHadoop",
  "args": ["--arg1", "value1"]
}
```
 | `list<{path: string, name: string, args: list<string>}>` | false |  
 configurations_json | A JSON string for supplying list of configurations for the EMR cluster. See https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-configure-apps.html for more details | string | false |  
 core_instance_group_autoscaling_policy | String containing the EMR Auto Scaling Policy JSON for the Core instance group | string | false |  
 core_instance_group_bid_price | Bid price for each EC2 instance in the Core instance group, expressed in USD. By setting this attribute, the instance group is being declared as a Spot Instance, and will implicitly create a Spot request. Leave this blank to use On-Demand Instances | string | false |  
 core_instance_group_ebs_iops | The number of I/O operations per second (IOPS) that the Core volume supports | number | false |  
 core_instance_group_ebs_size | Core instances volume size, in gibibytes (GiB) | number | true |  
 core_instance_group_ebs_type | Core instances volume type. Valid options are `gp2`, `io1`, `standard` and `st1` | string | false |  
 core_instance_group_ebs_volumes_per_instance | The number of EBS volumes with this configuration to attach to each EC2 instance in the Core instance group | number | false |  
 core_instance_group_instance_count | Target number of instances for the Core instance group. Must be at least 1 | number | false |  
 core_instance_group_instance_type | EC2 instance type for all instances in the Core instance group | string | true |  
 create_task_instance_group | Whether to create an instance group for Task nodes. For more info: https://www.terraform.io/docs/providers/aws/r/emr_instance_group.html, https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-master-core-task-nodes.html | bool | false |  
 create_vpc_endpoint_s3 | Set to false to prevent the module from creating VPC S3 Endpoint | bool | false |  
 custom_ami_id | A custom Amazon Linux AMI for the cluster (instead of an EMR-owned AMI). Available in Amazon EMR version 5.7.0 and later | string | false |  
 ebs_root_volume_size | Size in GiB of the EBS root device volume of the Linux AMI that is used for each EC2 instance. Available in Amazon EMR version 4.x and later | number | false |  
 ec2_autoscaling_role_enabled | If set to `false`, will use `existing_ec2_autoscaling_role_arn` for an existing EC2 autoscaling IAM role that was created outside of this module | bool | false |  
 ec2_autoscaling_role_permissions_boundary | The Permissions Boundary ARN to apply to the EC2 Autoscaling Role. | string | false |  
 ec2_role_enabled | If set to `false`, will use `existing_ec2_instance_profile_arn` for an existing EC2 IAM role that was created outside of this module | bool | false |  
 ec2_role_permissions_boundary | The Permissions Boundary ARN to apply to the EC2 Role. | string | false |  
 emr_role_permissions_boundary | The Permissions Boundary ARN to apply to the EMR Role. | string | false |  
 existing_ec2_autoscaling_role_arn | ARN of an existing EC2 autoscaling role to attach to the cluster | string | false |  
 existing_ec2_instance_profile_arn | ARN of an existing EC2 instance profile | string | false |  
 existing_service_role_arn | ARN of an existing EMR service role to attach to the cluster | string | false |  
 keep_job_flow_alive_when_no_steps | Switch on/off run cluster with no steps or when all steps are complete | bool | false |  
 kerberos_ad_domain_join_password | The Active Directory password for ad_domain_join_user. Terraform cannot perform drift detection of this configuration. | string | false |  
 kerberos_ad_domain_join_user | Required only when establishing a cross-realm trust with an Active Directory domain. A user with sufficient privileges to join resources to the domain. Terraform cannot perform drift detection of this configuration. | string | false |  
 kerberos_cross_realm_trust_principal_password | Required only when establishing a cross-realm trust with a KDC in a different realm. The cross-realm principal password, which must be identical across realms. Terraform cannot perform drift detection of this configuration. | string | false |  
 kerberos_enabled | Set to true if EMR cluster will use kerberos_attributes | bool | false |  
 kerberos_kdc_admin_password | The password used within the cluster for the kadmin service on the cluster-dedicated KDC, which maintains Kerberos principals, password policies, and keytabs for the cluster. Terraform cannot perform drift detection of this configuration. | string | false |  
 kerberos_realm | The name of the Kerberos realm to which all nodes in a cluster belong. For example, EC2.INTERNAL | string | false |  
 key_name | Amazon EC2 key pair that can be used to ssh to the master node as the user called `hadoop` | string | false |  
 log_uri | The path to the Amazon S3 location where logs for this cluster are stored | string | false |  
 managed_master_security_group | The name of the existing managed security group that will be used for EMR master node. If empty, a new security group will be created | string | false |  
 managed_slave_security_group | The name of the existing managed security group that will be used for EMR core & task nodes. If empty, a new security group will be created | string | false |  
 master_allowed_cidr_blocks | List of CIDR blocks to be allowed to access the master instances | list(string) | false |  
 master_allowed_security_groups | List of security groups to be allowed to connect to the master instances | list(string) | false |  
 master_dns_name | Name of the cluster CNAME record to create in the parent DNS zone specified by `zone_id`. If left empty, the name will be auto-asigned using the format `emr-master-var.name` | string | false |  
 master_instance_group_bid_price | Bid price for each EC2 instance in the Master instance group, expressed in USD. By setting this attribute, the instance group is being declared as a Spot Instance, and will implicitly create a Spot request. Leave this blank to use On-Demand Instances | string | false |  
 master_instance_group_ebs_iops | The number of I/O operations per second (IOPS) that the Master volume supports | number | false |  
 master_instance_group_ebs_size | Master instances volume size, in gibibytes (GiB) | number | true |  
 master_instance_group_ebs_type | Master instances volume type. Valid options are `gp2`, `io1`, `standard` and `st1` | string | false |  
 master_instance_group_ebs_volumes_per_instance | The number of EBS volumes with this configuration to attach to each EC2 instance in the Master instance group | number | false |  
 master_instance_group_instance_count | Target number of instances for the Master instance group. Must be at least 1 | number | false |  
 master_instance_group_instance_type | EC2 instance type for all instances in the Master instance group | string | true |  
 region | AWS region | string | true |  
 release_label | The release label for the Amazon EMR release. https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-5x.html | string | false |  
 route_table_id | Route table ID for the VPC S3 Endpoint when launching the EMR cluster in a private subnet. Required when `subnet_type` is `private` | string | false |  
 scale_down_behavior | The way that individual Amazon EC2 instances terminate when an automatic scale-in activity occurs or an instance group is resized | string | false |  
 security_configuration | The security configuration name to attach to the EMR cluster. Only valid for EMR clusters with `release_label` 4.8.0 or greater. See https://www.terraform.io/docs/providers/aws/r/emr_security_configuration.html for more info | string | false |  
 service_access_security_group | The name of the existing additional security group that will be used for EMR core & task nodes. If empty, a new security group will be created | string | false |  
 service_role_enabled | If set to `false`, will use `existing_service_role_arn` for an existing IAM role that was created outside of this module | bool | false |  
 slave_allowed_cidr_blocks | List of CIDR blocks to be allowed to access the slave instances | list(string) | false |  
 slave_allowed_security_groups | List of security groups to be allowed to connect to the slave instances | list(string) | false |  
 step_concurrency_level | The number of steps that can be executed concurrently. You can specify a maximum of 256 steps. Only valid for EMR clusters with release_label 5.28.0 or greater. | number | false |  
 steps | List of steps to run when creating the cluster. Each step should be an object with `name`, `action_on_failure`, and `hadoop_jar_step` fields. Example:
```json
{
  "name": "WordCount",
  "action_on_failure": "CONTINUE",
  "hadoop_jar_step": {
    "jar": "command-runner.jar",
    "args": ["spark-submit", "--class", "org.apache.spark.examples.SparkPi", "/usr/lib/spark/examples/jars/spark-examples.jar"],
    "main_class": "",
    "properties": {}
  }
}
```
 | `list<{
  name: string,
  action_on_failure: string,
  hadoop_jar_step: {
    args: list<string>,
    jar: string,
    main_class: string,
    properties: map<string>
  }
}>` | false |  
 subnet_id | VPC subnet ID where you want the job flow to launch. Cannot specify the `cc1.4xlarge` instance type for nodes of a job flow launched in a Amazon VPC | string | true |  
 subnet_type | Type of VPC subnet ID where you want the job flow to launch. Supported values are `private` or `public` | string | false |  
 task_instance_group_autoscaling_policy | String containing the EMR Auto Scaling Policy JSON for the Task instance group | string | false |  
 task_instance_group_bid_price | Bid price for each EC2 instance in the Task instance group, expressed in USD. By setting this attribute, the instance group is being declared as a Spot Instance, and will implicitly create a Spot request. Leave this blank to use On-Demand Instances | string | false |  
 task_instance_group_ebs_iops | The number of I/O operations per second (IOPS) that the Task volume supports | number | false |  
 task_instance_group_ebs_optimized | Indicates whether an Amazon EBS volume in the Task instance group is EBS-optimized. Changing this forces a new resource to be created | bool | false |  
 task_instance_group_ebs_size | Task instances volume size, in gibibytes (GiB) | number | false |  
 task_instance_group_ebs_type | Task instances volume type. Valid options are `gp2`, `io1`, `standard` and `st1` | string | false |  
 task_instance_group_ebs_volumes_per_instance | The number of EBS volumes with this configuration to attach to each EC2 instance in the Task instance group | number | false |  
 task_instance_group_instance_count | Target number of instances for the Task instance group. Must be at least 1 | number | false |  
 task_instance_group_instance_type | EC2 instance type for all instances in the Task instance group | string | false |  
 termination_protection | Switch on/off termination protection (default is false, except when using multiple master nodes). Before attempting to destroy the resource when termination protection is enabled, this configuration must be applied with its value set to false | bool | false |  
 use_existing_additional_master_security_group | If set to `true`, will use variable `additional_master_security_group` using an existing security group that was created outside of this module | bool | false |  
 use_existing_additional_slave_security_group | If set to `true`, will use variable `additional_slave_security_group` using an existing security group that was created outside of this module | bool | false |  
 use_existing_managed_master_security_group | If set to `true`, will use variable `managed_master_security_group` using an existing security group that was created outside of this module | bool | false |  
 use_existing_managed_slave_security_group | If set to `true`, will use variable `managed_slave_security_group` using an existing security group that was created outside of this module | bool | false |  
 use_existing_service_access_security_group | If set to `true`, will use variable `service_access_security_group` using an existing security group that was created outside of this module | bool | false |  
 visible_to_all_users | Whether the job flow is visible to all IAM users of the AWS account associated with the job flow | bool | false |  
 vpc_id | VPC ID to create the cluster in (e.g. `vpc-a22222ee`) | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_id | Route53 parent zone ID. If provided (not empty), the module will create sub-domain DNS records for the masters and slaves | string | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
