---
title:  Gcp-Bootstrap
---

## 描述

Create a DC/OS Bootstrap instance and have conditional DC/OS prereqs for gcp

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 machine_type | Instance Type |  | true |  
 disk_type | Disk Type to Leverage The GCE disk type. Can be either 'pd-ssd', 'local-ssd', or 'pd-standard'. (optional) |  | true |  
 scheduling_preemptible | Deploy instance with preemptible scheduling |  | false |  
 hostname_format | Format the hostname inputs are index+1, region, cluster_name |  | false |  
 name_prefix | Name Prefix |  | false |  
 tags | Add custom tags to all resources | list | false |  
 dcos_instance_os | Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 num_bootstrap | Specify the amount of bootstrap. You should have at most 1 |  | false |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 zone_list | Element by zone list | list | false |  
 image | Source image to boot from |  | true |  
 user_data | User data to be used on these instances (cloud-init) |  | false |  
 public_ssh_key | SSH Public Key |  | true |  
 disk_size | Disk Size in GB |  | true |  
 bootstrap_subnetwork_name | Instance Subnetwork Name |  | true |  
 ssh_user | SSH User |  | true |  
 labels | Add custom labels to all resources | map | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
