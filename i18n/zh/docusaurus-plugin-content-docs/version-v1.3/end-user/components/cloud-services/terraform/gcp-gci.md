---
title:  Gcp-Gci
---

## 描述

Manages GCP compute engine instance

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 disk_image | Instance disk image | string | true |  
 machine_type | Instance machine type | string | true |  
 name | Instance name | string | true |  
 project_name | The project name used by metadata_startup_script | string | false |  
 ssh_public_key | Public SSH key to be added to authorized_keys | string | true |  
 subnetwork | The name or self_link of the subnetwork to attach this instance network interface to. | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone | Instance availability zone | string | true |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
