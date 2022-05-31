---
title:  阿里云 DNS
---

## 描述

Terraform configuration for Alibaba Cloud DNS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 add_records | Whether to add records to dns. Default to true. | bool | false |  
 create | Whether to create a domain. Default to true. | bool | false |  
 create_group | Whether to create a DNS group. Default to false. | bool | false |  
 domain_name | The name of domain. | string | false |  
 existing_domain_name | The name of an existing domain. If set, 'create' will be ignored. | string | false |  
 existing_group_name | Id of the group in which the domain will add. If not supplied, then use default group. | string | false |  
 group_name | DNS domain's parrent group name, If not set, a default name with prefix 'terraform-dns-group-' will be returned. | string | false |  
 profile | (Deprecated from version 1.5.0) The profile name as set in the shared credentials file. If not set, it will be sourced from the ALICLOUD_PROFILE environment variable. | string | false |  
 record_list | (Deprecated) It has been deprecated from 1.3.0, and use 'records' instead. | list(object({\n    name        = string\n    host_record = string\n    type        = string\n    ttl         = number\n    value       = string\n    priority    = number\n  })) | false |  
 records | DNS record list.Each item can contains keys: 'rr'(The host record of the domain record. 'name' has been deprecated from 1.3.0, and use 'rr' instead.),'type'(The type of the domain. Valid values: A, NS, MX, TXT, CNAME, SRV, AAAA, CAA, REDIRECT_URL, FORWORD_URL. Default to A.),'value'(The value of domain record),'priority'(The priority of domain record. Valid values are `[1-10]`. When the `type` is `MX`, this parameter is required.),'ttl'(The ttl of the domain record. Default to 600.),'line'(The resolution line of domain record. Default value is default.). | list(map(string)) | false |  
 region | (Deprecated from version 1.5.0) The region used to launch this module resources. | string | false |  
 resource_group_id | The Id of resource group which the DNS belongs. | string | false |  
 shared_credentials_file | (Deprecated from version 1.5.0) This is the path to the shared credentials file. If this is not set and a profile is specified, $HOME/.aliyun/config.json will be used. | string | false |  
 skip_region_validation | (Deprecated from version 1.5.0) Skip static validation of region ID. Used by users of alternative AlibabaCloud-like APIs or users w/ access to regions that are not public (yet). | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
