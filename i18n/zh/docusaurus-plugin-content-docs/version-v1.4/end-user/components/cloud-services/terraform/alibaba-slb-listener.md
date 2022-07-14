---
title:  阿里云 SLB-LISTENER
---

## 描述

Quickly create slb listeners resources on AliCloud based on Terraform module

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 advanced_setting | The slb listener advanced settings to use on listeners. It's supports fields 'sticky_session', 'sticky_session_type', 'cookie', 'cookie_timeout', 'gzip', 'persistence_timeout', 'acl_status', 'acl_type', 'acl_id', 'idle_timeout' and 'request_timeout'. | map(string) | false |  
 cookie | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | string | false |  
 cookie_timeout | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | number | false |  
 create | Whether to create load balancer listeners. | bool | false |  
 enable_gzip | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | bool | false |  
 enable_health_check | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | bool | false |  
 enable_sticky_session | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | bool | false |  
 health_check | The slb listener health check settings to use on listeners. It's supports fields 'healthy_threshold','unhealthy_threshold','health_check_timeout', 'health_check', 'health_check_type', 'health_check_connect_port', 'health_check_domain', 'health_check_uri', 'health_check_http_code', 'health_check_method' and 'health_check_interval' | map(string) | false |  
 health_check_connect_port | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | string | false |  
 health_check_domain | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | string | false |  
 health_check_http_code | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | string | false |  
 health_check_interval | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'health_check' instead. | number | false |  
 health_check_timeout | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'health_check' instead. | number | false |  
 health_check_type | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | string | false |  
 health_check_uri | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | string | false |  
 healthy_threshold | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'health_check' instead. | number | false |  
 listeners | List of slb listeners. Each item can set all or part fields of alicloud_slb_listener resource. | list(map(string)) | false |  
 persistence_timeout | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | number | false |  
 profile | (Deprecated from version 1.3.0)The profile name as set in the shared credentials file. If not set, it will be sourced from the ALICLOUD_PROFILE environment variable. | string | false |  
 region | (Deprecated from version 1.3.0)The region used to launch this module resources. | string | false |  
 retrive_slb_id | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | bool | false |  
 retrive_slb_ip | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | bool | false |  
 retrive_slb_proto | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | bool | false |  
 shared_credentials_file | (Deprecated from version 1.3.0)This is the path to the shared credentials file. If this is not set and a profile is specified, $HOME/.aliyun/config.json will be used. | string | false |  
 skip_region_validation | (Deprecated from version 1.3.0)Skip static validation of region ID. Used by users of alternative AlibabaCloud-like APIs or users w/ access to regions that are not public (yet). | bool | false |  
 slb | The load balancer ID used to add one or more listeners. | string | false |  
 ssl_certificates | SLB Server certificate settings to use on listeners. It's supports fields 'tls_cipher_policy', 'server_certificate_id' and 'enable_http2' | map(string) | false |  
 sticky_session_type | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'advance_setting' instead. | string | false |  
 unhealthy_threshold | (Deprecated) It has been deprecated from 1.2.0, use 'listeners' and 'health_check' instead. | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 x_forwarded_for | Additional HTTP Header field 'X-Forwarded-For' to use on listeners. It's supports fields 'retrive_slb_ip', 'retrive_slb_id' and 'retrive_slb_proto' | map(bool) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
