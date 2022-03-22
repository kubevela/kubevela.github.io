---
title:  Gcp-Private-Agents
---

## Description

Create DC/OS Private Agents instance and have conditional DC/OS Prereqs for gcp

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 scheduling_preemptible | Deploy instance with preemptible scheduling |  | false |  
 public_ssh_key | SSH Public Key |  | true |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 disk_type | Disk Type to Leverage The GCE disk type. Can be either 'pd-ssd', 'local-ssd', or 'pd-standard'. (optional) |  | false |  
 disk_size | Disk Size in GB |  | false |  
 private_agent_subnetwork_name | Instance Subnetwork Name |  | true |  
 ssh_user | SSH User |  | true |  
 dcos_instance_os | Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 guest_accelerator_type | Type of guest accelerator |  | false |  
 name_prefix | Name Prefix |  | false |  
 num_private_agents | Specify the amount of private agents. These agents will provide your main resources |  | true |  
 machine_type | Instance Type |  | false |  
 zone_list | Element by zone list | list | true |  
 user_data | User data to be used on these instances (cloud-init) |  | false |  
 labels | Add custom labels to all resources | map | false |  
 image | Source image to boot from |  | false |  
 tags | Add custom tags to all resources | list | false |  
 hostname_format | Format the hostname inputs are index+1, region, cluster_name |  | false |  
 guest_accelerator_count | Count of guest accelerator type |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
