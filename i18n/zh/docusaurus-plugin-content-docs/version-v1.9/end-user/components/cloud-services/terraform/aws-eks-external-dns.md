---
title:  AWS EKS-EXTERNAL-DNS
---

## 描述

AWS Eks-External-Dns

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 argo_application_enabled | If set to true, the module will be deployed as ArgoCD application, otherwise it will be deployed as a Helm release | bool | false |  
 argo_application_use_helm | If set to true, the ArgoCD Application manifest will be deployed using Kubernetes provider as a Helm release. Otherwise it'll be deployed as a Kubernetes manifest. See Readme for more info | bool | false |  
 argo_application_values | Value overrides to use when deploying argo application object with helm |  | false |  
 argo_destionation_server | Destination server for ArgoCD Application | string | false |  
 argo_info | ArgoCD info manifest parameter |  | false |  
 argo_namespace | Namespace to deploy ArgoCD application CRD to | string | false |  
 argo_project | ArgoCD Application project | string | false |  
 argo_sync_policy | ArgoCD syncPolicy manifest parameter |  | false |  
 cluster_identity_oidc_issuer | The OIDC Identity issuer for the cluster | string | true |  
 cluster_identity_oidc_issuer_arn | The OIDC Identity issuer ARN for the cluster that can be used to associate IAM roles with a service account | string | true |  
 enabled | Variable indicating whether deployment is enabled | bool | false |  
 helm_chart_name | Helm chart name to be installed | string | false |  
 helm_chart_version | Version of the Helm chart | string | false |  
 helm_create_namespace | Whether to create k8s namespace with name defined by `k8s_namespace` | bool | false |  
 helm_release_name | Helm release name | string | false |  
 helm_repo_url | Helm repository | string | false |  
 k8s_assume_role_arn | Assume role arn. Assume role must be enabled. |  | false |  
 k8s_assume_role_enabled | Whether IRSA is allowed to assume role defined by k8s_assume_role_arn. Useful for hosted zones in another AWS account. | bool | false |  
 k8s_irsa_additional_policies | Map of the additional policies to be attached to default role. Where key is arbiraty id and value is policy arn. | map(string) | false |  
 k8s_irsa_policy_enabled | Whether to create opinionated policy to allow operations on specified zones in `policy_allowed_zone_ids`. | bool | false |  
 k8s_irsa_role_create | Whether to create IRSA role and annotate service account | bool | false |  
 k8s_irsa_role_name_prefix | The IRSA role name prefix for prometheus | string | false |  
 k8s_namespace | The K8s namespace in which the external-dns will be installed | string | false |  
 k8s_rbac_create | Whether to create and use RBAC resources | bool | false |  
 k8s_service_account_create | Whether to create Service Account | bool | false |  
 k8s_service_account_name | The k8s external-dns service account name |  | false |  
 policy_allowed_zone_ids | List of the Route53 zone ids for service account IAM role access | list(string) | false |  
 settings | Additional settings which will be passed to the Helm chart values, see https://hub.helm.sh/charts/bitnami/external-dns | map(any) | false |  
 tags | AWS resources tags | map(string) | false |  
 values | Additional yaml encoded values which will be passed to the Helm chart, see https://hub.helm.sh/charts/bitnami/external-dns | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
