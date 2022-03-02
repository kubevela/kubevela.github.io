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
 allocate_public_connection | Whether to allocate public connection for a RDS instance. | bool | false |  
 security_ips | List of IP addresses allowed to access all databases of an instance | list(any) | false |  
 database_name | Database name | string | false |  
 privilege | The privilege of one account access database. | string | false |  
 vswitch_id | The vswitch id of the RDS instance. If set, the RDS instance will be created in VPC, or it will be created in classic network. | string | false |  
 instance_name | RDS instance name | string | false |  
 account_name | RDS instance user account name | string | false |  
 password | RDS instance account password | string | true |  
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
 RESOURCE_IDENTIFIER | The identifier of the resource
 DB_ID | RDS Instance ID
 DB_NAME | RDS Instance Name
 DB_PASSWORD | RDS Instance Password
 DATABASE_NAME | RDS Database Name
 DB_USER | RDS Instance User
 DB_PORT | RDS Instance Port
 DB_HOST | RDS Instance Host
 DB_PUBLIC_HOST | RDS Instance Public Host
