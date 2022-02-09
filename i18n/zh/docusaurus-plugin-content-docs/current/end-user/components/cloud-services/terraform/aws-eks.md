---
title:  AWS EKS
---

## 描述

Terraform module to create an Elastic Kubernetes (EKS) cluster and associated worker instances on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cluster_name | Name of the EKS cluster | string | false |  
 cluster_security_group_tags | A map of additional tags to add to the cluster security group created | map(string) | false |  
 create_node_security_group | Determines whether to create a security group for the node groups or use the existing `node_security_group_id` | bool | false |  
 node_security_group_name | Name to use on node security group created | string | false |  
 fargate_profile_defaults | Map of Fargate Profile default configurations | any | false |  
 cluster_additional_security_group_ids | List of additional, externally created security group IDs to attach to the cluster control plane | list(string) | false |  
 cloudwatch_log_group_retention_in_days | Number of days to retain log events. Default retention - 90 days | number | false |  
 cluster_security_group_id | Existing security group ID to be attached to the cluster. Required if `create_cluster_security_group` = `false` | string | false |  
 enable_irsa | Determines whether to create an OpenID Connect Provider for EKS to enable IRSA | bool | false |  
 cluster_endpoint_public_access_cidrs | List of CIDR blocks which can access the Amazon EKS public API server endpoint | list(string) | false |  
 cluster_security_group_name | Name to use on cluster security group created | string | false |  
 node_security_group_tags | A map of additional tags to add to the node security group created | map(string) | false |  
 iam_role_additional_policies | Additional policies to be added to the IAM role | list(string) | false |  
 cluster_service_ipv4_cidr | The CIDR block to assign Kubernetes service IP addresses from. If you don't specify a block, Kubernetes assigns addresses from either the 10.100.0.0/16 or 172.20.0.0/16 CIDR blocks | string | false |  
 tags | A map of tags to add to all resources | map(string) | false |  
 cluster_tags | A map of additional tags to add to the cluster | map(string) | false |  
 node_security_group_description | Description of the node security group created | string | false |  
 cluster_security_group_use_name_prefix | Determines whether cluster security group name (`cluster_security_group_name`) is used as a prefix | string | false |  
 iam_role_tags | A map of additional tags to add to the IAM role created | map(string) | false |  
 cluster_addons | Map of cluster addon configurations to enable for the cluster. Addon name can be the map keys or set with `name` | any | false |  
 create_cloudwatch_log_group | Determines whether a log group is created by this module for the cluster logs. If not, AWS will automatically create one if logging is enabled | bool | false |  
 create_cluster_security_group | Determines if a security group is created for the cluster or use the existing `cluster_security_group_id` | bool | false |  
 iam_role_permissions_boundary | ARN of the policy that is used to set the permissions boundary for the IAM role | string | false |  
 create | Controls if EKS resources should be created (affects nearly all resources) | bool | false |  
 prefix_separator | The separator to use between the prefix and the generated timestamp for resource names | string | false |  
 cluster_version | Kubernetes `<major>.<minor>` version to use for the EKS cluster (i.e.: `1.21`) | string | false |  
 iam_role_arn | Existing IAM role ARN for the cluster. Required if `create_iam_role` is set to `false` | string | false |  
 iam_role_path | Cluster IAM role path | string | false |  
 eks_managed_node_group_defaults | Map of EKS managed node group default configurations | any | false |  
 cluster_timeouts | Create, update, and delete timeout configurations for the cluster | map(string) | false |  
 cloudwatch_log_group_kms_key_id | If a KMS Key ARN is set, this key will be used to encrypt the corresponding log group. Please be sure that the KMS Key has an appropriate key policy (https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/encrypt-log-data-kms.html) | string | false |  
 cluster_security_group_additional_rules | List of additional security group rules to add to the cluster security group created | any | false |  
 node_security_group_additional_rules | List of additional security group rules to add to the node security group created | any | false |  
 eks_managed_node_groups | Map of EKS managed node group definitions to create | any | false |  
 cluster_endpoint_private_access | Indicates whether or not the Amazon EKS private API server endpoint is enabled | bool | false |  
 cluster_endpoint_public_access | Indicates whether or not the Amazon EKS public API server endpoint is enabled | bool | false |  
 cluster_encryption_config | Configuration block with encryption configuration for the cluster | list(object({
    provider_key_arn = string
    resources        = list(string)
  })) | false |  
 create_iam_role | Determines whether a an IAM role is created or to use an existing IAM role | bool | false |  
 iam_role_description | Description of the role | string | false |  
 self_managed_node_groups | Map of self-managed node group definitions to create | any | false |  
 openid_connect_audiences | List of OpenID Connect audience client IDs to add to the IRSA provider | list(string) | false |  
 iam_role_use_name_prefix | Determines whether the IAM role name (`iam_role_name`) is used as a prefix | string | false |  
 cluster_enabled_log_types | A list of the desired control plane logs to enable. For more information, see Amazon EKS Control Plane Logging documentation (https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html) | list(string) | false |  
 vpc_id | ID of the VPC where the cluster and its nodes will be provisioned | string | false |  
 node_security_group_id | ID of an existing security group to attach to the node groups created | string | false |  
 cluster_ip_family | The IP family used to assign Kubernetes pod and service addresses. Valid values are `ipv4` (default) and `ipv6`. You can only specify an IP family when you create a cluster, changing this value will force a new cluster to be created | string | false |  
 node_security_group_use_name_prefix | Determines whether node security group name (`node_security_group_name`) is used as a prefix | string | false |  
 iam_role_name | Name to use on IAM role created | string | false |  
 self_managed_node_group_defaults | Map of self-managed node group default configurations | any | false |  
 cluster_identity_providers | Map of cluster identity provider configurations to enable for the cluster. Note - this is different/separate from IRSA | any | false |  
 fargate_profiles | Map of Fargate Profile definitions to create | any | false |  
 cluster_security_group_description | Description of the cluster security group created | string | false |  
 create_cni_ipv6_iam_policy | Determines whether to create an [`AmazonEKS_CNI_IPv6_Policy`](https://docs.aws.amazon.com/eks/latest/userguide/cni-iam-role.html#cni-iam-role-create-ipv6-policy) | bool | false |  
 subnet_ids | A list of subnet IDs where the EKS cluster (ENIs) will be provisioned along with the nodes/node groups. Node groups can be deployed within a different set of subnet IDs from within the node group configuration | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
