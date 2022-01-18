---
title:  Azure DATABASE-MARIADB
---

## 描述

Terraform configuration for Azure Database Mariadb

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: mariadb-backend
spec:
  components:
    - name: mariadb-backend
      type: azure-database-mariadb
      properties:
        resource_group: "kubevela-group"
        location: "West Europe"
        server_name: "kubevela"
        db_name: "backend"
        username: "acctestun"
        password: "H@Sh1CoR3!Faked"
        writeConnectionSecretToRef:
          name: azure-db-conn
          namespace: vela-system
```

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 server_name | mariadb server name | string | true |  
 db_name | Database instance name | string | true |  
 username | Database instance username | string | true |  
 password | Database instance password | string | true |  
 location | Azure location | string | true |  
 resource_group | Resource group | string | true |  
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
 DB_PASSWORD | Database instance password
 DB_PORT | Database instance port
 DB_HOST | Database instance host
 SERVER_NAME | mariadb server name
 DB_NAME | Database instance name
 DB_USER | Database instance username
