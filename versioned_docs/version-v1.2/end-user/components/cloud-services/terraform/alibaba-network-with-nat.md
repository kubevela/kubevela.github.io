---
title:  Alibaba Cloud NETWORK-WITH-NAT
---

## Description

Build VPC and Nat gateway network environment and bind EIP, add SNAT and DNAT entries on AliCloud based on Terraform module

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 nat_period | The charge duration of the PrePaid nat gateway, in month. | number | false |  
 region | (Deprecated from version 1.1.0) The region used to launch this module resources. | string | false |  
 profile | (Deprecated from version 1.1.0) The profile name as set in the shared credentials file. If not set, it will be sourced from the ALICLOUD_PROFILE environment variable. | string | false |  
 vpc_name | The vpc name used to launch a new vpc. | string | false |  
 use_num_suffix | Always append numerical suffix(like 001, 002 and so on) to vswitch name, even if the length of `vswitch_cidrs` is 1 | bool | false |  
 nat_type | The type of NAT gateway. | string | false |  
 snat_with_vswitch_ids | List of snat entries to create by vswitch ids. Each item valid keys: 'vswitch_ids'(required, using comma joinor to set multi vswitch ids), 'snat_ip'(if not, use root parameter 'snat_ips', using comma joinor to set multi ips), 'name'(if not, will return one automatically). | list(map(string)) | false |  
 vpc_cidr | The cidr block used to launch a new vpc. | string | false |  
 bandwidth_package_name | The name of the common bandwidth package. | string | false |  
 dnat_entries | A list of entries to create. Each item valid keys: 'name'(default to a string with prefix 'tf-dnat-entry' and numerical suffix), 'ip_protocol'(default to 'any'), 'external_ip'(if not, use root parameter 'external_ip'), 'external_port'(default to 'any'), 'internal_ip'(required), 'internal_port'(default to the 'external_port'). | list(map(string)) | false |  
 vpc_tags | The tags used to launch a new vpc. | map(string) | false |  
 number_of_snat_eip | Number of EIP instance used to bind with this Snat. | number | false |  
 eip_period | The duration that you will buy the EIP, in month. | number | false |  
 dnat_table_id | The value can get from alicloud_nat_gateway Attributes 'forward_table_ids'. | string | false |  
 create_vpc | Whether to create vpc. If false, you can specify an existing vpc by setting 'existing_vpc_id'. | bool | false |  
 vswitch_id | ID of the vswitch where to create nat gateway. | string | false |  
 payment_type | The billing method of the NAT gateway. | string | false |  
 dnat_eip_association_instance_id | The ID of the ECS or SLB instance or Nat Gateway or NetworkInterface or HaVip. | string | false |  
 computed_snat_with_source_cidr | List of computed snat entries to create by cidr blocks. Each item valid keys: 'source_cidr'(required), 'snat_ip'(if not, use root parameter 'snat_ips', using comma joinor to set multi ips), 'name'(if not, will return one automatically). | list(map(string)) | false |  
 dnat_external_ip | The public ip address to use on all dnat entries. | string | false |  
 create_nat | Whether to create nat gateway. | bool | false |  
 cbp_ratio | Ratio of the common bandwidth package. | number | false |  
 eip_isp | The line type of the Elastic IP instance. | string | false |  
 internet_charge_type | The internet charge type. | string | false |  
 cbp_bandwidth | The bandwidth of the common bandwidth package, in Mbps. | number | false |  
 cbp_internet_charge_type | The billing method of the common bandwidth package. Valid values are 'PayByBandwidth' and 'PayBy95' and 'PayByTraffic'. 'PayBy95' is pay by classic 95th percentile pricing. International Account doesn't supports 'PayByBandwidth' and 'PayBy95'. Default to 'PayByTraffic'. | string | false |  
 create_eip | Whether to create new EIP and bind it to this Nat gateway. If true, the 'number_of_dnat_eip' or 'number_of_snat_eip' should not be empty. | bool | false |  
 number_of_dnat_eip | Number of EIP instance used to bind with this Dnat. | number | false |  
 vswitch_cidrs | List of cidr blocks used to launch several new vswitches. If not set, there is no new vswitches will be created. | list(string) | false |  
 vswitch_ids | A list of virtual switch IDs to launch in. | list(string) | false |  
 snat_with_source_cidrs | List of snat entries to create by cidr blocks. Each item valid keys: 'source_cidrs'(required, using comma joinor to set multi cidrs), 'snat_ip'(if not, use root parameter 'snat_ips', using comma joinor to set multi ips), 'name'(if not, will return one automatically). | list(map(string)) | false |  
 vpc_description | The vpc description used to launch a new vpc. | string | false |  
 availability_zones | List available zones to launch several VSwitches. | list(string) | false |  
 create_snat | Whether to create snat entries. If true, the 'snat_with_source_cidrs' or 'snat_with_vswitch_ids' or 'snat_with_instance_ids' should be set. | bool | false |  
 nat_description | The description of nat gateway. | string | false |  
 shared_credentials_file | (Deprecated from version 1.1.0) This is the path to the shared credentials file. If this is not set and a profile is specified, $HOME/.aliyun/config.json will be used. | string | false |  
 existing_vpc_id | The vpc id used to launch several vswitches. | string | false |  
 nat_name | Name of a new nat gateway. | string | false |  
 eip_tags | A mapping of tags to assign to the EIP instance resource. | map(string) | false |  
 computed_snat_with_vswitch_id | List of computed snat entries to create by vswitch ids. Each item valid keys: 'vswitch_id'(required), 'snat_ip'(if not, use root parameter 'snat_ips', using comma joinor to set multi ips), 'name'(if not, will return one automatically). | list(map(string)) | false |  
 vswitch_tags | The tags used to launch serveral vswitches. | map(string) | false |  
 nat_specification | The specification of nat gateway. | string | false |  
 vswitch_name | The vswitch name prefix used to launch several new vswitches. | string | false |  
 eip_bandwidth | Maximum bandwidth to the elastic public network, measured in Mbps (Mega bit per second). | number | false |  
 eip_internet_charge_type | Internet charge type of the EIP, Valid values are 'PayByBandwidth', 'PayByTraffic'.  | string | false |  
 tags | The common tags will apply to all of resources. | map(string) | false |  
 eip_name | Name to be used on all eip as prefix. Default to 'TF-EIP-for-Nat'. The final default name would be TF-EIP-for-Nat001, TF-EIP-for-Nat002 and so on. | string | false |  
 snat_ips | The public ip addresses to use on all snat entries. | list(string) | false |  
 nat_instance_charge_type | (Deprecated from version 1.2.0) The charge type of the nat gateway. Choices are 'PostPaid' and 'PrePaid'. | string | false |  
 use_existing_vpc | The vpc id used to launch several vswitches. If set, the 'create_vpc' will be ignored. | bool | false |  
 snat_with_instance_ids | List of snat entries to create by ecs instance ids. Each item valid keys: 'instance_ids'(required, using comma joinor to set multi instance ids), 'snat_ip'(if not, use root parameter 'snat_ips', using comma joinor to set multi ips), 'name'(if not, will return one automatically). | list(map(string)) | false |  
 skip_region_validation | (Deprecated from version 1.1.0) Skip static validation of region ID. Used by users of alternative AlibabaCloud-like APIs or users w/ access to regions that are not public (yet). | bool | false |  
 vswitch_description | The vswitch description used to launch several new vswitch. | string | false |  
 eip_instance_charge_type | Elastic IP instance charge type. | string | false |  
 create_dnat | Whether to create dnat entries. If true, the 'entries' should be set. | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
