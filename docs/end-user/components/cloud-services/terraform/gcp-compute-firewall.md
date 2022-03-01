---
title:  Gcp-Compute-Firewall
---

## Description

Create an ELB to be used for DC/OS for GCP

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cluster_name | Name of the DC/OS cluster |  | true |  
 network | Network Name |  | true |  
 internal_subnets | List of internal subnets to allow traffic between them | list | true |  
 admin_ips | List of CIDR admin IPs | list | true |  
 public_agents_ips | List of ips allowed access to public agents. admin_ips are joined to this list | list | false |  
 public_agents_additional_ports | List of additional ports allowed for public access on public agents (80 and 443 open by default) | list | false |  
 name_prefix | Name Prefix |  | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
