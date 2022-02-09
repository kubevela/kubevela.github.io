---
title:  AWS EKS-KUBE-STATE-METRICS
---

## 描述

AWS Eks-Kube-State-Metrics

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 enabled | Variable indicating whether deployment is enabled | bool | false |  
 helm_chart_name | Helm chart name to be installed | string | false |  
 helm_chart_version | Version of the Helm chart | string | false |  
 helm_release_name | Helm release name | string | false |  
 values | Additional yaml encoded values which will be passed to the Helm chart. | string | false |  
 helm_create_namespace | Create the namespace if it does not yet exist | bool | false |  
 helm_repo_url | Helm repository | string | false |  
 k8s_namespace | The K8s namespace in which the kube-state-metrics service account has been created | string | false |  
 settings | Additional settings which will be passed to the Helm chart values, see https://hub.helm.sh/charts/stable/kube-state-metrics | map(any) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
