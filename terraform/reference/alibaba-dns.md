---
title:  Alibaba Cloud DNS
---

## Description

Terraform configuration for Alibaba Cloud DNS.

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 add_records | Whether to add records to dns. Default to true. | bool | false |  
 create | Whether to create a domain. Default to true. | bool | false |  
 create_group | Whether to create a DNS group. Default to false. | bool | false |  
 domain_name | The name of domain. | string | false |  
 existing_domain_name | The name of an existing domain. If set, 'create' will be ignored. | string | false |  
 existing_group_name | Id of the group in which the domain will add. If not supplied, then use default group. | string | false |  
 group_name | DNS domain's parrent group name, If not set, a default name with prefix 'terraform-dns-group-' will be returned. | string | false |  
 profile | (Deprecated from version 1.5.0) The profile name as set in the shared credentials file. If not set, it will be sourced from the ALICLOUD_PROFILE environment variable. | string | false |  
 record_list | (Deprecated) Use 'records' instead. See Record Schema section below for structure. | `list(object({ name = string, host_record = string, type = string, ttl = number, value = string, priority = number }))` | false |
 records | List of DNS records. See Record Fields section below for details. | `list(map(string))` | false |
 region | (Deprecated from version 1.5.0) The region used to launch this module resources. | string | false |  
 resource_group_id | The Id of resource group which the DNS belongs. | string | false |  
 shared_credentials_file | (Deprecated from version 1.5.0) This is the path to the shared credentials file. If this is not set and a profile is specified, $HOME/.aliyun/config.json will be used. | string | false |  
 skip_region_validation | (Deprecated from version 1.5.0) Skip static validation of region ID. Used by users of alternative AlibabaCloud-like APIs or users w/ access to regions that are not public (yet). | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  

### Record Schema

#### Records Field
Each record in the `records` list can contain the following fields:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| rr | string | Yes | - | Host record |
| type | string | Yes | - | Record type (A, NS, MX, TXT, CNAME, SRV, AAAA, CAA, REDIRECT_URL, FORWORD_URL) |
| value | string | Yes | - | Record value |
| priority | number | Only for MX | - | Priority (1-10) |
| ttl | number | No | 600 | TTL in seconds |
| line | string | No | 'default' | Resolution line |

#### Record List Field (Deprecated)
The deprecated `record_list` field uses this structure:

```hcl
list(object({
  name        = string
  host_record = string
  type        = string
  ttl         = number
  value       = string
  priority    = number
}))
```

#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to. | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |  
