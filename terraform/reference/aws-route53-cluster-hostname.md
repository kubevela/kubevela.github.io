---
title:  AWS ROUTE53-CLUSTER-HOSTNAME
---

## Description

Terraform module to define a consistent AWS Route53 hostname

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 dns_name | The name of the DNS record | string | false |  
 records | DNS records to create | list(string) | true |  
 ttl | The TTL of the record to add to the DNS zone to complete certificate validation | number | false |  
 type | Type of DNS records to create | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_id | Route53 DNS Zone ID | string | true |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
