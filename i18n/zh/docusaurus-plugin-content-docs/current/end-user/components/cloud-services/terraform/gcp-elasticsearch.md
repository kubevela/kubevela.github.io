---
title:  Gcp-Elasticsearch
---

## 描述

 Terraform module for deploying Elasticsearch cluster on GCP

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 backup_repository_create | If GCS bucket should be created. Set to false, if you previously created bucket  | bool | false |  
 load_balancer_subnetwork | The subnetwork that the load balanced IP should belong to for this Forwarding Rule. If the network specified is in auto subnet mode, this field is optional. However, if the network is in custom subnet mode, a subnetwork must be specified. | string | false |  
 backup_failed_jobs_history_limit | Set retention for failed jobs history | number | false |  
 health_check_timeout_sec | How long (in seconds) to wait before claiming failure. The default value is 5 seconds. It is invalid for timeoutSec to have greater value than checkIntervalSec. | number | false |  
 health_check_healthy_threshold | How many consecutive successes must occur to mark a VM instance healthy. | number | false |  
 namespace | K8s namespace used to deploy endpoints and services. | string | false |  
 cluster_name | ES cluster name. | string | true |  
 add_random_suffix | Add random suffix to all resources with possible duplicates if the same module is deployed multiple times | bool | false |  
 enable_health_check_logging | Enable health check logging | bool | false |  
 backend_service_timeout_sec | How many seconds to wait for the backend before considering it a failed request. Default is 30 seconds. Valid range is [1, 86400]. | number | false |  
 region | Region of GCP project. | string | true |  
 raw_image_source | URL of tar archive containing RAW source for ES image (you can use Packer image template to generate image, as mentioned above). | string | false |  
 data_disk_type | Type of disk used as a persistent storage. | string | false |  
 data_disk_size | Persistent disk size specified in GB. | string | true |  
 cluster_ca_certificate | Public CA certificate that is the root of trust for the GKE K8s cluster | string | true |  
 cluster_endpoint | Cluster control plane endpoint | string | true |  
 backup_schedule | Backup schedule in cron format | string | false |  
 heap_size | Heap size setting for ES. | string | false |  
 custom_pre_start_commands | Any custom commands which should be run after bootstrapping the Elasticsearch cluster before starting Elasticsearch service | string | false |  
 backup_successful_jobs_history_limit | Set retention for successful jobs history | number | false |  
 health_check_interval_sec | How often (in seconds) to send a health check. The default value is 5 seconds. | number | false |  
 backup_repository_name | Custom name of Elasticsearch backup repository, same name is going to be used for backup bucket | string | false |  
 zone | Zone of GCP project - optional parameter, if not set, the instances will be spread across the available zones. | string | false |  
 instance_name | Base for GCE instances name. Must be unique within GCP project | string | true |  
 allowed_tags | Network tags allowed to communicate with ES instances. | list(string) | false |  
 backup_storage_class | The storage class you set for an object affects the object's availability and pricing model | string | false |  
 project | Name of GCP project. | string | true |  
 network | GCE VPC used for compute instances | string | false |  
 machine_type | The machine type to create | string | false |  
 custom_init_commands | Any custom commands which should be run after bootstrapping the Elasticsearch cluster after starting Elasticsearch service | string | false |  
 es_name_suffix_length | Length of random generated suffix for ES name | number | false |  
 es_image_creation_timeout | Timeout for creating ES image | string | false |  
 health_check_unhealthy_threshold | How many consecutive failures must occur to mark a VM instance unhealthy. | number | false |  
 node_count | Number of ES nodes to deploy. | number | false |  
 root_disk_size | Persistent disk size specified in GB. | string | false |  
 cluster_token | Cluster master token, keep always secret! | string | true |  
 allowed_ipv4_subnets | IPv4 subnets allowed to communicate with ES instances. | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
