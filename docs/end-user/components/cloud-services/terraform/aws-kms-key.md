---
title:  AWS KMS-KEY
---

## Description

Terraform module to provision a KMS key with alias

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 alias | The display name of the alias. The name must start with the word `alias` followed by a forward slash. If not specified, the alias name will be auto-generated. | string | false |  
 policy | A valid KMS policy JSON document. Note that if the policy document is not specific enough (but still valid), Terraform may view the policy as constantly changing in a terraform plan. In this case, please make sure you use the verbose/specific version of the policy. | string | false |  
 key_usage | Specifies the intended use of the key. Valid values: `ENCRYPT_DECRYPT` or `SIGN_VERIFY`. | string | false |  
 customer_master_key_spec | Specifies whether the key contains a symmetric key or an asymmetric key pair and the encryption algorithms or signing algorithms that the key supports. Valid values: `SYMMETRIC_DEFAULT`, `RSA_2048`, `RSA_3072`, `RSA_4096`, `ECC_NIST_P256`, `ECC_NIST_P384`, `ECC_NIST_P521`, or `ECC_SECG_P256K1`. | string | false |  
 multi_region | Indicates whether the KMS key is a multi-Region (true) or regional (false) key. | bool | false |  
 deletion_window_in_days | Duration in days after which the key is deleted after destruction of the resource | number | false |  
 enable_key_rotation | Specifies whether key rotation is enabled | bool | false |  
 description | The description of the key as viewed in AWS console | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
