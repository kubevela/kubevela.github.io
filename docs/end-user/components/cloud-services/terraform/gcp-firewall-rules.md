---
title:  Gcp-Firewall-Rules
---

## Description

 Terraform module for creating Firewall rules on Google Cloud

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | Name of the Firewall rule |  | true |  
 network | The name or self_link of the network to attach this firewall to |  | true |  
 source_ranges | A list of source CIDR ranges that this firewall applies to. Can't be used for EGRESS | list | true |  
 target_tags | A list of target tags for this firewall | list | true |  
 protocol | The name of the protocol to allow. This value can either be one of the following well known protocol strings (tcp, udp, icmp, esp, ah, sctp), or the IP protocol number, or all |  | true |  
 ports | List of ports and/or port ranges to allow. This can only be specified if the protocol is TCP or UDP | list | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
