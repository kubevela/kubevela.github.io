---
title:  AWS EKS-CLUSTER-AUTOSCALER
---

## Description

AWS Eks-Cluster-Autoscaler

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 argo_sync_policy | ArgoCD syncPolicy manifest parameter |  | false |  
 enabled | Variable indicating whether deployment is enabled | bool | false |  
 cluster_identity_oidc_issuer | The OIDC Identity issuer for the cluster | string | true |  
 helm_chart_name | Helm chart name to be installed | string | false |  
 helm_chart_version | Version of the Helm chart | string | false |  
 k8s_rbac_create | Whether to create and use RBAC resources | bool | false |  
 k8s_service_account_create | Whether to create Service Account | bool | false |  
 argo_project | ArgoCD Application project | string | false |  
 helm_release_name | Helm release name | string | false |  
 helm_repo_url | Helm repository | string | false |  
 argo_application_use_helm | If set to true, the ArgoCD Application manifest will be deployed using Kubernetes provider as a Helm release. Otherwise it'll be deployed as a Kubernetes manifest. See Readme for more info | bool | false |  
 argo_info | ArgoCD info manifest parameter |  | false |  
 cluster_identity_oidc_issuer_arn | The OIDC Identity issuer ARN for the cluster that can be used to associate IAM roles with a service account | string | true |  
 helm_create_namespace | Create the namespace if it does not yet exist | bool | false |  
 k8s_namespace | The K8s namespace in which the node-problem-detector service account has been created | string | false |  
 k8s_irsa_role_create | Whether to create IRSA role and annotate service account | bool | false |  
 argo_destionation_server | Destination server for ArgoCD Application | string | false |  
 cluster_name | The name of the cluster | string | true |  
 k8s_service_account_name | The k8s cluster-autoscaler service account name |  | false |  
 settings | Additional settings which will be passed to the Helm chart values, see https://hub.helm.sh/charts/stable/cluster-autoscaler | map(any) | false |  
 values | Additional yaml encoded values which will be passed to the Helm chart, see https://hub.helm.sh/charts/stable/cluster-autoscaler | string | false |  
 argo_namespace | Namespace to deploy ArgoCD application CRD to | string | false |  
 argo_application_enabled | If set to true, the module will be deployed as ArgoCD application, otherwise it will be deployed as a Helm release | bool | false |  
 argo_application_values | Value overrides to use when deploying argo application object with helm |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
