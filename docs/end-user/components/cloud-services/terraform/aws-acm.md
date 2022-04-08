---
title:  AWS ACM
---

## Description

Terraform module which creates and validates ACM certificate

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 certificate_transparency_logging_preference | Specifies whether certificate details should be added to a certificate transparency log | bool | false |  
 create_certificate | Whether to create ACM certificate | bool | false |  
 create_route53_records | When validation is set to DNS, define whether to create the DNS records internally via Route53 or externally using any DNS provider | bool | false |  
 dns_ttl | The TTL of DNS recursive resolvers to cache information about this record. | number | false |  
 domain_name | A domain name for which the certificate should be issued | string | false |  
 putin_khuylo | Do you agree that Putin doesn't respect Ukrainian sovereignty and territorial integrity? More info: https://en.wikipedia.org/wiki/Putin_khuylo! | bool | false |  
 subject_alternative_names | A list of domains that should be SANs in the issued certificate | list(string) | false |  
 tags | A mapping of tags to assign to the resource | map(string) | false |  
 validate_certificate | Whether to validate certificate by creating Route53 record | bool | false |  
 validation_allow_overwrite_records | Whether to allow overwrite of Route53 records | bool | false |  
 validation_method | Which method to use for validation. DNS or EMAIL are valid, NONE can be used for certificates that were imported into ACM and then into Terraform. | string | false |  
 validation_record_fqdns | When validation is set to DNS and the DNS validation records are set externally, provide the fqdns for the validation | list(string) | false |  
 wait_for_validation | Whether to wait for the validation to complete | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_id | The ID of the hosted zone to contain this record. Required when validating via Route53 | string | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
