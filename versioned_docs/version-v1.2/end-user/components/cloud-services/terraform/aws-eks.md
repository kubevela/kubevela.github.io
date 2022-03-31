---
title:  AWS EKS
---

## Description

Terraform module to create an Elastic Kubernetes (EKS) cluster and associated worker instances on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_node_security_group | Determines whether to create a security group for the node groups or use the existing `node_security_group_id` | bool | false |  
 iam_role_description | Description of the role | string | false |  
 iam_role_tags | A map of additional tags to add to the IAM role created | map(string) | false |  
 fargate_profiles | Map of Fargate Profile definitions to create | any | false |  
 cluster_endpoint_private_access | Indicates whether or not the Amazon EKS private API server endpoint is enabled | bool | false |  
 cluster_endpoint_public_access | Indicates whether or not the Amazon EKS public API server endpoint is enabled | bool | false |  
 cloudwatch_log_group_kms_key_id | If a KMS Key ARN is set, this key will be used to encrypt the corresponding log group. Please be sure that the KMS Key has an appropriate key policy (https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/encrypt-log-data-kms.html) | string | false |  
 create_iam_role | Determines whether a an IAM role is created or to use an existing IAM role | bool | false |  
 cluster_additional_security_group_ids | List of additional, externally created security group IDs to attach to the cluster control plane | list(string) | false |  
 node_security_group_tags | A map of additional tags to add to the node security group created | map(string) | false |  
 eks_managed_node_groups | Map of EKS managed node group definitions to create | any | false |  
 cluster_encryption_config | Configuration block with encryption configuration for the cluster | list(object({\n    provider_key_arn = string\n    resources        = list(string)\n  })) | false |  
 vpc_id | ID of the VPC where the cluster and its nodes will be provisioned | string | false |  
 cluster_encryption_policy_tags | A map of additional tags to add to the cluster encryption policy created | map(string) | false |  
 cluster_identity_providers | Map of cluster identity provider configurations to enable for the cluster. Note - this is different/separate from IRSA | any | false |  
 tags | A map of tags to add to all resources | map(string) | false |  
 cluster_security_group_additional_rules | List of additional security group rules to add to the cluster security group created. Set `source_node_security_group = true` inside rules to set the `node_security_group` as source | any | false |  
 create_cni_ipv6_iam_policy | Determines whether to create an [`AmazonEKS_CNI_IPv6_Policy`](https://docs.aws.amazon.com/eks/latest/userguide/cni-iam-role.html#cni-iam-role-create-ipv6-policy) | bool | false |  
 fargate_profile_defaults | Map of Fargate Profile default configurations | any | false |  
 cluster_encryption_policy_path | Cluster encryption policy path | string | false |  
 self_managed_node_group_defaults | Map of self-managed node group default configurations | any | false |  
 cluster_security_group_use_name_prefix | Determines whether cluster security group name (`cluster_security_group_name`) is used as a prefix | string | false |  
 node_security_group_description | Description of the node security group created | string | false |  
 openid_connect_audiences | List of OpenID Connect audience client IDs to add to the IRSA provider | list(string) | false |  
 iam_role_permissions_boundary | ARN of the policy that is used to set the permissions boundary for the IAM role | string | false |  
 cluster_enabled_log_types | A list of the desired control plane logs to enable. For more information, see Amazon EKS Control Plane Logging documentation (https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html) | list(string) | false |  
 subnet_ids | A list of subnet IDs where the EKS cluster (ENIs) will be provisioned along with the nodes/node groups. Node groups can be deployed within a different set of subnet IDs from within the node group configuration | list(string) | false |  
 cluster_endpoint_public_access_cidrs | List of CIDR blocks which can access the Amazon EKS public API server endpoint | list(string) | false |  
 create_cloudwatch_log_group | Determines whether a log group is created by this module for the cluster logs. If not, AWS will automatically create one if logging is enabled | bool | false |  
 iam_role_arn | Existing IAM role ARN for the cluster. Required if `create_iam_role` is set to `false` | string | false |  
 cluster_encryption_policy_name | Name to use on cluster encryption policy created | string | false |  
 create | Controls if EKS resources should be created (affects nearly all resources) | bool | false |  
 cluster_timeouts | Create, update, and delete timeout configurations for the cluster | map(string) | false |  
 node_security_group_additional_rules | List of additional security group rules to add to the node security group created. Set `source_cluster_security_group = true` inside rules to set the `cluster_security_group` as source | any | false |  
 custom_oidc_thumbprints | Additional list of server certificate thumbprints for the OpenID Connect (OIDC) identity provider's server certificate(s) | list(string) | false |  
 cluster_name | Name of the EKS cluster | string | false |  
 cloudwatch_log_group_retention_in_days | Number of days to retain log events. Default retention - 90 days | number | false |  
 node_security_group_use_name_prefix | Determines whether node security group name (`node_security_group_name`) is used as a prefix | string | false |  
 eks_managed_node_group_defaults | Map of EKS managed node group default configurations | any | false |  
 cluster_iam_role_dns_suffix | Base DNS domain name for the current partition (e.g., amazonaws.com in AWS Commercial, amazonaws.com.cn in AWS China) | string | false |  
 self_managed_node_groups | Map of self-managed node group definitions to create | any | false |  
 putin_khuylo | Do you agree that Putin doesn't respect Ukrainian sovereignty and territorial integrity? More info: https://en.wikipedia.org/wiki/Putin_khuylo! | bool | false |  
 cluster_ip_family | The IP family used to assign Kubernetes pod and service addresses. Valid values are `ipv4` (default) and `ipv6`. You can only specify an IP family when you create a cluster, changing this value will force a new cluster to be created | string | false |  
 cluster_tags | A map of additional tags to add to the cluster | map(string) | false |  
 cluster_security_group_id | Existing security group ID to be attached to the cluster. Required if `create_cluster_security_group` = `false` | string | false |  
 iam_role_additional_policies | Additional policies to be added to the IAM role | list(string) | false |  
 cluster_security_group_tags | A map of additional tags to add to the cluster security group created | map(string) | false |  
 cluster_version | Kubernetes `<major>.<minor>` version to use for the EKS cluster (i.e.: `1.21`) | string | false |  
 cluster_addons | Map of cluster addon configurations to enable for the cluster. Addon name can be the map keys or set with `name` | any | false |  
 attach_cluster_encryption_policy | Indicates whether or not to attach an additional policy for the cluster IAM role to utilize the encryption key provided | bool | false |  
 node_security_group_id | ID of an existing security group to attach to the node groups created | string | false |  
 iam_role_path | Cluster IAM role path | string | false |  
 cluster_encryption_policy_use_name_prefix | Determines whether cluster encryption policy name (`cluster_encryption_policy_name`) is used as a prefix | string | false |  
 iam_role_name | Name to use on IAM role created | string | false |  
 cluster_encryption_policy_description | Description of the cluster encryption policy created | string | false |  
 prefix_separator | The separator to use between the prefix and the generated timestamp for resource names | string | false |  
 create_cluster_security_group | Determines if a security group is created for the cluster or use the existing `cluster_security_group_id` | bool | false |  
 cluster_security_group_description | Description of the cluster security group created | string | false |  
 iam_role_use_name_prefix | Determines whether the IAM role name (`iam_role_name`) is used as a prefix | string | false |  
 cluster_service_ipv4_cidr | The CIDR block to assign Kubernetes service IP addresses from. If you don't specify a block, Kubernetes assigns addresses from either the 10.100.0.0/16 or 172.20.0.0/16 CIDR blocks | string | false |  
 cluster_security_group_name | Name to use on cluster security group created | string | false |  
 node_security_group_name | Name to use on node security group created | string | false |  
 enable_irsa | Determines whether to create an OpenID Connect Provider for EKS to enable IRSA | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
