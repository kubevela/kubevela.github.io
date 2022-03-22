---
title:  Gcp-Public-Agents
---

## Description

Create DC/OS Public Agents instance and have conditional DC/OS prereqs for gcp

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 num_public_agents | Specify the amount of public agents. These agents will host marathon-lb and edgelb |  | true |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 ssh_user | SSH User |  | true |  
 user_data | User data to be used on these instances (cloud-init) |  | false |  
 dcos_instance_os | Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 labels | Add custom labels to all resources | map | false |  
 name_prefix | Name Prefix |  | false |  
 machine_type | Instance Type |  | true |  
 image | Source image to boot from |  | true |  
 public_agent_subnetwork_name | Instance Subnetwork Name |  | true |  
 hostname_format | Format the hostname inputs are index+1, region, cluster_name |  | false |  
 zone_list | Element by zone list | list | false |  
 public_ssh_key | SSH Public Key |  | true |  
 tags | Add custom tags to all resources | list | false |  
 disk_type | Disk Type to Leverage The GCE disk type. Can be either 'pd-ssd', 'local-ssd', or 'pd-standard'. (optional) |  | true |  
 disk_size | Disk Size in GB |  | true |  
 scheduling_preemptible | Deploy instance with preemptible scheduling. (bool) |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
