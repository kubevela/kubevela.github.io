---
title:  AWS LAMBDA-WITH-INLINE-CODE
---

## Description

Terraform module creating a Lambda function with inline code

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 archive_file | An instance of the `archive_file` data source containing the code of the Lambda function. Conflicts with `source_dir`. | object({\n    output_path         = string\n    output_base64sha256 = string\n  }) | false |  
 cloudwatch_log_group_retention_in_days | The number of days to retain the log of the Lambda function. | number | false |  
 description | Description of the Lambda function. | string | true |  
 environment_variables | Environment variable key-value pairs. | map(string) | false |  
 function_name | Name of the Lambda function. | string | true |  
 handler | The name of the method within your code that Lambda calls to execute your function. | string | true |  
 layers | List of up to five Lambda layer ARNs. | list(string) | false |  
 memory_size | The amount of memory (in MB) available to the function at runtime. Increasing the Lambda function memory also increases its CPU allocation. | number | true |  
 reserved_concurrent_executions | The number of simultaneous executions to reserve for the Lambda function. | number | true |  
 runtime | The identifier of the Lambda function [runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html). | string | true |  
 secret_environment_variables | Map of environment variable names to ARNs of AWS Secret Manager secrets.\n\nEach ARN will be passed as environment variable to the lambda function with the key's name extended by suffix _SECRET_ARN. When initializing the Lambda run time environment, the Lambda function or a [wrapper script](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-modify.html#runtime-wrapper) can look up the secret value.\n\nPermission will be added allowing the Lambda function to read the secret values.\n | map(string) | false |  
 source_dir | Path of the directory which shall be packed as code of the Lambda function. Conflicts with `archive_file`. | string | false |  
 tags | Tags which will be assigned to all resources. | map(string) | false |  
 timeout | The amount of time (in seconds) per execution before stopping it. | number | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
