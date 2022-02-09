---
title:  AWS EKS-NODE-PROBLEM-DETECTOR
---

## 描述

A terraform module to deploy a node problem detector on Amazon EKS cluster

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 values | Additional yaml encoded values which will be passed to the Helm chart | string | false |  
 argo_application_enabled | If set to true, the module will be deployed as ArgoCD application, otherwise it will be deployed as a Helm release | bool | false |  
 argo_info | ArgoCD info manifest parameter |  | false |  
 helm_chart_version | Version of the Helm chart | string | false |  
 helm_release_name | Helm release name | string | false |  
 argo_application_values | Value overrides to use when deploying argo application object with helm |  | false |  
 argo_destionation_server | Destination server for ArgoCD Application | string | false |  
 argo_sync_policy | ArgoCD syncPolicy manifest parameter |  | false |  
 helm_create_namespace | Create the namespace if it does not yet exist | bool | false |  
 helm_chart_name | Helm chart name to be installed | string | false |  
 k8s_namespace | The K8s namespace in which the node-problem-detector service account has been created | string | false |  
 argo_application_use_helm | If set to true, the ArgoCD Application manifest will be deployed using Kubernetes provider as a Helm release. Otherwise it'll be deployed as a Kubernetes manifest. See Readme for more info | bool | false |  
 argo_project | ArgoCD Application project | string | false |  
 enabled | Variable indicating whether deployment is enabled | bool | false |  
 helm_repo_url | Helm repository | string | false |  
 settings | Additional settings which will be passed to the Helm chart values, see https://hub.helm.sh/charts/stable/node-problem-detector | map(any) | false |  
 argo_namespace | Namespace to deploy ArgoCD application CRD to | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
