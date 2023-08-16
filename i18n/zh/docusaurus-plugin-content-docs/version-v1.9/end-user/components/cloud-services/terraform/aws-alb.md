---
title:  AWS ALB
---

## 描述

Terraform module to create an AWS Application/Network Load Balancer (ALB/NLB) and associated resources

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 access_logs | Map containing access logging configuration for load balancer. | map(string) | false |  
 create_lb | Controls if the Load Balancer should be created | bool | false |  
 desync_mitigation_mode | Determines how the load balancer handles requests that might pose a security risk to an application due to HTTP desync. | string | false |  
 drop_invalid_header_fields | Indicates whether invalid header fields are dropped in application load balancers. Defaults to false. | bool | false |  
 enable_cross_zone_load_balancing | Indicates whether cross zone load balancing should be enabled in application load balancers. | bool | false |  
 enable_deletion_protection | If true, deletion of the load balancer will be disabled via the AWS API. This will prevent Terraform from deleting the load balancer. Defaults to false. | bool | false |  
 enable_http2 | Indicates whether HTTP/2 is enabled in application load balancers. | bool | false |  
 enable_waf_fail_open | Indicates whether to route requests to targets if lb fails to forward the request to AWS WAF | bool | false |  
 extra_ssl_certs | A list of maps describing any extra SSL certificates to apply to the HTTPS listeners. Required key/values: certificate_arn, https_listener_index (the index of the listener within https_listeners which the cert applies toward). | list(map(string)) | false |  
 http_tcp_listener_rules | A list of maps describing the Listener Rules for this ALB. Required key/values: actions, conditions. Optional key/values: priority, http_tcp_listener_index (default to http_tcp_listeners[count.index]) | any | false |  
 http_tcp_listener_rules_tags | A map of tags to add to all http listener rules | map(string) | false |  
 http_tcp_listeners | A list of maps describing the HTTP listeners or TCP ports for this ALB. Required key/values: port, protocol. Optional key/values: target_group_index (defaults to http_tcp_listeners[count.index]) | any | false |  
 http_tcp_listeners_tags | A map of tags to add to all http listeners | map(string) | false |  
 https_listener_rules | A list of maps describing the Listener Rules for this ALB. Required key/values: actions, conditions. Optional key/values: priority, https_listener_index (default to https_listeners[count.index]) | any | false |  
 https_listener_rules_tags | A map of tags to add to all https listener rules | map(string) | false |  
 https_listeners | A list of maps describing the HTTPS listeners for this ALB. Required key/values: port, certificate_arn. Optional key/values: ssl_policy (defaults to ELBSecurityPolicy-2016-08), target_group_index (defaults to https_listeners[count.index]) | any | false |  
 https_listeners_tags | A map of tags to add to all https listeners | map(string) | false |  
 idle_timeout | The time in seconds that the connection is allowed to be idle. | number | false |  
 internal | Boolean determining if the load balancer is internal or externally facing. | bool | false |  
 ip_address_type | The type of IP addresses used by the subnets for your load balancer. The possible values are ipv4 and dualstack. | string | false |  
 lb_tags | A map of tags to add to load balancer | map(string) | false |  
 listener_ssl_policy_default | The security policy if using HTTPS externally on the load balancer. [See](https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/elb-security-policy-table.html). | string | false |  
 load_balancer_create_timeout | Timeout value when creating the ALB. | string | false |  
 load_balancer_delete_timeout | Timeout value when deleting the ALB. | string | false |  
 load_balancer_type | The type of load balancer to create. Possible values are application or network. | string | false |  
 load_balancer_update_timeout | Timeout value when updating the ALB. | string | false |  
 name | The resource name and Name tag of the load balancer. | string | false |  
 name_prefix | The resource name prefix and Name tag of the load balancer. Cannot be longer than 6 characters | string | false |  
 putin_khuylo | Do you agree that Putin doesn't respect Ukrainian sovereignty and territorial integrity? More info: https://en.wikipedia.org/wiki/Putin_khuylo! | bool | false |  
 security_groups | The security groups to attach to the load balancer. e.g. ["sg-edcd9784","sg-edcd9785"] | list(string) | false |  
 subnet_mapping | A list of subnet mapping blocks describing subnets to attach to network load balancer | list(map(string)) | false |  
 subnets | A list of subnets to associate with the load balancer. e.g. ['subnet-1a2b3c4d','subnet-1a2b3c4e','subnet-1a2b3c4f'] | list(string) | false |  
 tags | A map of tags to add to all resources | map(string) | false |  
 target_group_tags | A map of tags to add to all target groups | map(string) | false |  
 target_groups | A list of maps containing key/value pairs that define the target groups to be created. Order of these maps is important and the index of these are to be referenced in listener definitions. Required key/values: name, backend_protocol, backend_port | any | false |  
 vpc_id | VPC id where the load balancer and other resources will be deployed. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
