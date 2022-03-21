---
title:  Gcp-Gke-Ecommerce
---

## 描述

Google Kubernetes Engine starter kit to bootstrap an e-commerce site based on microservices

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 regional | Whether is a regional cluster (zonal cluster if set false. WARNING: changing this after cluster creation is destructive!) | bool | false |  
 node_pool_disk_type | Disk type for GKE nodes. Available values: pd-stadard, pd-ssd.Default: pd-standard | string | false |  
 icmp_idle_timeout_sec | Timeout (in seconds) for ICMP connections. Defaults to 30s if not set. | string | false |  
 kubelet_config | Node kubelet configuration. Possible values can be found at https://cloud.google.com/kubernetes-engine/docs/how-to/node-system-config#kubelet-options | object({\n    cpu_manager_policy   = string,\n    cpu_cfs_quota        = bool,\n    cpu_cfs_quota_period = string\n  }) | false |  
 node_pool_disk_size | Disk Size for GKE Nodes | number | false |  
 gke_auto_max_count | The maximum number of VMs in the pool per zone (zones) as it is a regional cluster | number | false |  
 nat_ip_count | The number of NAT IPs | number | false |  
 gke_max_surge | The number of additional nodes that can be added to the node pool during an upgrade. Increasing max_surge raises the number of nodes that can be upgraded simultaneously. Can be set to 0 or greater. | string | false |  
 gke_max_unavailable | The number of nodes that can be simultaneously unavailable during an upgrade. Increasing max_unavailable raises the number of nodes that can be upgraded in parallel. Can be set to 0 or greater. | string | false |  
 release_channel | The release channel of this cluster. Accepted values are `UNSPECIFIED`, `RAPID`, `REGULAR` and `STABLE`. Defaults to `UNSPECIFIED`. | string | false |  
 enable_hpa | Toggles horizontal pod autoscaling addon. Default: true | bool | false |  
 boot_disk_kms_key | CloudKMS key_name to use to encrypt the nodes boot disk. Default: null (encryption disabled) | string | false |  
 daily_maintenance_window_start | Time window specified for daily maintenance operations in RFC3339 format | string | false |  
 gke_preemptible | GKE Preemtible nodes | bool | false |  
 gke_initial_node_count | The initial number of VMs in the pool per group (zones) as it is a regional cluster | number | false |  
 tcp_transitory_idle_timeout_sec | The tcp trans idle timeout in sec used by the nat gateway | string | false |  
 udp_idle_timeout_sec | Timeout (in seconds) for UDP connections. Defaults to 30s if not set. | string | false |  
 project_id | The project ID to host the cluster in (required) | string | true |  
 region | The region to host the cluster in. Default: us-central1 | string | false |  
 netpol_provider | Sets the network policy provider. Default: CALICO | string | false |  
 enable_netpol | Toggles network policies enforcement feature. Default: false | bool | false |  
 environment | The environment name | string | false |  
 project_name_override | Override project name prefix used in all the resources | string | false |  
 node_auto_repair | Whether the nodes will be automatically repaired | bool | false |  
 database_encryption | Application-layer Secrets Encryption settings. The object format is {state = string, key_name = string}. Valid values of state are: "ENCRYPTED"; "DECRYPTED". key_name is the name of a CloudKMS key. | object({ state = string, key_name = string }) | false |  
 zones | The zone to host the cluster in (required if is a zonal cluster) | list(string) | false |  
 master_ipv4_cidr_block | IPv4 CIDR Block for Master Nodes | string | false |  
 gke_auto_min_count | The minimum number of VMs in the pool per group (zones) as it is a regional cluster | number | false |  
 gke_instance_type | The worker instance type | string | false |  
 node_auto_upgrade | Whether the nodes will be automatically upgraded | bool | false |  
 min_ports_per_vm | Max number of concurrent outgoing request to IP:PORT_PROTOCOL per VM | string | false |  
 tcp_established_idle_timeout_sec | The tcp established idle timeout in sec used by the nat gateway | string | false |  
 cluster_name_suffix | A suffix to append to the default cluster name | string | false |  
 cluster_ipv4_cidr_block | IPv4 CIDR Block for Kubernetes Pods | string | false |  
 min_kubernetes_version | The Kubernetes MINIMUM version of the masters. GCP can perform upgrades, there is no max_version field. If set to 'latest' it will pull latest available version in the selected region. | string | false |  
 services_ipv4_cidr_block | IPv4 CIDR Block for Kubernetes services | string | false |  
 subnet_ip_cidr_range | IPv4 CIDR Block for Subnetwork | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
