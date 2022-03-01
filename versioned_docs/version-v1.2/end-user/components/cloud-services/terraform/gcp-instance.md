---
title:  Gcp-Instance
---

## Description

GCP Instance

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 user_data | User data to be used on these instances (cloud-init) |  | true |  
 tags | Add custom tags to all resources | list | false |  
 hostname_format | Format the hostname inputs are index+1, region, cluster_name |  | false |  
 disk_type | Disk Type to Leverage The GCE disk type. Can be either 'pd-ssd', 'local-ssd', or 'pd-standard'. (optional) |  | true |  
 zone_list | Element by zone list | list | true |  
 instance_subnetwork_name | Instance Subnetwork Name |  | true |  
 labels | Add custom labels to all resources | map | false |  
 scheduling_preemptible | Deploy instance with preemptible scheduling. (bool) |  | false |  
 name_prefix | Name Prefix |  | false |  
 dcos_instance_os | Operating system to use. Instead of using your own AMI you could use a provided OS. |  | true |  
 ssh_private_key_filename | Path to the SSH private key |  | false |  
 image | Source image to boot from |  | true |  
 disk_size | Disk Size in GB |  | true |  
 ssh_user | SSH User |  | true |  
 public_ssh_key | SSH Public Key |  | true |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 machine_type | Instance Type |  | true |  
 allow_stopping_for_update | If true, allows Terraform to stop the instance to update its properties |  | false |  
 guest_accelerator_type | Type of guest accelerator |  | false |  
 guest_accelerator_count | Count of guest accelerator type |  | false |  
 num_instances | How many instances should be created |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
