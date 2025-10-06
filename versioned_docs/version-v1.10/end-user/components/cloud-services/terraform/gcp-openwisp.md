---
title:  Gcp-Openwisp
---

## Description

Terraform files for deploying docker-openwisp infrastructure in Google Cloud.

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 database_cloudsql | Cloud SQL database configuration. See [documentation](https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md) for details. | `map(any)` | true |  
 gce_persistent_disk | GCE persistent disk configuration. See [documentation](https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md) for details. | `map(any)` | true |  
 gke_cluster | GKE cluster configuration. See [documentation](https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md) for details. | `map(any)` | true |  
 gke_node_groups | List of GKE node group configurations. See [documentation](https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md) for details. | `list(map(any))` | true |  
 google_services | Google Cloud services configuration. See [documentation](https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md) for details. | `map(any)` | true |  
 network_config | Network configuration for OpenWISP. See [documentation](https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md) for details. | `map(any)` | true |  
 openwisp_services | OpenWISP services configuration. See [documentation](https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md) for details. | `map(bool)` | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
