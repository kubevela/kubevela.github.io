---
title:  Azure Mariadb 数据库
---

## 描述

用于部署 Azure mariadb 数据库的组件说明

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
        providerRef:
          name: azure
          namespace: default
        writeConnectionSecretToRef:
          name: azure-db-conn
          namespace: vela-system

```

## 参数说明

### Properties

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
| server_name                | mariadb 服务名                                               | string                                                    | 是     |         |
| db_name                    | 数据库实例名                                            | string                                                    | 是     |         |
| username                   | 数据库实例用户名                                      | string                                                    | 是     |         |
| password                   | 数据库实例密码                                       | string                                                    | 是     |         |
| location                   | Azure 地域                                                    | string                                                    | 是     |         |
| resource_group             | 资源组                                                    | string                                                    | 是     |         |
writeConnectionSecretToRef | 云资源连接信息即将写入的 secret 的信息 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | 否 |

#### writeConnectionSecretToRef

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
name | 云资源连接信息即将写入的 secret 的名字 | string | 是 |
namespace | 云资源连接信息即将写入的 secret 的 namespace | string | 否 |

## 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）。

名字 | 描述
------------ | -------------
SERVER_NAME | Mariadb server name |
DB_NAME | database instance name |
DB_USER | database instance username |
DB_PORT | database instance port |
DB_HOST | database instance host |
DB_PASSWORD | database instance password |