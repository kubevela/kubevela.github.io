---
title:  Gcp-Private-Agents
---

## 描述

Create DC/OS Private Agents instance and have conditional DC/OS Prereqs for gcp

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cluster_name | Name of the DC/OS cluster |  | true |  
 zone_list | Element by zone list | list | true |  
 image | Source image to boot from |  | false |  
 user_data | User data to be used on these instances (cloud-init) |  | false |  
 ssh_user | SSH User |  | true |  
 hostname_format | Format the hostname inputs are index+1, region, cluster_name |  | false |  
 guest_accelerator_count | Count of guest accelerator type |  | false |  
 name_prefix | Name Prefix |  | false |  
 disk_type | Disk Type to Leverage The GCE disk type. Can be either 'pd-ssd', 'local-ssd', or 'pd-standard'. (optional) |  | false |  
 dcos_instance_os | Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 num_private_agents | Specify the amount of private agents. These agents will provide your main resources |  | true |  
 machine_type | Instance Type |  | false |  
 disk_size | Disk Size in GB |  | false |  
 private_agent_subnetwork_name | Instance Subnetwork Name |  | true |  
 public_ssh_key | SSH Public Key |  | true |  
 tags | Add custom tags to all resources | list | false |  
 scheduling_preemptible | Deploy instance with preemptible scheduling |  | false |  
 guest_accelerator_type | Type of guest accelerator |  | false |  
 labels | Add custom labels to all resources | map | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
