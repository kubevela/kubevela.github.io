---
title:  AWS ROUTE53-CLUSTER-HOSTNAME
---

## Description

Terraform module to define a consistent AWS Route53 hostname

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 zone_id | Route53 DNS Zone ID | string | true |  
 records | DNS records to create | list(string) | true |  
 type | Type of DNS records to create | string | false |  
 ttl | The TTL of the record to add to the DNS zone to complete certificate validation | number | false |  
 dns_name | The name of the DNS record | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
