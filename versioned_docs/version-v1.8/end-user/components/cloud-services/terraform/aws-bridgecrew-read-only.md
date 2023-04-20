---
title:  AWS BRIDGECREW-READ-ONLY
---

## Description

Bridgecrew READ ONLY integration module

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 account_alias | The alias of the account the CF is deployed in. This will be prepended to all the resources in the stack. Default is {org_name}-bc | string | false |  
 api_token | This is your Bridgecrew platform Api token Set as and Environment variable TF_VAR_api_token | string | true |  
 aws_profile | The profile that was used to deploy this module. If the default profile / default credentials are used, seet this value to null. | string | true |  
 bridgecrew_account_id | The Bridgecrew AWS account ID from which scans will originate. This value should not typically be modified, but is provided here to support testing and troubleshooting, if needed. | string | false |  
 common_tags | Implements the common tags scheme | map(any) | false |  
 org_name | The name of the company the integration is for. Must be alphanumeric. | string | true |  
 role_name | The name for the Bridgecrew read-only IAM role. | string | false |  
 topic_name | The name of the SNS topic for Bridgecrew to receive notifications. This value should not typically be modified, but is provided here to support testing and troubleshooting, if needed. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
