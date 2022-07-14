---
title:  Alibaba Cloud RDS-PREVIEW
---

## Description

Alibaba RDS in a preview mode

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 account_name | RDS instance user account name | string | false |  
 allocate_public_connection | Whether to allocate public connection for a RDS instance. | bool | false |  
 database_name | Database name | string | false |  
 instance_name | RDS instance name | string | false |  
 password | RDS instance account password | string | true |  
 privilege | The privilege of one account access database. | string | false |  
 security_ips | List of IP addresses allowed to access all databases of an instance | list(any) | false |  
 sql_bucket_endpoint | The endpoint of the bucket. like `oss-cn-hangzhou.aliyuncs.com` | string | false |  
 sql_bucket_name | The bucket name of the SQL file. like `oss://example` | string | false |  
 sql_file | The name of SQL file in the bucket, like `db.sql` | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description 
 ------------ | ------------- 
 DATABASE_NAME | RDS Database Name
 DB_HOST | RDS Instance Host
 DB_ID | RDS Instance ID
 DB_NAME | RDS Instance Name
 DB_PASSWORD | RDS Instance Password
 DB_PORT | RDS Instance Port
 DB_PUBLIC_HOST | RDS Instance Public Host
 DB_USER | RDS Instance User
 RESOURCE_IDENTIFIER | The identifier of the resource
