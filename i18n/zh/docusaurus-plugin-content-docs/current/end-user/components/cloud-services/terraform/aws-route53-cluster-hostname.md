---
title:  AWS ROUTE53-CLUSTER-HOSTNAME
---

## 描述

Terraform module to define a consistent AWS Route53 hostname

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 records | DNS records to create | list(string) | true |  
 type | Type of DNS records to create | string | false |  
 ttl | The TTL of the record to add to the DNS zone to complete certificate validation | number | false |  
 dns_name | The name of the DNS record | string | false |  
 zone_id | Route53 DNS Zone ID | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
