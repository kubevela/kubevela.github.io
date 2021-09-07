---
title:  阿里云 RDS
---

## 描述

用于部署阿里云 RDS 的组件说明

## 示例

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

## 参数说明


### Properties

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
password | RDS instance account password | string | true |
instance_name | RDS instance name | string | true |
account_name | RDS instance user account name | string | true |
writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |


#### writeConnectionSecretToRef

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
name | The secret name which the cloud resource connection will be written to | string | true |
namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
