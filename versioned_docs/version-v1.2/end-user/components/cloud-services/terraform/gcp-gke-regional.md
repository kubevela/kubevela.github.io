---
title:  Gcp-Gke-Regional
---

## Description

Using Terraform to create a regional GKE cluster (Hosted Kubernetes offering of GCP)

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 monitoring_service | Monitoring service that will be used |  | true |  
 daily_maintenance_window_start_time | Daily maintenance window start time (format 'HH:MM', where HH : [00-23] and MM : [00-59] GMT) |  | true |  
 horizontal_pod_autoscaling | Should horizontal_pod_autoscaling addon be disabled? (true/false) |  | false |  
 logging_service | Logging service that will be used |  | true |  
 subnetwork | Name of the sub-network in which the cluster will be sitting |  | false |  
 region | Region where the cluster will be deployed |  | true |  
 network | Name of the network in which the cluster will be sitting |  | false |  
 http_load_balancing | Should http_load_balancing addon be disabled? (true/false) |  | false |  
 network_policy_config | Should network_policy_config addon be disabled? (true/false) |  | false |  
 istio_config | Should istio_config addon be disabled? (true/false) |  | false |  
 cloudrun_config | Should cloudrun_config addon be disabled? (true/false) |  | false |  
 cluster_name | Name of the cluster |  | true |  
 kubernetes_dashboard | Should kubernetes_dashboard addon be disabled? (true/false) |  | false |  
 node_pools | All variables regarding nodes are expressed here |  | false |  
 kube_version | Kubernetes version |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
