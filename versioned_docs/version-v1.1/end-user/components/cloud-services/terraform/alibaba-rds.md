---
title:  Alibaba Cloud RDS
---

## Description

Terraform configuration for Alibaba Cloud RDS object

## Sample

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
password | RDS instance account password | string | true |
instance_name | RDS instance name | string | true |
account_name | RDS instance user account name | string | true |
writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |


#### writeConnectionSecretToRef

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
name | The secret name which the cloud resource connection will be written to | string | true |
namespace | The secret namespace which the cloud resource connection will be written to | string | false |

## Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

Name | Description
------------ | -------------
DB_NAME | RDS instance name |
DB_USER | RDS instance username |
DB_PORT | RDS instance port |
DB_HOST | RDS instance host |
DB_PASSWORD | RDS instance password |
