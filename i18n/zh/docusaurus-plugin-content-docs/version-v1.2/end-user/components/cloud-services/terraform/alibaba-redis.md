---
title:  阿里云 REDIS
---

## 描述

用于部署阿里云 Redis 的组件说明

## 示例

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

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 instance_name | Redis instance name | string | true |  
 account_name | Redis instance user account name | string | true |  
 password | RDS instance account password | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述 
 ------------ | ------------- 
 RESOURCE_IDENTIFIER | The identifier of the resource
 REDIS_NAME | Redis instance name
 REDIS_CONNECT_ADDRESS | Redis connect address
 REDIS_USER | Redis user
 REDIS_PASSWORD | Redis password
