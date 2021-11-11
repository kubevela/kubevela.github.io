---
title:  Alibaba Cloud Redis
---

## Description

Terraform configuration for Alibaba Cloud Redis object

## Sample

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: redis-cloud-source
spec:
  components:
    - name: sample-redis
      type: alibaba-redis
      properties:
        instance_name: oam-redis
        account_name: oam
        password: Xyfff83jfewGGfaked
        writeConnectionSecretToRef:
          name: redis-conn
```

## Specification

### Properties

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
password | Redis instance account password | string | true |
instance_name | Redis instance name | string | true |
account_name | Redis instance user account name | string | true |
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
REDIS_NAME | redis instance name |
REDIS_USER | redis instance username |
REDIS_PASSWORD | redis instance password |
REDIS_REDIS_CONNECT_ADDRESS | redis connect address |
