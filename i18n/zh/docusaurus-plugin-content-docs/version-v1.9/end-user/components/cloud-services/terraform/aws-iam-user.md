---
title:  AWS IAM-USER
---

## 描述

Terraform module which creates IAM resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_iam_access_key | Whether to create IAM access key | bool | false |  
 create_iam_user_login_profile | Whether to create IAM user login profile | bool | false |  
 create_user | Whether to create the IAM user | bool | false |  
 force_destroy | When destroying this user, destroy even if it has non-Terraform-managed IAM access keys, login profile or MFA devices. Without force_destroy a user with non-Terraform-managed access keys and login profile will fail to be destroyed. | bool | false |  
 name | Desired name for the IAM user | string | true |  
 password_length | The length of the generated password | number | false |  
 password_reset_required | Whether the user should be forced to reset the generated password on first login. | bool | false |  
 path | Desired path for the IAM user | string | false |  
 permissions_boundary | The ARN of the policy that is used to set the permissions boundary for the user. | string | false |  
 pgp_key | Either a base-64 encoded PGP public key, or a keybase username in the form `keybase:username`. Used to encrypt password and access key. | string | false |  
 ssh_key_encoding | Specifies the public key encoding format to use in the response. To retrieve the public key in ssh-rsa format, use SSH. To retrieve the public key in PEM format, use PEM | string | false |  
 ssh_public_key | The SSH public key. The public key must be encoded in ssh-rsa format or PEM format | string | false |  
 tags | A map of tags to add to all resources. | map(string) | false |  
 upload_iam_user_ssh_key | Whether to upload a public ssh key to the IAM user | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
