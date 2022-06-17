---
title: 安全访问数据库
---

在指南 [创建和使用云资源](./provision-and-consume-database)和[数据库创建和初始化](./provision-and-initiate-database)，业务组件
使用数据库的公网连接 `DB_PUBLIC_HOS` 来访问数据库。当你想试用，创建 PoC，或在云提供商集群之外使用数据库时，这是必要的。但是，对于数据库的生产使用来说，它是不安全的。

本教程将讨论如何安全访问你的数据库。

## 部署数据库

在[阿里云 RDS 参考文档](./terraform/alibaba-rds)中，这两个属性非常重要。

| 名称                         | 描述                                                                                                                             | 类型     | 是否必须  | 默认值 |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------------|--------|-------|-----|
| vswitch_id                 | The vswitch id of the RDS instance. If set, the RDS instance will be created in VPC, or it will be created in classic network. | string | false |     |
| allocate_public_connection | Whether to allocate public connection for a RDS instance.                                                                      | bool   | false |     |

将 `vswitch_id` 设置为与你的 ACK 集群的子网之一，或属于集群 VPC 的一个新子网。
将 `allocation_public_connection` 设置为 `false` 以禁止创建互联网连接。

然后在业务组件中使用 `DB_HOST`，通过私有网络连接安全地连接数据库。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application

spec:
  components:
    - name: web
      ...
      traits:
        - type: service-binding
          properties:
            envMappings:
              DATABASE_HOST:
                secret: db-conn
-                key: DB_PUBLIC_HOST
+                key: DB_HOST


    - name: db
      type: alibaba-rds
      properties:
        ...
+        vswitch_id: xxx
+        allocate_public_connection: false
        writeConnectionSecretToRef:
          name: db-conn
```

## 执行应用

你可以使用[创建和使用云资源](./provision-and-consume-database)和[数据库创建和初始化](./provision-and-initiate-database)的实例来安全访问数据库。
