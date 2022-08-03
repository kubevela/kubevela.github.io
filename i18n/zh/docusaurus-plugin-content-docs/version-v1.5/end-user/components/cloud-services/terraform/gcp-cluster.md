---
title:  Gcp-Cluster
---

## 描述

Set up a GKE cluster connected as part of shared VPC

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 RBAC_group_name |  | string | false |  
 auto_upgrade |  | bool | false |  
 http_load_balancing_disabled | Disable Http Load balancing | bool | false |  
 ip_allocation_policy | Values to fill the cluster ip_allocation_policy block | map(any) | true |  
 kubernetes_dashboard_disabled | Switch on the Dashboard | bool | false |  
 maintenance_window |  | string | false |  
 master_authorized_network_cidr | The range of IPs that can connect to the Kubernetes master | string | true |  
 name | The Name of the cluster | string | true |  
 network | The VPC |  | true |  
 network_policy | To enable the network policy | bool | false |  
 network_policy_config_disabled | Toggle network policy | bool | false |  
 node_pool | Configuration of the Node hosts | map(any) | false |  
 pod_security_policy_config_enabled |  | bool | false |  
 private_cluster_config | Values to fill the cluster private_cluster_config block | map(any) | true |  
 project | The GCP project of the Network the cluster is in |  | true |  
 region | The GCP region | string | true |  
 release_channel | Set the release channel UNSPECIFIED|RAPID|REGULAR|STABLE | string | false |  
 remove_default_node_pool | An override to remove the node pool, doesnt make much sense to me either | bool | false |  
 resource_labels |  | map(any) | false |  
 subnetwork | The name of the sub-net to use |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zones |  |  | true |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
