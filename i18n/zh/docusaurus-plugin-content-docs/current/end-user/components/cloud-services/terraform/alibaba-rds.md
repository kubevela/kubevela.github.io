---
title:  阿里云 RDS
---

## 描述

Terraform configuration for Alibaba Cloud RDS object

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
 password | RDS instance account password | string | true |  
 allocate_public_connection | Whether to allocate public connection for a RDS instance. | bool | true |  
 security_ips | List of IP addresses allowed to access all databases of an instance | list | true |  
 database_name | Database name | string | true |  
 privilege | The privilege of one account access database. | string | true |  
 instance_name | RDS instance name | string | true |  
 account_name | RDS instance user account name | string | true |  
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
 DB_ID | RDS Instance ID
 DB_NAME | RDS Instance Name
 DB_USER | RDS Instance User
 DB_PORT | RDS Instance Port
 DB_HOST | RDS Instance Host
 DB_PASSWORD | RDS Instance Password
 DB_PUBLIC_HOST | RDS Instance Public Host
 DATABASE_NAME | RDS Database Name
