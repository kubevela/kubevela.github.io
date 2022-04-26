---
title:  Gcp-Bastion
---

## Description

Bastion for GCP

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 account_id |  |  | true |  
 firewall | Flag to control the creation or not of a firewall rule. Maybe not needed if you use a pre-prepared or shared set-up | number | false |  
 image | Describes the base image used | map(any) | true |  
 keyring |  | string | false |  
 kms_key_name |  | string | false |  
 location |  |  | false |  
 machine_type | The machine type for the Bastion | string | false |  
 name | The name of the Bastion Instance | string | false |  
 nat_ip | Values set if using a Static IP |  | false |  
 network_interface |  | map(any) | true |  
 project | The GCP project | string | true |  
 service_email | Service account username | string | true |  
 service_scope |  | list(any) | false |  
 source_cidrs | The ranges to allow to connect to the bastion | list(any) | true |  
 tags | Hard-coded tags that associates the correct firewall to the instance | list(any) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone | The GCP zone | string | true |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
