---
title:  阿里云 MONGODB-MULTI
---

## 描述

Terraform-based module for creating a MongoDB cloud database under AliCloud VPC

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 account_password | Password of the root account. It is a string of 6 to 32 characters and is composed of letters, numbers, and underlines | string | false |  
 backup_period | MongoDB Instance backup period. It is required when backup_time was existed. Valid values: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]. Default to [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday].  | list(string) | false |  
 backup_time | MongoDB instance backup time. It is required when backup_period was existed. In the format of HH:mmZ- HH:mmZ. Time setting interval is one hour. Default to a random time, like '23:00Z-24:00Z'.  | string | false |  
 create_resources_size | The specification of the monitoring region. | string | false |  
 db_instance_class | The specification of the instance. For more information about the value, see https://www.alibabacloud.com/help/doc-detail/57141.htm | string | false |  
 db_instance_storage | The storage space of the instance. Valid values: 10 to 3000. Unit: GB. You can only specify this value in 10 GB increments.  | number | false |  
 engine_version | The version number of the database. Valid value: 3.2, 3.4, 4.0.  | string | false |  
 instance_charge_type | The billing method of the instance. Valid values are Prepaid, PostPaid, Default to PostPaid | string | false |  
 instance_id | `(Deprecated)` It has been deprecated from version 1.2.0 and use `existing_instance_id` instead.  | string | false |  
 name |  The name of DB instance. It a string of 2 to 256 characters | string | false |  
 period | The duration that you will buy DB instance (in month). It is valid when instance_charge_type is PrePaid. Valid values: [1~9], 12, 24, 36. Default to 1 | number | false |  
 region | The specification of the monitoring region. | string | false |  
 replication_factor | The number of nodes in the replica set instance. Valid values: 3, 5, 7. Default value: 3.  | number | false |  
 security_ip_list |  List of IP addresses allowed to access all databases of an instance. The list contains up to 1,000 IP addresses, separated by commas. Supported formats include 0.0.0.0/0, 10.23.12.24 (IP), and 10.23.12.24/24 (Classless Inter-Domain Routing (CIDR) mode. /24 represents the length of the prefix in an IP address. The range of the prefix length is [1,32]).  | list(string) | false |  
 storage_engine | The MongoDB storage engine, WiredTiger or RocksDB. Default value: WiredTiger.  | string | false |  
 tags | A mapping of tags to assign to the mongodb instance resource.  | map(string) | false |  
 vswitch_id | The virtual switch ID to launch DB instances in one VPC.  | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  
 zone_id | The ID of the zone. You can refer to https://www.alibabacloud.com/help/doc-detail/61933.htm.  | string | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
