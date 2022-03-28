---
title:  Alibaba Cloud RDS
---

## Description

Terraform configuration for Alibaba Cloud RDS

## Samples

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

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 instance_name | RDS instance name | string | false |  
 account_name | RDS instance user account name | string | false |  
 allocate_public_connection | Whether to allocate public connection for a RDS instance. | bool | false |  
 security_ips | List of IP addresses allowed to access all databases of an instance | list(any) | false |  
 database_name | Database name | string | false |  
 password | RDS instance account password | string | true |  
 privilege | The privilege of one account access database. | string | false |  
 vswitch_id | The vswitch id of the RDS instance. If set, the RDS instance will be created in VPC, or it will be created in classic network. | string | false |  
 databases | The database list, each database is a map, the map contains the following attributes: name, character_set, description, like `[{"name":"test","character_set":"utf8","description":"test database"},]`. It conflicts with `database_name`. | list(map(string)) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description 
 ------------ | ------------- 
 RESOURCE_IDENTIFIER | The identifier of the resource
 DB_HOST | RDS Instance Host
 DB_PASSWORD | RDS Instance Password
 DATABASE_NAME | RDS Database Name
 DB_ID | RDS Instance ID
 DB_NAME | RDS Instance Name
 DB_USER | RDS Instance User
 DB_PORT | RDS Instance Port
 DB_PUBLIC_HOST | RDS Instance Public Host
