---
title:  AWS CLOUDFRONT
---

## 描述

Terraform module which creates CloudFront resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 aliases | Extra CNAMEs (alternate domain names), if any, for this distribution. | list(string) | false |  
 comment | Any comments you want to include about the distribution. | string | false |  
 create_distribution | Controls if CloudFront distribution should be created | bool | false |  
 create_monitoring_subscription | If enabled, the resource for monitoring subscription will created. | bool | false |  
 create_origin_access_identity | Controls if CloudFront origin access identity should be created | bool | false |  
 custom_error_response | One or more custom error response elements | any | false |  
 default_cache_behavior | The default cache behavior for this distribution | any | false |  
 default_root_object | The object that you want CloudFront to return (for example, index.html) when an end user requests the root URL. | string | false |  
 enabled | Whether the distribution is enabled to accept end user requests for content. | bool | false |  
 geo_restriction | The restriction configuration for this distribution (geo_restrictions) | any | false |  
 http_version | The maximum HTTP version to support on the distribution. Allowed values are http1.1 and http2. The default is http2. | string | false |  
 is_ipv6_enabled | Whether the IPv6 is enabled for the distribution. | bool | false |  
 logging_config | The logging configuration that controls how logs are written to your distribution (maximum one). | any | false |  
 ordered_cache_behavior | An ordered list of cache behaviors resource for this distribution. List from top to bottom in order of precedence. The topmost cache behavior will have precedence 0. | any | false |  
 origin | One or more origins for this distribution (multiples allowed). | any | false |  
 origin_access_identities | Map of CloudFront origin access identities (value as a comment) | map(string) | false |  
 origin_group | One or more origin_group for this distribution (multiples allowed). | any | false |  
 price_class | The price class for this distribution. One of PriceClass_All, PriceClass_200, PriceClass_100 | string | false |  
 realtime_metrics_subscription_status | A flag that indicates whether additional CloudWatch metrics are enabled for a given CloudFront distribution. Valid values are `Enabled` and `Disabled`. | string | false |  
 retain_on_delete | Disables the distribution instead of deleting it when destroying the resource through Terraform. If this is set, the distribution needs to be deleted manually afterwards. | bool | false |  
 tags | A map of tags to assign to the resource. | map(string) | false |  
 viewer_certificate | The SSL configuration for this distribution | any | false |  
 wait_for_deployment | If enabled, the resource will wait for the distribution status to change from InProgress to Deployed. Setting this tofalse will skip the process. | bool | false |  
 web_acl_id | If you're using AWS WAF to filter CloudFront requests, the Id of the AWS WAF web ACL that is associated with the distribution. The WAF Web ACL must exist in the WAF Global (CloudFront) region and the credentials configuring this argument must have waf:GetWebACL permissions assigned. If using WAFv2, provide the ARN of the web ACL. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
