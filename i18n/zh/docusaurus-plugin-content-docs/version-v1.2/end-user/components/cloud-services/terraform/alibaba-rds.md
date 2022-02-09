---
title:  阿里云 RDS
---

## 描述

用于部署阿里云 RDS 的组件说明

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rds-cloud-source
spec:
  components:
    - name: sample-db
      type: alibaba-rds
      properties:
        instance_name: sample-db
        account_name: oamtest
        password: U34rfwefwefffaked
        writeConnectionSecretToRef:
          name: db-conn
```

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 security_ips | List of IP addresses allowed to access all databases of an instance | list(any) | false |  
 privilege | The privilege of one account access database. | string | false |  
 sql_file | The name of SQL file in the bucket, like `db.sql` | string | false |  
 sql_bucket_name | The bucket name of the SQL file. like `oss://example` | string | false |  
 password | RDS instance account password | string | false |  
 account_name | RDS instance user account name | string | false |  
 allocate_public_connection | Whether to allocate public connection for a RDS instance. | bool | false |  
 database_name | Database name | string | false |  
 sql_bucket_endpoint | The endpoint of the bucket. like `oss-cn-hangzhou.aliyuncs.com` | string | false |  
 instance_name | RDS instance name | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述 
 ------------ | ------------- 
 DB_USER | RDS Instance User
 DB_PASSWORD | RDS Instance Password
 DATABASE_NAME | RDS Database Name
 RESOURCE_IDENTIFIER | The identifier of the resource
 DB_NAME | RDS Instance Name
 DB_PORT | RDS Instance Port
 DB_HOST | RDS Instance Host
 DB_PUBLIC_HOST | RDS Instance Public Host
 DB_ID | RDS Instance ID
