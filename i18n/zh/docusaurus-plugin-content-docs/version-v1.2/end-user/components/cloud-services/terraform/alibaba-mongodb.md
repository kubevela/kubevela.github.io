---
title:  阿里云 MONGODB
---

## 描述

Alibaba Cloud MongoDB

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 engine_version | The version number of the database. Valid value: 3.4, 4.0, 4.2, 4.4, 5.0  | string | true |  
 shared_credentials_file | (Deprecated from version 1.4.0) This is the path to the shared credentials file. If this is not set and a profile is specified, $HOME/.aliyun/config.json will be used.  | string | false |  
 skip_region_validation | (Deprecated from version 1.4.0) Skip static validation of region ID. Used by users of alternative AlibabaCloud-like APIs or users w/ access to regions that are not public (yet).  | bool | false |  
 instance_charge_type | The billing method of the instance. Valid values are Prepaid, PostPaid, Default to PostPaid | string | false |  
 period | The duration that you will buy DB instance (in month). It is valid when instance_charge_type is PrePaid. Valid values: [1~9], 12, 24, 36. Default to 1 |  | false |  
 vswitch_id | The virtual switch ID to launch DB instances in one VPC.  | string | false |  
 backup_time | MongoDB instance backup time. It is required when backup_period was existed. In the format of HH:mmZ- HH:mmZ. Time setting interval is one hour. Default to a random time, like '23:00Z-24:00Z'.  | string | false |  
 profile | (Deprecated from version 1.4.0) The profile name as set in the shared credentials file. If not set, it will be sourced from the ALICLOUD_PROFILE environment variable.  | string | false |  
 db_instance_class | The specification of the instance. For more information about the value, see https://www.alibabacloud.com/help/doc-detail/57141.htm | string | true |  
 storage_engine | The MongoDB storage engine, WiredTiger or RocksDB. Default value: WiredTiger.  | string | false |  
 security_ip_list |  List of IP addresses allowed to access all databases of an instance. The list contains up to 1,000 IP addresses, separated by commas. Supported formats include 0.0.0.0/0, 10.23.12.24 (IP), and 10.23.12.24/24 (Classless Inter-Domain Routing (CIDR) mode. /24 represents the length of the prefix in an IP address. The range of the prefix length is [1,32]).  | list(string) | false |  
 replication_factor | The number of nodes in the replica set instance. Valid values: 3, 5, 7. Default value: 3.  | number | false |  
 tags | A mapping of tags to assign to the mongodb instance resource.  | map(string) | false |  
 region | (Deprecated from version 1.4.0) The region used to launch this module resources.  | string | false |  
 name |  The name of DB instance. It a string of 2 to 256 characters | string | true |  
 zone_id | The ID of the zone. You can refer to https://www.alibabacloud.com/help/doc-detail/61933.htm.  | string | false |  
 account_password | Password of the root account. It is a string of 6 to 32 characters and is composed of letters, numbers, and underlines | string | true |  
 backup_period | MongoDB Instance backup period. It is required when backup_time was existed. Valid values: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]. Default to [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday].  | list(string) | true |  
 existing_instance_id | The Id of an existing Mongodb instance. If set, the `create` will be ignored.  | string | false |  
 create | Whether to use an existing MongoDB. If false, you can use a existing Mongodb instance by setting `existing_instance_id`.  | bool | false |  
 instance_id | `(Deprecated)` It has been deprecated from version 1.2.0 and use `existing_instance_id` instead.  | string | false |  
 db_instance_storage | The storage space of the instance. Valid values: 10 to 3000. Unit: GB. You can only specify this value in 10 GB increments.  | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
