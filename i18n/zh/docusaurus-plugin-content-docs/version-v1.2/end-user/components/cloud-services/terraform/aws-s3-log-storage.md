---
title:  AWS S3-LOG-STORAGE
---

## 描述

This module creates an S3 bucket suitable for receiving logs from other AWS services such as S3, CloudFront, and CloudTrail

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 acl | The canned ACL to apply. We recommend log-delivery-write for compatibility with AWS services | string | false |  
 lifecycle_prefix | Prefix filter. Used to manage object lifecycle events | string | false |  
 lifecycle_rule_enabled | Enable lifecycle events on this bucket | bool | false |  
 expiration_days | Number of days after which to expunge the objects | number | false |  
 lifecycle_tags | Tags filter. Used to manage object lifecycle events | map(string) | false |  
 versioning_enabled | A state of versioning. Versioning is a means of keeping multiple variants of an object in the same bucket | bool | false |  
 noncurrent_version_transition_days | Specifies when noncurrent object versions transitions | number | false |  
 ignore_public_acls | Set to `false` to disable the ignoring of public access lists on the bucket | bool | false |  
 access_log_bucket_name | Name of the S3 bucket where S3 access logs will be sent to | string | false |  
 bucket_notifications_type | Type of the notification configuration. Only SQS is supported. | string | false |  
 restrict_public_buckets | Set to `false` to disable the restricting of making the bucket public | bool | false |  
 force_destroy | (Optional, Default:false ) A boolean that indicates all objects should be deleted from the bucket so that the bucket can be destroyed without error. These objects are not recoverable | bool | false |  
 sse_algorithm | The server-side encryption algorithm to use. Valid values are AES256 and aws:kms | string | false |  
 standard_transition_days | Number of days to persist in the standard storage tier before moving to the infrequent access tier | number | false |  
 abort_incomplete_multipart_upload_days | Maximum time (in days) that you want to allow multipart uploads to remain in progress | number | false |  
 allow_ssl_requests_only | Set to `true` to require requests to use Secure Socket Layer (HTTPS/SSL). This will explicitly deny access to HTTP requests | bool | false |  
 block_public_policy | Set to `false` to disable the blocking of new public policies on the bucket | bool | false |  
 versioning_mfa_delete_enabled | Enable MFA delete for the bucket | string | false |  
 bucket_notifications_prefix | Prefix filter. Used to manage object notifications | string | false |  
 noncurrent_version_expiration_days | Specifies when noncurrent object versions expire | number | false |  
 glacier_transition_days | Number of days after which to move the data to the glacier storage tier | number | false |  
 block_public_acls | Set to `false` to disable the blocking of new public access lists on the bucket | bool | false |  
 access_log_bucket_prefix | Prefix to prepend to the current S3 bucket name, where S3 access logs will be sent to | string | false |  
 allow_encrypted_uploads_only | Set to `true` to prevent uploads of unencrypted objects to S3 bucket | bool | false |  
 bucket_notifications_enabled | Send notifications for the object created events. Used for 3rd-party log collection from a bucket | bool | false |  
 policy | A valid bucket policy JSON document. Note that if the policy document is not specific enough (but still valid), Terraform may view the policy as constantly changing in a terraform plan. In this case, please make sure you use the verbose/specific version of the policy | string | false |  
 enable_glacier_transition | Enables the transition to AWS Glacier which can cause unnecessary costs for huge amount of small files | bool | false |  
 kms_master_key_arn | The AWS KMS master key ARN used for the SSE-KMS encryption. This can only be used when you set the value of sse_algorithm as aws:kms. The default aws/s3 AWS KMS master key is used if this element is absent while the sse_algorithm is aws:kms | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
