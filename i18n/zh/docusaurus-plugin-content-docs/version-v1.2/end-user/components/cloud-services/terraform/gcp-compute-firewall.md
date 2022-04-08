---
title:  Gcp-Compute-Firewall
---

## 描述

Create an ELB to be used for DC/OS for GCP

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 admin_ips | List of CIDR admin IPs | list | true |  
 cluster_name | Name of the DC/OS cluster |  | true |  
 internal_subnets | List of internal subnets to allow traffic between them | list | true |  
 name_prefix | Name Prefix |  | false |  
 network | Network Name |  | true |  
 public_agents_additional_ports | List of additional ports allowed for public access on public agents (80 and 443 open by default) | list | false |  
 public_agents_ips | List of ips allowed access to public agents. admin_ips are joined to this list | list | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
