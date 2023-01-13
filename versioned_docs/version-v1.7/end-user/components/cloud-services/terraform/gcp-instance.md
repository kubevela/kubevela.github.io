---
title:  Gcp-Instance
---

## Description

GCP Instance

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 allow_stopping_for_update | If true, allows Terraform to stop the instance to update its properties |  | false |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 dcos_instance_os | Operating system to use. Instead of using your own AMI you could use a provided OS. |  | true |  
 disk_size | Disk Size in GB |  | true |  
 disk_type | Disk Type to Leverage The GCE disk type. Can be either 'pd-ssd', 'local-ssd', or 'pd-standard'. (optional) |  | true |  
 guest_accelerator_count | Count of guest accelerator type |  | false |  
 guest_accelerator_type | Type of guest accelerator |  | false |  
 hostname_format | Format the hostname inputs are index+1, region, cluster_name |  | false |  
 image | Source image to boot from |  | true |  
 instance_subnetwork_name | Instance Subnetwork Name |  | true |  
 labels | Add custom labels to all resources | map | false |  
 machine_type | Instance Type |  | true |  
 name_prefix | Name Prefix |  | false |  
 num_instances | How many instances should be created |  | true |  
 public_ssh_key | SSH Public Key |  | true |  
 scheduling_preemptible | Deploy instance with preemptible scheduling. (bool) |  | false |  
 ssh_private_key_filename | Path to the SSH private key |  | false |  
 ssh_user | SSH User |  | true |  
 tags | Add custom tags to all resources | list | false |  
 user_data | User data to be used on these instances (cloud-init) |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_list | Element by zone list | list | true |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
