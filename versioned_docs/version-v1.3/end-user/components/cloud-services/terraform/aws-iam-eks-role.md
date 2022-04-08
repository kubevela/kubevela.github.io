---
title:  AWS IAM-EKS-ROLE
---

## Description

Terraform module which creates IAM resources on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cluster_service_accounts | EKS cluster and k8s ServiceAccount pairs. Each EKS cluster can have multiple k8s ServiceAccount. See README for details | map(list(string)) | false |  
 create_role | Whether to create a role | bool | false |  
 force_detach_policies | Whether policies should be detached from this role when destroying | bool | false |  
 max_session_duration | Maximum CLI/API session duration in seconds between 3600 and 43200 | number | false |  
 provider_url_sa_pairs | OIDC provider URL and k8s ServiceAccount pairs. If the assume role policy requires a mix of EKS clusters and other OIDC providers then this can be used | map(list(string)) | false |  
 role_description | IAM Role description | string | false |  
 role_name | Name of IAM role | string | false |  
 role_name_prefix | IAM role name prefix | string | false |  
 role_path | Path of IAM role | string | false |  
 role_permissions_boundary_arn | Permissions boundary ARN to use for IAM role | string | false |  
 role_policy_arns | ARNs of any policies to attach to the IAM role | list(string) | false |  
 tags | A map of tags to add the the IAM role | map(any) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
