---
title:  Azure Database Mariadb
---


## Description

Terraform configuration for Azure Database Mariadb

## Sample

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

## Specification

### Properties

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
| server_name                | mariadb server name                                               | string                                                    | true     |         |
| db_name                    | Database instance name                                            | string                                                    | true     |         |
| username                   | Database instance username                                        | string                                                    | true     |         |
| password                   | Database instance password                                        | string                                                    | true     |         |
| location                   | Azure location                                                    | string                                                    | true     |         |
| resource_group             | Resource group                                                    | string                                                    | true     |         |
| writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false    |         |


#### writeConnectionSecretToRef
Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
| name      | The secret name which the cloud resource connection will be written to      | string | true     |         |
| namespace | The secret namespace which the cloud resource connection will be written to | string | false    |         |


## Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

Name | Description
------------ | -------------
SERVER_NAME | Mariadb server name |
DB_NAME | database instance name |
DB_USER | database instance username |
DB_PORT | database instance port |
DB_HOST | database instance host |
DB_PASSWORD | database instance password |