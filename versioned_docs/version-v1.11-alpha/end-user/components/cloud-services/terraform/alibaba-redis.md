---
title:  Alibaba Cloud REDIS
---

## Description

Terraform configuration for Alibaba Cloud Redis.

## Examples

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


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 account_name | Redis instance user account name. | string | false |  
 instance_name | Redis instance name. | string | false |  
 password | RDS instance account password. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to. | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description 
 ------------ | ------------- 
 REDIS_CONNECT_ADDRESS | Redis connect address
 REDIS_NAME | Redis instance name
 REDIS_PASSWORD | Redis password
 REDIS_USER | Redis user
 RESOURCE_IDENTIFIER | The identifier of the resource
