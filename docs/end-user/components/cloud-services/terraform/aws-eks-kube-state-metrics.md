---
title:  AWS EKS-KUBE-STATE-METRICS
---

## Description

AWS Eks-Kube-State-Metrics

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 settings | Additional settings which will be passed to the Helm chart values, see https://hub.helm.sh/charts/stable/kube-state-metrics | map(any) | false |  
 values | Additional yaml encoded values which will be passed to the Helm chart. | string | false |  
 helm_release_name | Helm release name | string | false |  
 helm_create_namespace | Create the namespace if it does not yet exist | bool | false |  
 helm_chart_name | Helm chart name to be installed | string | false |  
 helm_chart_version | Version of the Helm chart | string | false |  
 helm_repo_url | Helm repository | string | false |  
 k8s_namespace | The K8s namespace in which the kube-state-metrics service account has been created | string | false |  
 enabled | Variable indicating whether deployment is enabled | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
