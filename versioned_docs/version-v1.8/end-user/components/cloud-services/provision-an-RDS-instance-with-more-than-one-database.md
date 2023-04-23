---
title: Provision an RDS instance with more than one database
---

:::tip
This section requires your platform engineers have already enabled [terraform addon](../../../reference/addons/terraform).
:::

In the guide [Provision and Binding Cloud Resources](../../../tutorials/consume-cloud-services) and [Provision a Database and Import a SQL File for initialization](./provision-and-initiate-database),
only one database will be created in an RDS instance. This tutorial will show you how to create more than one database in an RDS instance.

In the [reference doc for Alibaba Cloud RDS](./terraform/alibaba-rds), set `database_name` if you want to create one database.
If you want to create more than one database, set `databases` to array of databases. Each database is a map, the map
contains the following attributes: name, character_set, description.

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

| Name          | Description                                                                                                                                                                                                                                | Type              | Required | Default |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | -------- | ------- |
| database_name | Database name                                                                                                                                                                                                                              | string            | false    |         |
| databases     | The database list, each database is a map, the map contains the following attributes: name, character_set, description, like `[{"name":"test","character_set":"utf8","description":"test database"},]`. It conflicts with `database_name`. | list(map(string)) | false    |         |

Applying the following application can create more than one database in an RDS instance.


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
