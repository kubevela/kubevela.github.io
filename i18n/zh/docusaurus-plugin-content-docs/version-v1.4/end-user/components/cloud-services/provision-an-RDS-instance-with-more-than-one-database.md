---
title: RDS 实例创建多数据库
---

指南 [创建和使用云资源](./provision-and-consume-database)和[数据库创建和初始化](./provision-and-initiate-database)里，在一个
RDS 实例中，只创建了一个数据库。本教程将告诉你如何在一个 RDS 实例中创建多个数据库。

在[阿里云 RDS 参考文档](./terraform/alibaba-rds)中，如果你想创建一个数据库，请设置`database_name`。 如果你想创建多个数据库，
设置 `databases`，它是一个数据库列表，每个数据库都是一个 map，包含属性：name、character_set、description。

```
[
    {
      "name" : "test",
      "character_set" : "utf8",
      "description" : "test database"
    },
    {
      "name" : "test2",
      "character_set" : "utf8",
      "description" : "test database"
    }
  ]
```

| 名称            | 描述                                                                                                                                                                                                                                         | 类型                | 是否必须  | 默认值 |
|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|-------|-----|
| database_name | Database name                                                                                                                                                                                                                              | string            | false |     |
| databases     | The database list, each database is a map, the map contains the following attributes: name, character_set, description, like `[{"name":"test","character_set":"utf8","description":"test database"},]`. It conflicts with `database_name`. | list(map(string)) | false |     |

执行以下 Yaml 文件可以在 RDS 实例中创建多个数据库。

> ⚠️ 请确认管理员已经安装了 [云资源插件](../../../reference/addons/terraform)。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: alibaba-rds-multiple-databases
spec:
  components:
    - name: db
      type: alibaba-rds
      properties:
        instance_name: dblinks
        account_name: oamtest
        password: U34rfwefwefffaked
        databases:
          - name: dev
            character_set: utf8
            description: "dev database"
          - name: prod
            character_set: utf8
            description: "prod database"
        writeConnectionSecretToRef:
          name: db-conn

```

