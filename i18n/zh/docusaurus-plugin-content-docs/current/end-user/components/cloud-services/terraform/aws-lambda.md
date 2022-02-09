---
title:  AWS LAMBDA
---

## 描述

Terraform module, which takes care of a lot of AWS Lambda/serverless tasks (build dependencies, packages, updates, deployments) in countless combinations

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 number_of_policies | Number of policies to attach to IAM role for Lambda Function | number | false |  
 policies | List of policy statements ARN to attach to Lambda Function role | list(string) | false |  
 policy_statements | Map of dynamic policy statements to attach to Lambda Function role | any | false |  
 ignore_source_code_hash | Whether to ignore changes to the function's source code hash. Set to true if you manage infrastructure and code deployments separately. | bool | false |  
 store_on_s3 | Whether to store produced artifacts on S3 or locally. | bool | false |  
 hash_extra | The string to add into hashing function. Useful when building same source path for different functions. | string | false |  
 runtime | Lambda Function runtime | string | false |  
 package_type | The Lambda deployment package type. Valid options: Zip or Image | string | false |  
 create_unqualified_alias_async_event_config | Whether to allow async event configuration on unqualified alias pointing to $LATEST version | bool | false |  
 local_existing_package | The absolute path to an existing zip-file to use | string | false |  
 s3_bucket | S3 bucket to store artifacts | string | false |  
 create_layer | Controls whether Lambda Layer resource should be created | bool | false |  
 image_config_command | The CMD for the docker image | list(string) | false |  
 maximum_event_age_in_seconds | Maximum age of a request that Lambda sends to a function for processing in seconds. Valid values between 60 and 21600. | number | false |  
 role_path | Path of IAM role to use for Lambda Function | string | false |  
 attach_network_policy | Controls whether VPC/network policy should be added to IAM role for Lambda Function | bool | false |  
 attach_policy | Controls whether policy should be added to IAM role for Lambda Function | bool | false |  
 attach_policies | Controls whether list of policies should be added to IAM role for Lambda Function | bool | false |  
 s3_prefix | Directory name where artifacts should be stored in the S3 bucket. If unset, the path from `artifacts_dir` is used | string | false |  
 tags | A map of tags to assign to resources. | map(string) | false |  
 attach_async_event_policy | Controls whether async event policy should be added to IAM role for Lambda Function | bool | false |  
 policy_json | An additional policy document as JSON to attach to the Lambda Function role | string | false |  
 artifacts_dir | Directory name where artifacts should be stored | string | false |  
 source_path | The absolute path to a local file or directory containing your Lambda source code | any | false |  
 docker_file | Path to a Dockerfile when building in Docker | string | false |  
 destination_on_failure | Amazon Resource Name (ARN) of the destination resource for failed asynchronous invocations | string | false |  
 tracing_mode | Tracing mode of the Lambda Function. Valid value can be either PassThrough or Active. | string | false |  
 role_permissions_boundary | The ARN of the policy that is used to set the permissions boundary for the IAM role used by Lambda Function | string | false |  
 file_system_arn | The Amazon Resource Name (ARN) of the Amazon EFS Access Point that provides access to the file system. | string | false |  
 create | Controls whether resources should be created | bool | false |  
 s3_object_tags_only | Set to true to not merge tags with s3_object_tags. Useful to avoid breaching S3 Object 10 tag limit. | bool | false |  
 image_config_working_directory | The working directory for the docker image | string | false |  
 layer_name | Name of Lambda Layer to create | string | false |  
 license_info | License info for your Lambda Layer. Eg, MIT or full url of a license. | string | false |  
 description | Description of your Lambda Function (or Layer) | string | false |  
 compatible_runtimes | A list of Runtimes this layer is compatible with. Up to 5 runtimes can be specified. | list(string) | false |  
 create_current_version_async_event_config | Whether to allow async event configuration on current version of Lambda Function (this will revoke permissions from previous version because Terraform manages only current resources) | bool | false |  
 create_current_version_allowed_triggers | Whether to allow triggers on current version of Lambda Function (this will revoke permissions from previous version because Terraform manages only current resources) | bool | false |  
 event_source_mapping | Map of event source mapping | any | false |  
 attach_policy_json | Controls whether policy_json should be added to IAM role for Lambda Function | bool | false |  
 s3_object_storage_class | Specifies the desired Storage Class for the artifact uploaded to S3. Can be either STANDARD, REDUCED_REDUNDANCY, ONEZONE_IA, INTELLIGENT_TIERING, or STANDARD_IA. | string | false |  
 docker_pip_cache | Whether to mount a shared pip cache folder into docker environment or not | any | false |  
 handler | Lambda Function entrypoint in your code | string | false |  
 recreate_missing_package | Whether to recreate missing Lambda package if it is missing locally or not | bool | false |  
 timeout | The amount of time your Lambda Function has to run in seconds. | number | false |  
 vpc_subnet_ids | List of subnet ids when Lambda Function should run in the VPC. Usually private or intra subnets. | list(string) | false |  
 create_unqualified_alias_allowed_triggers | Whether to allow triggers on unqualified alias pointing to $LATEST version | bool | false |  
 file_system_local_mount_path | The path where the function can access the file system, starting with /mnt/. | string | false |  
 function_name | A unique name for your Lambda Function | string | false |  
 environment_variables | A map that defines environment variables for the Lambda Function. | map(string) | false |  
 role_tags | A map of tags to assign to IAM role | map(string) | false |  
 attach_policy_jsons | Controls whether policy_jsons should be added to IAM role for Lambda Function | bool | false |  
 docker_with_ssh_agent | Whether to pass SSH_AUTH_SOCK into docker environment or not | bool | false |  
 architectures | Instruction set architecture for your Lambda function. Valid values are ["x86_64"] and ["arm64"]. | list(string) | false |  
 dead_letter_target_arn | The ARN of an SNS topic or SQS queue to notify when an invocation fails. | string | false |  
 vpc_security_group_ids | List of security group ids when Lambda Function should run in the VPC. | list(string) | false |  
 maximum_retry_attempts | Maximum number of times to retry when the function returns an error. Valid values between 0 and 2. Defaults to 2. | number | false |  
 allowed_triggers | Map of allowed triggers to create Lambda permissions | map(any) | false |  
 use_existing_cloudwatch_log_group | Whether to use an existing CloudWatch log group or create new | bool | false |  
 cloudwatch_logs_retention_in_days | Specifies the number of days you want to retain log events in the specified log group. Possible values are: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, and 3653. | number | false |  
 s3_acl | The canned ACL to apply. Valid values are private, public-read, public-read-write, aws-exec-read, authenticated-read, bucket-owner-read, and bucket-owner-full-control. Defaults to private. | string | false |  
 lambda_at_edge | Set this to true if using Lambda@Edge, to enable publishing, limit the timeout, and allow edgelambda.amazonaws.com to invoke the function | bool | false |  
 s3_server_side_encryption | Specifies server-side encryption of the object in S3. Valid values are "AES256" and "aws:kms". | string | false |  
 compatible_architectures | A list of Architectures Lambda layer is compatible with. Currently x86_64 and arm64 can be specified. | list(string) | false |  
 cloudwatch_logs_kms_key_id | The ARN of the KMS Key to use when encrypting log data. | string | false |  
 cloudwatch_logs_tags | A map of tags to assign to the resource. | map(string) | false |  
 policy_path | Path of policies to that should be added to IAM role for Lambda Function | string | false |  
 assume_role_policy_statements | Map of dynamic policy statements for assuming Lambda Function role (trust relationship) | any | false |  
 layers | List of Lambda Layer Version ARNs (maximum of 5) to attach to your Lambda Function. | list(string) | false |  
 image_uri | The ECR image URI containing the function's deployment package. | string | false |  
 create_async_event_config | Controls whether async event configuration for Lambda Function/Alias should be created | bool | false |  
 role_name | Name of IAM role to use for Lambda Function | string | false |  
 role_force_detach_policies | Specifies to force detaching any policies the IAM role has before destroying it. | bool | false |  
 trusted_entities | List of additional trusted entities for assuming Lambda Function role (trust relationship) | any | false |  
 docker_build_root | Root dir where to build in Docker | string | false |  
 memory_size | Amount of memory in MB your Lambda Function can use at runtime. Valid value between 128 MB to 10,240 MB (10 GB), in 64 MB increments. | number | false |  
 lambda_role |  IAM role ARN attached to the Lambda Function. This governs both who / what can invoke your Lambda Function, as well as what resources our Lambda Function has access to. See Lambda Permission Model for more details. | string | false |  
 destination_on_success | Amazon Resource Name (ARN) of the destination resource for successful asynchronous invocations | string | false |  
 docker_image | Docker image to use for the build | string | false |  
 create_function | Controls whether Lambda Function resource should be created | bool | false |  
 create_role | Controls whether IAM role for Lambda Function should be created | bool | false |  
 image_config_entry_point | The ENTRYPOINT for the docker image | list(string) | false |  
 role_description | Description of IAM role to use for Lambda Function | string | false |  
 attach_cloudwatch_logs_policy | Controls whether CloudWatch Logs policy should be added to IAM role for Lambda Function | bool | false |  
 attach_dead_letter_policy | Controls whether SNS/SQS dead letter notification policy should be added to IAM role for Lambda Function | bool | false |  
 create_package | Controls whether Lambda package should be created | bool | false |  
 s3_object_tags | A map of tags to assign to S3 bucket object. | map(string) | false |  
 layer_skip_destroy | Whether to retain the old version of a previously deployed Lambda Layer. | bool | false |  
 attach_tracing_policy | Controls whether X-Ray tracing policy should be added to IAM role for Lambda Function | bool | false |  
 number_of_policy_jsons | Number of policies JSON to attach to IAM role for Lambda Function | number | false |  
 attach_policy_statements | Controls whether policy_statements should be added to IAM role for Lambda Function | bool | false |  
 policy | An additional policy document ARN to attach to the Lambda Function role | string | false |  
 s3_existing_package | The S3 bucket object with keys bucket, key, version pointing to an existing zip-file to use | map(string) | false |  
 reserved_concurrent_executions | The amount of reserved concurrent executions for this Lambda Function. A value of 0 disables Lambda Function from being triggered and -1 removes any concurrency limitations. Defaults to Unreserved Concurrency Limits -1. | number | false |  
 build_in_docker | Whether to build dependencies in Docker | bool | false |  
 publish | Whether to publish creation/change as new Lambda Function Version. | bool | false |  
 provisioned_concurrent_executions | Amount of capacity to allocate. Set to 1 or greater to enable, or set to 0 to disable provisioned concurrency. | number | false |  
 policy_jsons | List of additional policy documents as JSON to attach to Lambda Function role | list(string) | false |  
 kms_key_arn | The ARN of KMS key to use by your Lambda Function | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
