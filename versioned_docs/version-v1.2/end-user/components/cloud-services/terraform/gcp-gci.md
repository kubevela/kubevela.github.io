---
title:  Gcp-Gci
---

## Description

Manages GCP compute engine instance

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | Instance name | string | true |  
 machine_type | Instance machine type | string | true |  
 disk_image | Instance disk image | string | true |  
 zone | Instance availability zone | string | true |  
 subnetwork | The name or self_link of the subnetwork to attach this instance network interface to. | string | true |  
 project_name | The project name used by metadata_startup_script | string | false |  
 ssh_public_key | Public SSH key to be added to authorized_keys | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
