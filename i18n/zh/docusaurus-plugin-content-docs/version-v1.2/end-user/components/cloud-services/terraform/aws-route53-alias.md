---
title:  AWS ROUTE53-ALIAS
---

## 描述

Terraform Module to Define Vanity Host/Domain (e.g. ) as an ALIAS record

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 target_dns_name | DNS name of target resource (e.g. ALB, ELB) | string | true |  
 ipv6_enabled | Set to true to enable an AAAA DNS record to be set as well as the A record | bool | false |  
 allow_overwrite | Allow creation of this record in Terraform to overwrite an existing record, if any. This does not affect the ability to update the record in Terraform and does not prevent other resources within Terraform or manual Route 53 changes outside Terraform from overwriting this record. false by default. This configuration is not recommended for most environments | bool | false |  
 private_zone | Is this a private hosted zone? | bool | false |  
 parent_zone_id | ID of the hosted zone to contain this record  (or specify `parent_zone_name`) | string | false |  
 parent_zone_name | Name of the hosted zone to contain this record (or specify `parent_zone_id`) | string | false |  
 target_zone_id | ID of target resource (e.g. ALB, ELB) | string | true |  
 evaluate_target_health | Set to true if you want Route 53 to determine whether to respond to DNS queries | bool | false |  
 aliases | List of aliases | list(string) | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
