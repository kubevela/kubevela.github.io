---
title:  Alibaba Cloud RAM
---

## Description

Create RAM User instances on AliCloud based on Terraform module.

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 admin_name_regex | A regex string to filter resulting policies by name. | string | false |  
 create_ram_access_key | Whether to create ram access key. | bool | false |  
 create_ram_user_login_profile | Whether to create ram user login profile. | bool | false |  
 create_user | Whether to create ram user. | bool | false |  
 force_destroy | When destroying this user, destroy even if it has non-Terraform-managed ram access keys, login profile or MFA devices. Without force_destroy a user with non-Terraform-managed access keys and login profile will fail to be destroyed. | bool | false |  
 is_admin | Whether to grant admin permission. | bool | false |  
 is_reader | Whether to grant reader permission. | bool | false |  
 name | Desired name for the ram user. If not set, a default name with prefix `ram-user-` will be returned. | string | false |  
 password | Login password of the user. | string | false |  
 policy_type | Type of the RAM policy. It must be Custom or System. | string | false |  
 reader_name_regex | A regex string to filter resulting policies by name. | string | false |  
 region | (Deprecated from version 1.3.0)The region used to launch this module resources. | string | false |  
 secret_file | A file used to store access key and secret key of ther user. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to. | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |  
