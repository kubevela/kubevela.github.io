---
title:  Gcp-Bootstrap
---

## Description

Create a DC/OS Bootstrap instance and have conditional DC/OS prereqs for gcp

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 bootstrap_subnetwork_name | Instance Subnetwork Name |  | true |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 dcos_instance_os | Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 disk_size | Disk Size in GB |  | true |  
 disk_type | Disk Type to Leverage The GCE disk type. Can be either 'pd-ssd', 'local-ssd', or 'pd-standard'. (optional) |  | true |  
 hostname_format | Format the hostname inputs are index+1, region, cluster_name |  | false |  
 image | Source image to boot from |  | true |  
 labels | Add custom labels to all resources | map | false |  
 machine_type | Instance Type |  | true |  
 name_prefix | Name Prefix |  | false |  
 num_bootstrap | Specify the amount of bootstrap. You should have at most 1 |  | false |  
 public_ssh_key | SSH Public Key |  | true |  
 scheduling_preemptible | Deploy instance with preemptible scheduling |  | false |  
 ssh_user | SSH User |  | true |  
 tags | Add custom tags to all resources | list | false |  
 user_data | User data to be used on these instances (cloud-init) |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_list | Element by zone list | list | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
