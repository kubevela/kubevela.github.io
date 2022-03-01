---
title:  Gcp-Bastion
---

## Description

Bastion for GCP

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 source_cidrs | The ranges to allow to connect to the bastion | list(any) | true |  
 zone | The GCP zone | string | true |  
 image | Describes the base image used | map(any) | true |  
 nat_ip | Values set if using a Static IP |  | false |  
 keyring |  | string | false |  
 network_interface |  | map(any) | true |  
 machine_type | The machine type for the Bastion | string | false |  
 tags | Hard-coded tags that associates the correct firewall to the instance | list(any) | false |  
 service_email | Service account username | string | true |  
 location |  |  | false |  
 name | The name of the Bastion Instance | string | false |  
 firewall | Flag to control the creation or not of a firewall rule. Maybe not needed if you use a pre-prepared or shared set-up | number | false |  
 service_scope |  | list(any) | false |  
 kms_key_name |  | string | false |  
 account_id |  |  | true |  
 project | The GCP project | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
