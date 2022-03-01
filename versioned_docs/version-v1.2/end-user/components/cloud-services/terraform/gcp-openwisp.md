---
title:  Gcp-Openwisp
---

## Description

Terraform files for deploying docker-openwisp infrastructure in Google Cloud.

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 openwisp_services | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({
    use_openvpn    = bool
    use_freeradius = bool
    setup_database = bool
    setup_fresh    = bool
  }) | true |  
 gce_persistent_disk | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({
    name = string
    type = string
    size = number
    snapshots = object({
      name             = string
      hours_in_cycle   = string
      start_time       = string
      retention_days   = number
      on_disk_deletion = string
    })
  }) | true |  
 database_cloudsql | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({
    name              = string
    tier              = string
    require_ssl       = bool
    availability_type = string
    disk_size         = number
    disk_type         = string
    sslmode           = string
    username          = string
    password          = string
    database          = string
    auto_backup = object({
      enabled    = bool
      start_time = string
    })
    maintaince = object({
      day   = number
      hour  = number
      track = string
    })
  }) | true |  
 network_config | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({
    vpc_name                  = string
    subnet_cidr               = string
    pods_cidr_range           = string
    services_cidr_range       = string
    http_loadbalancer_ip_name = string
    openvpn_ip_name           = string
    freeradius_ip_name        = string
    openwisp_dns_zone_name    = string
    openwisp_dns_name         = string
    openwisp_dns_records_ttl  = number
    subnet_flowlogs = object({
      enable   = bool
      interval = string
      sampling = number
      metadata = string
    })
  }) | true |  
 gke_node_groups | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | list(object({
    pool_name           = string
    initial_node_count  = number
    min_node_count      = number
    max_node_count      = number
    disk_size_gb        = number
    auto_repair         = bool
    auto_upgrade        = bool
    is_preemptible      = bool
    disk_type           = string
    instance_image_type = string
    oauth_scopes        = list(string)
    machine_type        = string
    enable_autoscaling  = bool
  })) | true |  
 gke_cluster | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({
    cluster_name             = string
    kubernetes_version       = string
    logging_service          = string
    monitoring_service       = string
    master_ipv4_cidr_block   = string
    regional                 = bool
    enable_private_endpoint  = bool
    daily_maintenance_window = string
    authorized_networks = list(object({
      display_name = string
      cidr_block   = string
    }))
  }) | true |  
 google_services | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({
    service_account             = string
    project_id                  = string
    region                      = string
    zone                        = string
    common_resource_description = string
    configure_gloud             = bool
    disable_apis_on_destroy     = bool
    use_cloud_sql               = bool
    use_cloud_dns               = bool
  }) | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
