---
title:  Gcp-Hashicorp-Suite
---

## Description

Terraform module to run Nomad on Google Cloud

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 consul_enabled | Is consul enabled on this instance |  | true |  
 consul_join_tag_key | AWS Tag to use for consul auto-join |  | true |  
 consul_join_tag_value | Value to search for in auto-join tag to use for consul auto-join |  | true |  
 consul_version | Consul version to install |  | true |  
 instance_type |  |  | false |  
 key_name | SSH key to add to instances |  | true |  
 max_agents | The maximum number of agents allowed in the autoscale group |  | true |  
 max_servers | The maximum number of servers allowed in the autoscale group |  | true |  
 min_agents | The minimum number of agents to add to the autoscale group |  | true |  
 min_servers | The minimum number of servers to add to the autoscale group |  | true |  
 namespace | Namespace for application, all resources will be prefixed with namespace |  | true |  
 nomad_datacentre | Default datacenter for Nomad |  | false |  
 nomad_enabled | Is nomad enabled on this instance |  | true |  
 nomad_region | Default datacenter for Nomad |  | false |  
 nomad_version | Nomad version to install |  | true |  
 vpc_id | Name of the network to attach instances to |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone | Zone to launch instances into |  | true |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
