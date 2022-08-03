---
title:  Gcp-Gcs
---

## 描述

GCP Gcs

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 gcs_bucket_force_destroy | GCS force destroy parameter (true/false) |  | true |  
 gcs_bucket_location | GCS bucket location |  | true |  
 gcs_bucket_name | GCS bucket name |  | true |  
 gcs_bucket_storage_class | GCS storage class |  | true |  
 gcs_bucket_versioning | GCS versioning parameter (true/false) |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
