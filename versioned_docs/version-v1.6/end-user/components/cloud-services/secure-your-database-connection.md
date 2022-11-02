---
title: Secure your Database Connection
---

In the guide [Provision and Binding Cloud Resources](../../../tutorials/consume-cloud-services) and [Provision a Database and Import a SQL File for initialization](./provision-and-initiate-database),
a database's public host `DB_PUBLIC_HOS` is used to connect by business component. It's necessary when you want to have
a try, create a PoC, or use the database outside a cloud provider. But it's not secure for production use of database.

This tutorial will talk about how to secure your database connection.

## Provision a database

In the [reference doc for Alibaba Cloud RDS](./terraform/alibaba-rds), these two properties are essential.

| Name                       | Description                                                                                                                    | Type   | Required | Default |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------------|--------|----------|---------|
| vswitch_id                 | The vswitch id of the RDS instance. If set, the RDS instance will be created in VPC, or it will be created in classic network. | string | false    |         |
| allocate_public_connection | Whether to allocate public connection for a RDS instance.                                                                      | bool   | false    |         |

Set `vswitch_id` to the same as one of VSwitch of your ACK cluster, or a new VSwitch which belongs to the VPC of the cluster.
Set `allocation_public_connection` to `false` to disable internet connection.

Then using `DB_HOST` in business component to securely connect the database by intranet connection

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

