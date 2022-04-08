---
title:  Alibaba Cloud SLB-RULE
---

## Description

Terraform-based module creates an SLB instance under AliCloud's VPC and configures rules

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 address_type | The type of address. Choices are 'intranet' and 'internet'. Default to 'internet'. | string | false |  
 availability_zone | The available zone to launch modules. | string | false |  
 available_disk_category | Filter the results by a specific disk category. Can be either `cloud`, `cloud_efficiency`, `cloud_ssd`, `ephemeral_ssd`. | string | false |  
 available_resource_creation | Type of resources that can be created. | string | false |  
 backend_port | Port used by the Server Load Balancer instance backend. Valid value range: [1-65535]. | number | false |  
 bandwidth | Bandwidth peak of Listener. | number | false |  
 cidr_block | The CIDR block for the VPC. The cidr_block is Optional and default value is `172.16.0.0/12` after `v1.119.0+`. | string | false |  
 cookie | The cookie configured on the server. It is mandatory when `sticky_session` is `on` and `sticky_session_type` is `server`. Otherwise, it will be ignored. Valid value：String in line with RFC 2965, with length being 1- 200. It only contains characters such as ASCII codes, English letters and digits instead of the comma, semicolon or spacing, and it cannot start with $. | string | false |  
 cookie_timeout | Cookie timeout. It is mandatory when sticky_session is `on` and sticky_session_type is `insert`. Otherwise, it will be ignored. Valid value range: [1-86400] in seconds. | number | false |  
 cpu_core_count | Number of CPU cores. | number | false |  
 domain | Domain name of the forwarding rule. It can contain letters a-z, numbers 0-9, hyphens (-), and periods (.), and wildcard characters. | string | false |  
 frontend_port | Port used by the Server Load Balancer instance frontend. | number | false |  
 health_check | Whether to enable health check. Valid values are `on` and `off`. TCP and UDP listener's HealthCheck is always on, so it will be ignore when launching TCP or UDP listener. This parameter is required and takes effect only when ListenerSync is set to off. | string | false |  
 health_check_connect_port | Port used for health check. Valid value range: [1-65535]. Default to `None` means the backend server port is used. | string | false |  
 health_check_domain | Domain name used for health check. When it used to launch TCP listener, health_check_type must be `http`. Its length is limited to 1-80 and only characters such as letters, digits, ‘-‘ and ‘.’ are allowed. When it is not set or empty, Server Load Balancer uses the private network IP address of each backend server as Domain used for health check. | string | false |  
 health_check_http_code | Regular health check HTTP status code. Multiple codes are segmented by “,”. It is required when health_check is on. Default to `http_2xx`. Valid values are: `http_2xx`, `http_3xx`, `http_4xx` and `http_5xx`. | string | false |  
 health_check_interval | Time interval of health checks. It is required when `health_check` is on. Valid value range: [1-50] in seconds. Default to 2. | number | false |  
 health_check_timeout | Maximum timeout of each health check response. It is required when `health_check` is on. Valid value range: [1-300] in seconds. Default to 5. Note: If `health_check_timeout` < `health_check_interval`, its will be replaced by `health_check_interval`. | number | false |  
 health_check_uri | URI used for health check. When it used to launch TCP listener, health_check_type must be `http`. Its length is limited to 1-80 and it must start with /. Only characters such as letters, digits, ‘-’, ‘/’, ‘.’, ‘%’, ‘?’, #’ and ‘&’ are allowed. | string | false |  
 healthy_threshold | Threshold determining the result of the health check is success. It is required when `health_check` is on. Valid value range: [1-10] in seconds. Default to 3. | number | false |  
 images_most_recent | If more than one result are returned, select the most recent one. | bool | false |  
 images_name_regex | A regex string to filter resulting images by name. | string | false |  
 images_owners | Filter results by a specific image owner. Valid items are `system`, `self`, `others`, `marketplace`. | string | false |  
 internal | It has been deprecated from 1.6.0 and 'address_type' instead. If true, SLB instance will be an internal SLB. | bool | false |  
 listener_sync | Indicates whether a forwarding rule inherits the settings of a health check , session persistence, and scheduling algorithm from a listener. Default to on. | string | false |  
 memory_size | Size of memory, measured in GB. | number | false |  
 name | The name of a new load balancer. | string | false |  
 protocol | The protocol to listen on. | string | false |  
 rule_health_check_connect_port | Port used for health check. Valid value range: [1-65535]. Default to `None` means the backend server port is used. | number | false |  
 scheduler | Scheduling algorithm, Valid values are `wrr`, `rr` and `wlc`. Default to `wrr`. This parameter is required and takes effect only when ListenerSync is set to `off`. | string | false |  
 spec | The specification of the SLB instance. | string | false |  
 sticky_session | Whether to enable session persistence, Valid values are `on` and `off`. Default to `off`. This parameter is required and takes effect only when ListenerSync is set to `off`. | string | false |  
 sticky_session_type | Mode for handling the cookie. If sticky_session is `on`, it is mandatory. Otherwise, it will be ignored. Valid values are insert and server. insert means it is inserted from Server Load Balancer; server means the Server Load Balancer learns from the backend server. | string | false |  
 tags | A mapping of tags to assign to the resource. | map(string) | false |  
 unhealthy_threshold | Threshold determining the result of the health check is fail. It is required when `health_check` is on. Valid value range: [1-10] in seconds. Default to 3. | number | false |  
 url | Domain of the forwarding rule. It must be 2-80 characters in length. Only letters a-z, numbers 0-9, and characters '-' '/' '?' '%' '#' and '&' are allowed. URLs must be started with the character '/', but cannot be '/' alone. | string | false |  
 vswitch_id | VSwitch variables, if vswitch_id is empty, then the net_type = classic. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
