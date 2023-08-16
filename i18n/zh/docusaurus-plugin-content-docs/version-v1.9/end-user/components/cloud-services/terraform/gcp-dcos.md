---
title:  Gcp-Dcos
---

## 描述

Creates a DC/OS Cluster on GCP | Convenience Wrapper for GCP

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 accepted_internal_networks | Subnet ranges for all internal networks | list | false |  
 additional_private_agent_ips | Additional private agent IPs. |  | false |  
 additional_public_agent_ips | Additional public agent IPs. |  | false |  
 admin_ips | List of CIDR admin IPs | list | true |  
 ansible_additional_config | Add additional config options to ansible. This is getting merged with generated defaults. Do not specify `dcos:` |  | false |  
 ansible_bundled_container | Docker container with bundled dcos-ansible and ansible executables |  | false |  
 availability_zones | List of availability_zones to be used as the same format that are required by the platform/cloud providers. i.e `['RegionZone']` | list | false |  
 bootstrap_gcp_image | [BOOTSTRAP] Image to be used |  | false |  
 bootstrap_machine_type | [BOOTSTRAP] Machine type |  | false |  
 bootstrap_os | [BOOTSTRAP] Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 bootstrap_root_volume_size | [BOOTSTRAP] Root volume size in GB |  | false |  
 bootstrap_root_volume_type | [BOOTSTRAP] Root volume type |  | false |  
 cluster_name | Name of the DC/OS cluster |  | false |  
 cluster_name_random_string | Add a random string to the cluster name |  | false |  
 dcos_instance_os | Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 labels | Add custom labels to all resources | map | false |  
 masters_gcp_image | [MASTERS] Image to be used |  | false |  
 masters_machine_type | [MASTERS] Machine type |  | false |  
 masters_os | [MASTERS] Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 masters_root_volume_size | [MASTERS] Root volume size in GB |  | false |  
 num_masters | Specify the amount of masters. For redundancy you should have at least 3 |  | false |  
 num_private_agents | Specify the amount of private agents. These agents will provide your main resources |  | false |  
 num_public_agents | Specify the amount of public agents. These agents will host marathon-lb and edgelb |  | false |  
 private_agents_gcp_image | [PRIVATE AGENTS] Image to be used |  | false |  
 private_agents_machine_type | [PRIVATE AGENTS] Machine type |  | false |  
 private_agents_os | [PRIVATE AGENTS] Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 private_agents_root_volume_size | [PRIVATE AGENTS] Root volume size in GB |  | false |  
 private_agents_root_volume_type | [PRIVATE AGENTS] Root volume type |  | false |  
 public_agents_access_ips | List of ips allowed access to public agents. admin_ips are joined to this list | list | false |  
 public_agents_additional_ports | List of additional ports allowed for public access on public agents (80 and 443 open by default) |  | false |  
 public_agents_gcp_image | [PUBLIC AGENTS] Image to be used |  | false |  
 public_agents_machine_type | [PUBLIC AGENTS] Machine type |  | false |  
 public_agents_os | [PUBLIC AGENTS] Operating system to use. Instead of using your own AMI you could use a provided OS. |  | false |  
 public_agents_root_volume_size | [PUBLIC AGENTS] Root volume size |  | false |  
 public_agents_root_volume_type | [PUBLIC AGENTS] Specify the root volume type. |  | false |  
 ssh_public_key | SSH public key in authorized keys format (e.g. 'ssh-rsa ..') to be used with the instances. Make sure you added this key to your ssh-agent. |  | false |  
 ssh_public_key_file | Path to SSH public key. This is mandatory but can be set to an empty string if you want to use ssh_public_key with the key as string. |  | true |  
 subnet_range | Private IP space to be used in CIDR format |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
