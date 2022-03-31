---
title:  AWS IAM-USER
---

## Description

Terraform module which creates IAM resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 upload_iam_user_ssh_key | Whether to upload a public ssh key to the IAM user | bool | false |  
 password_length | The length of the generated password | number | false |  
 name | Desired name for the IAM user | string | true |  
 path | Desired path for the IAM user | string | false |  
 create_iam_user_login_profile | Whether to create IAM user login profile | bool | false |  
 tags | A map of tags to add to all resources. | map(string) | false |  
 force_destroy | When destroying this user, destroy even if it has non-Terraform-managed IAM access keys, login profile or MFA devices. Without force_destroy a user with non-Terraform-managed access keys and login profile will fail to be destroyed. | bool | false |  
 pgp_key | Either a base-64 encoded PGP public key, or a keybase username in the form `keybase:username`. Used to encrypt password and access key. `pgp_key` is required when `create_iam_user_login_profile` is set to `true` | string | false |  
 password_reset_required | Whether the user should be forced to reset the generated password on first login. | bool | false |  
 ssh_key_encoding | Specifies the public key encoding format to use in the response. To retrieve the public key in ssh-rsa format, use SSH. To retrieve the public key in PEM format, use PEM | string | false |  
 ssh_public_key | The SSH public key. The public key must be encoded in ssh-rsa format or PEM format | string | false |  
 permissions_boundary | The ARN of the policy that is used to set the permissions boundary for the user. | string | false |  
 create_user | Whether to create the IAM user | bool | false |  
 create_iam_access_key | Whether to create IAM access key | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
