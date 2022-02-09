---
title:  AWS CLOUDFRONT-S3-CDN
---

## 描述

Terraform module to easily provision CloudFront CDN backed by an S3 origin

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 web_acl_id | ID of the AWS WAF web ACL that is associated with the distribution | string | false |  
 website_enabled | Set to true to enable the created S3 bucket to serve as a website independently of Cloudfront,
and to use that website as the origin. See the README for details and caveats. See also `s3_website_password_enabled`.
 | bool | false |  
 s3_access_log_prefix | Prefix to use for S3 Access Log object keys. Defaults to `logs/${module.this.id}` | string | false |  
 log_include_cookies | DEPRECATED. Use `cloudfront_access_log_include_cookies` instead. | bool | false |  
 cors_allowed_origins | List of allowed origins (e.g. example.com, test.com) for S3 bucket | list(string) | false |  
 forward_header_values | A list of whitelisted header values to forward to the origin (incompatible with `cache_policy_id`) | list(string) | false |  
 min_ttl | Minimum amount of time that you want objects to stay in CloudFront caches | number | false |  
 origin_ssl_protocols | The SSL/TLS protocols that you want CloudFront to use when communicating with your origin over HTTPS. | list(string) | false |  
 external_aliases | List of FQDN's - Used to set the Alternate Domain Names (CNAMEs) setting on Cloudfront. No new route53 records will be created for these | list(string) | false |  
 cors_allowed_methods | List of allowed methods (e.g. GET, PUT, POST, DELETE, HEAD) for S3 bucket | list(string) | false |  
 compress | Compress content for web requests that include Accept-Encoding: gzip in the request header | bool | false |  
 default_root_object | Object that CloudFront return when requests the root URL | string | false |  
 log_versioning_enabled | Set `true` to enable object versioning in the created Cloudfront Access Log S3 Bucket.
Only effective if `cloudfront_access_log_create_bucket` is `true`.
 | bool | false |  
 cors_max_age_seconds | Time in seconds that browser can cache the response for S3 bucket | number | false |  
 default_ttl | Default amount of time (in seconds) that an object is in a CloudFront cache | number | false |  
 geo_restriction_type | Method that use to restrict distribution of your content by country: `none`, `whitelist`, or `blacklist` | string | false |  
 additional_bucket_policy | Additional policies for the bucket. If included in the policies, the variables `${bucket_name}`, `${origin_path}` and `${cloudfront_origin_access_identity_iam_arn}` will be substituted.
It is also possible to override the default policy statements by providing statements with `S3GetObjectForCloudFront` and `S3ListBucketForCloudFront` sid.
 | string | false |  
 origin_bucket | Name of an existing S3 bucket to use as the origin. If this is not provided, it will create a new s3 bucket using `var.name` and other context related inputs | string | false |  
 cloudfront_origin_access_identity_path | Existing cloudfront origin access identity path used in the cloudfront distribution's s3_origin_config content | string | false |  
 custom_error_response | List of one or more custom error response element maps | list(object({
    error_caching_min_ttl = string
    error_code            = string
    response_code         = string
    response_page_path    = string
  })) | false |  
 redirect_all_requests_to | A hostname to redirect all website requests for this distribution to. If this is set, it overrides other website settings | string | false |  
 trusted_key_groups | A list of key group IDs that CloudFront can use to validate signed URLs or signed cookies. | list(string) | false |  
 block_origin_public_access_enabled | When set to 'true' the s3 origin bucket will have public access block enabled | bool | false |  
 s3_object_ownership | Specifies the S3 object ownership control on the origin bucket. Valid values are `ObjectWriter`, `BucketOwnerPreferred`, and 'BucketOwnerEnforced'. | string | false |  
 origin_groups | List of [Origin Groups](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_distribution#origin-group-arguments) to create in the distribution.
The values of `primary_origin_id` and `failover_origin_id` must correspond to origin IDs existing in `var.s3_origins` or `var.custom_origins`.

If `primary_origin_id` is set to `null` or `""`, then the origin id of the origin created by this module will be used in its place.
This is to allow for the use case of making the origin created by this module the primary origin in an origin group.
 | list(object({
    primary_origin_id  = string
    failover_origin_id = string
    failover_criteria  = list(string)
  })) | false |  
 logging_enabled | DEPRECATED. Use `cloudfront_access_logging_enabled` instead. | bool | false |  
 origin_force_destroy | Delete all objects from the bucket so that the bucket can be destroyed without error (e.g. `true` or `false`) | bool | false |  
 forward_cookies | Specifies whether you want CloudFront to forward all or no cookies to the origin. Can be 'all' or 'none' | string | false |  
 parent_zone_id | ID of the hosted zone to contain this record (or specify `parent_zone_name`). Requires `dns_alias_enabled` set to true | string | false |  
 index_document | Amazon S3 returns this index document when requests are made to the root domain or any of the subfolders | string | false |  
 s3_access_logging_enabled | Set `true` to deliver S3 Access Logs to the `s3_access_log_bucket_name` bucket.
Defaults to `false` if `s3_access_log_bucket_name` is empty (the default), `true` otherwise.
Must be set explicitly if the access log bucket is being created at the same time as this module is being invoked.
 | bool | false |  
 price_class | Price class for this distribution: `PriceClass_All`, `PriceClass_200`, `PriceClass_100` | string | false |  
 allowed_methods | List of allowed methods (e.g. GET, PUT, POST, DELETE, HEAD) for AWS CloudFront | list(string) | false |  
 s3_website_password_enabled | If set to true, and `website_enabled` is also true, a password will be required in the `Referrer` field of the
HTTP request in order to access the website, and Cloudfront will be configured to pass this password in its requests.
This will make it much harder for people to bypass Cloudfront and access the S3 website directly via its website endpoint.
 | bool | false |  
 ipv6_enabled | Set to true to enable an AAAA DNS record to be set as well as the A record | bool | false |  
 cloudfront_access_log_create_bucket | When `true` and `cloudfront_access_logging_enabled` is also true, this module will create a new,
separate S3 bucket to receive Cloudfront Access Logs.
 | bool | false |  
 cached_methods | List of cached methods (e.g. GET, PUT, POST, DELETE, HEAD) | list(string) | false |  
 cache_policy_id | The unique identifier of the existing cache policy to attach to the default cache behavior.
If not provided, this module will add a default cache policy using other provided inputs.
 | string | false |  
 extra_logs_attributes | Additional attributes to add to the end of the generated Cloudfront Access Log S3 Bucket name.
Only effective if `cloudfront_access_log_create_bucket` is `true`.
 | list(string) | false |  
 extra_origin_attributes | Additional attributes to put onto the origin label | list(string) | false |  
 origin_path | An optional element that causes CloudFront to request your content from a directory in your Amazon S3 bucket or your custom origin. It must begin with a /. Do not add a / at the end of the path. | string | false |  
 encryption_enabled | When set to 'true' the resource will have aes256 encryption enabled by default | bool | false |  
 ordered_cache | An ordered list of [cache behaviors](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_distribution#cache-behavior-arguments) resource for this distribution.
List in order of precedence (first match wins). This is in addition to the default cache policy.
Set `target_origin_id` to `""` to specify the S3 bucket origin created by this module.
 | list(object({
    target_origin_id = string
    path_pattern     = string

    allowed_methods    = list(string)
    cached_methods     = list(string)
    compress           = bool
    trusted_signers    = list(string)
    trusted_key_groups = list(string)

    cache_policy_id          = string
    origin_request_policy_id = string

    viewer_protocol_policy     = string
    min_ttl                    = number
    default_ttl                = number
    max_ttl                    = number
    response_headers_policy_id = string

    forward_query_string              = bool
    forward_header_values             = list(string)
    forward_cookies                   = string
    forward_cookies_whitelisted_names = list(string)

    lambda_function_association = list(object({
      event_type   = string
      include_body = bool
      lambda_arn   = string
    }))

    function_association = list(object({
      event_type   = string
      function_arn = string
    }))
  })) | false |  
 log_prefix | DEPRECATED. Use `cloudfront_access_log_prefix` instead. | string | false |  
 minimum_protocol_version | Cloudfront TLS minimum protocol version.
If `var.acm_certificate_arn` is unset, only "TLSv1" can be specified. See: [AWS Cloudfront create-distribution documentation](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/create-distribution.html)
and [Supported protocols and ciphers between viewers and CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/secure-connections-supported-viewer-protocols-ciphers.html#secure-connections-supported-ciphers) for more information.
Defaults to "TLSv1.2_2019" unless `var.acm_certificate_arn` is unset, in which case it defaults to `TLSv1`
 | string | false |  
 function_association | A config block that triggers a CloudFront function with specific actions.
See the [aws_cloudfront_distribution](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_distribution#function-association)
documentation for more information.
 | list(object({
    event_type   = string
    function_arn = string
  })) | false |  
 origin_request_policy_id | The unique identifier of the origin request policy that is attached to the behavior.
Should be used in conjunction with `cache_policy_id`.
 | string | false |  
 dns_alias_enabled | Create a DNS alias for the CDN. Requires `parent_zone_id` or `parent_zone_name` | bool | false |  
 wait_for_deployment | When set to 'true' the resource will wait for the distribution status to change from InProgress to Deployed | bool | false |  
 deployment_principal_arns | (Optional) Map of IAM Principal ARNs to lists of S3 path prefixes to grant `deployment_actions` permissions.
Resource list will include the bucket itself along with all the prefixes. Prefixes should not begin with '/'.
 | map(list(string)) | false |  
 cloudfront_origin_access_identity_iam_arn | Existing cloudfront origin access identity iam arn that is supplied in the s3 bucket policy | string | false |  
 cloudfront_access_log_bucket_name | When `cloudfront_access_log_create_bucket` is `false`, this is the name of the existing S3 Bucket where
Cloudfront Access Logs are to be delivered and is required. IGNORED when `cloudfront_access_log_create_bucket` is `true`.
 | string | false |  
 forward_query_string | Forward query strings to the origin that is associated with this cache behavior (incompatible with `cache_policy_id`) | bool | false |  
 response_headers_policy_id | The identifier for a response headers policy | string | false |  
 allow_ssl_requests_only | Set to `true` to require requests to use Secure Socket Layer (HTTPS/SSL). This will explicitly deny access to HTTP requests | bool | false |  
 cloudfront_access_log_include_cookies | Set true to include cookies in Cloudfront Access Logs | bool | false |  
 access_log_bucket_name | DEPRECATED. Use `s3_access_log_bucket_name` instead. | string | false |  
 deployment_actions | List of actions to permit `deployment_principal_arns` to perform on bucket and bucket prefixes (see `deployment_principal_arns`) | list(string) | false |  
 viewer_protocol_policy | Limit the protocol users can use to access content. One of `allow-all`, `https-only`, or `redirect-to-https` | string | false |  
 distribution_enabled | Set to `false` to create the distribution but still prevent CloudFront from serving requests. | bool | false |  
 log_standard_transition_days | Number of days after object creation to move Cloudfront Access Log objects to the infrequent access tier.
Only effective if `cloudfront_access_log_create_bucket` is `true`.
 | number | false |  
 cors_expose_headers | List of expose header in the response for S3 bucket | list(string) | false |  
 trusted_signers | The AWS accounts, if any, that you want to allow to create signed URLs for private content. 'self' is acceptable. | list(string) | false |  
 cloudfront_access_log_prefix | Prefix to use for Cloudfront Access Log object keys. Defaults to no prefix. | string | false |  
 lambda_function_association | A config block that triggers a lambda@edge function with specific actions | list(object({
    event_type   = string
    include_body = bool
    lambda_arn   = string
  })) | false |  
 custom_origins | A list of additional custom website [origins](https://www.terraform.io/docs/providers/aws/r/cloudfront_distribution.html#origin-arguments) for this distribution.
 | list(object({
    domain_name = string
    origin_id   = string
    origin_path = string
    custom_headers = list(object({
      name  = string
      value = string
    }))
    custom_origin_config = object({
      http_port                = number
      https_port               = number
      origin_protocol_policy   = string
      origin_ssl_protocols     = list(string)
      origin_keepalive_timeout = number
      origin_read_timeout      = number
    })
  })) | false |  
 cloudfront_access_logging_enabled | Set true to enable delivery of Cloudfront Access Logs to an S3 bucket | bool | false |  
 log_expiration_days | Number of days after object creation to expire Cloudfront Access Log objects.
Only effective if `cloudfront_access_log_create_bucket` is `true`.
 | number | false |  
 query_string_cache_keys | When `forward_query_string` is enabled, only the query string keys listed in this argument are cached (incompatible with `cache_policy_id`) | list(string) | false |  
 geo_restriction_locations | List of country codes for which  CloudFront either to distribute content (whitelist) or not distribute your content (blacklist) | list(string) | false |  
 s3_access_log_bucket_name | Name of the existing S3 bucket where S3 Access Logs will be delivered. Default is not to enable S3 Access Logging. | string | false |  
 acm_certificate_arn | Existing ACM Certificate ARN | string | false |  
 max_ttl | Maximum amount of time (in seconds) that an object is in a CloudFront cache | number | false |  
 routing_rules | A json array containing routing rules describing redirect behavior and when redirects are applied | string | false |  
 custom_origin_headers | A list of origin header parameters that will be sent to origin | list(object({ name = string, value = string })) | false |  
 realtime_log_config_arn | The ARN of the real-time log configuration that is attached to this cache behavior | string | false |  
 cors_allowed_headers | List of allowed headers for S3 bucket | list(string) | false |  
 error_document | An absolute path to the document to return in case of a 4XX error | string | false |  
 comment | Comment for the origin access identity | string | false |  
 log_glacier_transition_days | Number of days after object creation to move Cloudfront Access Log objects to the glacier tier.
Only effective if `cloudfront_access_log_create_bucket` is `true`.
 | number | false |  
 parent_zone_name | Name of the hosted zone to contain this record (or specify `parent_zone_id`). Requires `dns_alias_enabled` set to true | string | false |  
 s3_origins | A list of S3 [origins](https://www.terraform.io/docs/providers/aws/r/cloudfront_distribution.html#origin-arguments) (in addition to the one created by this module) for this distribution.
S3 buckets configured as websites are `custom_origins`, not `s3_origins`.
Specifying `s3_origin_config.origin_access_identity` as `null` or `""` will have it translated to the `origin_access_identity` used by the origin created by the module.
 | list(object({
    domain_name = string
    origin_id   = string
    origin_path = string
    s3_origin_config = object({
      origin_access_identity = string
    })
  })) | false |  
 versioning_enabled | When set to 'true' the s3 origin bucket will have versioning enabled | bool | false |  
 aliases | List of FQDN's - Used to set the Alternate Domain Names (CNAMEs) setting on Cloudfront | list(string) | false |  
 override_origin_bucket_policy | When using an existing origin bucket (through var.origin_bucket), setting this to 'false' will make it so the existing bucket policy will not be overriden | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
