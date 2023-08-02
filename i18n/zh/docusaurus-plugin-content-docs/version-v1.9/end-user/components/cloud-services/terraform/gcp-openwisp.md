---
title:  Gcp-Openwisp
---

## 描述

Terraform files for deploying docker-openwisp infrastructure in Google Cloud.

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 database_cloudsql | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({\n    name              = string\n    tier              = string\n    require_ssl       = bool\n    availability_type = string\n    disk_size         = number\n    disk_type         = string\n    sslmode           = string\n    username          = string\n    password          = string\n    database          = string\n    auto_backup = object({\n      enabled    = bool\n      start_time = string\n    })\n    maintaince = object({\n      day   = number\n      hour  = number\n      track = string\n    })\n  }) | true |  
 gce_persistent_disk | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({\n    name = string\n    type = string\n    size = number\n    snapshots = object({\n      name             = string\n      hours_in_cycle   = string\n      start_time       = string\n      retention_days   = number\n      on_disk_deletion = string\n    })\n  }) | true |  
 gke_cluster | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({\n    cluster_name             = string\n    kubernetes_version       = string\n    logging_service          = string\n    monitoring_service       = string\n    master_ipv4_cidr_block   = string\n    regional                 = bool\n    enable_private_endpoint  = bool\n    daily_maintenance_window = string\n    authorized_networks = list(object({\n      display_name = string\n      cidr_block   = string\n    }))\n  }) | true |  
 gke_node_groups | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | list(object({\n    pool_name           = string\n    initial_node_count  = number\n    min_node_count      = number\n    max_node_count      = number\n    disk_size_gb        = number\n    auto_repair         = bool\n    auto_upgrade        = bool\n    is_preemptible      = bool\n    disk_type           = string\n    instance_image_type = string\n    oauth_scopes        = list(string)\n    machine_type        = string\n    enable_autoscaling  = bool\n  })) | true |  
 google_services | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({\n    service_account             = string\n    project_id                  = string\n    region                      = string\n    zone                        = string\n    common_resource_description = string\n    configure_gloud             = bool\n    disable_apis_on_destroy     = bool\n    use_cloud_sql               = bool\n    use_cloud_dns               = bool\n  }) | true |  
 network_config | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({\n    vpc_name                  = string\n    subnet_cidr               = string\n    pods_cidr_range           = string\n    services_cidr_range       = string\n    http_loadbalancer_ip_name = string\n    openvpn_ip_name           = string\n    freeradius_ip_name        = string\n    openwisp_dns_zone_name    = string\n    openwisp_dns_name         = string\n    openwisp_dns_records_ttl  = number\n    subnet_flowlogs = object({\n      enable   = bool\n      interval = string\n      sampling = number\n      metadata = string\n    })\n  }) | true |  
 openwisp_services | Find documentation here: https://github.com/atb00ker/terraform-gcp-openwisp/blob/master/docs/input.md | object({\n    use_openvpn    = bool\n    use_freeradius = bool\n    setup_database = bool\n    setup_fresh    = bool\n  }) | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
