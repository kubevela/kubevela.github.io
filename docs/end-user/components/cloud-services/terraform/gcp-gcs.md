---
title:  Gcp-Gcs
---

## Description

GCP Gcs

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 gcs_bucket_force_destroy | GCS force destroy parameter (true/false) |  | true |  
 gcs_bucket_storage_class | GCS storage class |  | true |  
 gcs_bucket_versioning | GCS versioning parameter (true/false) |  | true |  
 gcs_bucket_name | GCS bucket name |  | true |  
 gcs_bucket_location | GCS bucket location |  | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
