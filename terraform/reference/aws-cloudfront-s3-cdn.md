---
title:  AWS CLOUDFRONT-S3-CDN
---

## Description

Terraform module to easily provision CloudFront CDN backed by an S3 origin

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 access_log_bucket_name | DEPRECATED. Use ``s3_access_log_bucket_name`` instead. | string | false |
 acm_certificate_arn | Existing ACM Certificate ARN | string | false |  
 additional_bucket_policy | Additional policies for the bucket. If included in the policies, the variables ``${bucket_name}``, ``${origin_path}`` and ``${cloudfront_origin_access_identity_iam_arn}`` will be substituted.\nIt is also possible to override the default policy statements by providing statements with ``S3GetObjectForCloudFront`` and ``S3ListBucketForCloudFront`` sid.\n | string | false |  
 aliases | List of FQDN's - Used to set the Alternate Domain Names (CNAMEs) setting on Cloudfront | list(string) | false |  
 allow_ssl_requests_only | Set to ``true`` to require requests to use Secure Socket Layer (HTTPS/SSL). This will explicitly deny access to HTTP requests | bool | false |  
 allowed_methods | List of allowed methods (e.g. GET, PUT, POST, DELETE, HEAD) for AWS CloudFront | list(string) | false |  
 block_origin_public_access_enabled | When set to 'true' the s3 origin bucket will have public access block enabled | bool | false |
 cache_policy_id | The unique identifier of the existing cache policy to attach to the default cache behavior.\nIf not provided, this module will add a default cache policy using other provided inputs.\n | string | false |  
 cached_methods | List of cached methods (e.g. GET, PUT, POST, DELETE, HEAD) | list(string) | false |  
 cloudfront_access_log_bucket_name | When ``cloudfront_access_log_create_bucket`` is ``false``, this is the name of the existing S3 Bucket where Cloudfront Access Logs are to be delivered and is required. IGNORED when ``cloudfront_access_log_create_bucket`` is ``true``. | string | false |  
 cloudfront_access_log_create_bucket | When ``true`` and ``cloudfront_access_logging_enabled`` is also true, this module will create a new, separate S3 bucket to receive Cloudfront Access Logs. | bool | false |  
 cloudfront_access_log_include_cookies | Set true to include cookies in Cloudfront Access Logs | bool | false |  
 cloudfront_access_log_prefix | Prefix to use for Cloudfront Access Log object keys. Defaults to no prefix. | string | false |  
 log_expiration_days | Number of days after object creation to expire Cloudfront Access Log objects. Only effective if ``cloudfront_access_log_create_bucket`` is ``true``. | number | false |  
 log_glacier_transition_days | Number of days after object creation to move Cloudfront Access Log objects to the glacier tier. Only effective if ``cloudfront_access_log_create_bucket`` is ``true``. | number | false |  
 log_include_cookies | DEPRECATED. Use ``cloudfront_access_log_include_cookies`` instead. | bool | false |
 log_prefix | DEPRECATED. Use ``cloudfront_access_log_prefix`` instead. | string | false |
 log_standard_transition_days | Number of days after object creation to move Cloudfront Access Log objects to the infrequent access tier. Only effective if ``cloudfront_access_log_create_bucket`` is ``true``. | number | false |  
 log_versioning_enabled | Set ``true`` to enable object versioning in the created Cloudfront Access Log S3 Bucket. Only effective if ``cloudfront_access_log_create_bucket`` is ``true``. | bool | false |  
 logging_enabled | DEPRECATED. Use ``cloudfront_access_logging_enabled`` instead. | bool | false |
 max_ttl | Maximum amount of time (in seconds) that an object is in a CloudFront cache | number | false |  
 min_ttl | Minimum amount of time that you want objects to stay in CloudFront caches | number | false |  
 minimum_protocol_version | Cloudfront TLS minimum protocol version. If ``var.acm_certificate_arn`` is unset, only "TLSv1" can be specified. See: [AWS Cloudfront create-distribution documentation](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/create-distribution.html) and [Supported protocols and ciphers between viewers and CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/secure-connections-supported-viewer-protocols-ciphers.html#secure-connections-supported-ciphers) for more information. Defaults to "TLSv1.2_2019" unless ``var.acm_certificate_arn`` is unset, in which case it defaults to ``TLSv1`` | string | false |
 ordered_cache | An ordered list of cache behaviors for this distribution. See Cache Behavior Schema section below. | `list(object({ target_origin_id = string, path_pattern = string, allowed_methods = list(string), cached_methods = list(string), compress = bool, trusted_signers = list(string), trusted_key_groups = list(string) }))` | false |
 origin_bucket | Name of an existing S3 bucket to use as the origin. If this is not provided, it will create a new s3 bucket using ``var.name`` and other context related inputs | string | false |  
 origin_force_destroy | Delete all objects from the bucket so that the bucket can be destroyed without error (e.g. ``true`` or ``false``) | bool | false |  
 origin_groups | List of Origin Groups to create in the distribution. See Origin Groups Schema section below. | `list(object({ primary_origin_id = string, failover_origin_id = string, failover_criteria = list(string) }))` | false |
 origin_path | An optional element that causes CloudFront to request your content from a directory in your Amazon S3 bucket or your custom origin. It must begin with a /. Do not add a / at the end of the path. | string | false |  
 origin_request_policy_id | The unique identifier of the origin request policy that is attached to the behavior.\nShould be used in conjunction with ``cache_policy_id``.\n | string | false |  
 origin_ssl_protocols | The SSL/TLS protocols that you want CloudFront to use when communicating with your origin over HTTPS. | list(string) | false |  
 override_origin_bucket_policy | When using an existing origin bucket (through var.origin_bucket), setting this to 'false' will make it so the existing bucket policy will not be overriden | bool | false |  
 parent_zone_id | ID of the hosted zone to contain this record (or specify `parent_zone_name`). Requires `dns_alias_enabled` set to true | string | false |  
 parent_zone_name | Name of the hosted zone to contain this record (or specify `parent_zone_id`). Requires `dns_alias_enabled` set to true | string | false |  
 price_class | Price class for this distribution: `PriceClass_All`, `PriceClass_200`, `PriceClass_100` | string | false |  
 query_string_cache_keys | When `forward_query_string` is enabled, only the query string keys listed in this argument are cached (incompatible with `cache_policy_id`) | list(string) | false |  
 realtime_log_config_arn | The ARN of the real-time log configuration that is attached to this cache behavior | string | false |  
 redirect_all_requests_to | A hostname to redirect all website requests for this distribution to. If this is set, it overrides other website settings | string | false |  
 response_headers_policy_id | The identifier for a response headers policy | string | false |  
 routing_rules | A json array containing routing rules describing redirect behavior and when redirects are applied | string | false |  
 s3_access_log_bucket_name | Name of the existing S3 bucket where S3 Access Logs will be delivered. Default is not to enable S3 Access Logging. | string | false |  
 s3_access_log_prefix | Prefix to use for S3 Access Log object keys. Defaults to `logs/${module.this.id}` | string | false |  
 s3_access_logging_enabled | Set `true` to deliver S3 Access Logs to the `s3_access_log_bucket_name` bucket.\nDefaults to `false` if `s3_access_log_bucket_name` is empty (the default), `true` otherwise.\nMust be set explicitly if the access log bucket is being created at the same time as this module is being invoked.\n | bool | false |  
 s3_object_ownership | Specifies the S3 object ownership control on the origin bucket. Valid values are `ObjectWriter`, `BucketOwnerPreferred`, and 'BucketOwnerEnforced'. | string | false |  
 s3_origins | A list of S3 origins (in addition to the one created by this module) for this distribution. See S3 Origins Schema section below. | list | false |
 s3_website_password_enabled | If set to true, and `website_enabled` is also true, a password will be required in the `Referrer` field of the\nHTTP request in order to access the website, and Cloudfront will be configured to pass this password in its requests.\nThis will make it much harder for people to bypass Cloudfront and access the S3 website directly via its website endpoint.\n | bool | false |  
 trusted_key_groups | A list of key group IDs that CloudFront can use to validate signed URLs or signed cookies. | list(string) | false |  
 trusted_signers | The AWS accounts, if any, that you want to allow to create signed URLs for private content. 'self' is acceptable. | list(string) | false |  
 versioning_enabled | When set to 'true' the s3 origin bucket will have versioning enabled | bool | false |  
 viewer_protocol_policy | Limit the protocol users can use to access content. One of `allow-all`, `https-only`, or `redirect-to-https` | string | false |  
 wait_for_deployment | When set to 'true' the resource will wait for the distribution status to change from InProgress to Deployed | bool | false |  
 web_acl_id | ID of the AWS WAF web ACL that is associated with the distribution | string | false |  
 website_enabled | Set to true to enable the created S3 bucket to serve as a website independently of Cloudfront,\nand to use that website as the origin. See the README for details and caveats. See also `s3_website_password_enabled`.\n | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


### Schema Definitions

#### Cache Behavior Schema

```hcl
list(object({
  target_origin_id = string
  path_pattern     = string
  allowed_methods  = list(string)
  cached_methods   = list(string)
  compress         = bool
  trusted_signers  = list(string)
  trusted_key_groups = list(string)
  # ... and other fields
}))
```

#### Origin Groups Schema

```hcl
list(object({
  primary_origin_id  = string
  failover_origin_id = string
  failover_criteria  = list(string)
}))
```

#### S3 Origins Schema

```hcl
list(object({
  domain_name = string
  origin_id   = string
  origin_path = string
  s3_origin_config = object({
    origin_access_identity = string
  })
}))
```

#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
