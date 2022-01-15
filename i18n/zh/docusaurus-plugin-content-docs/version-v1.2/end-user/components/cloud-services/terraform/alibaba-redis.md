---
title:  阿里云 Redis
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


### Properties

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
password | Redis 实例账号密码 | string | 是 |
instance_name | Redis 实例名 | string | 是 |
account_name | Redis 实例账号名 | string | 是 |
writeConnectionSecretToRef | 云资源连接信息即将写入的 secret 的信息 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | 否 |


#### writeConnectionSecretToRef

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
name | 云资源连接信息即将写入的 secret 的名字 | string | 是 |
namespace | 云资源连接信息即将写入的 secret 的 namespace | string | 否 |

## 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）。

名字 | 描述
------------ | -------------
REDIS_NAME | redis 实例名 |
REDIS_USER | redis 实例的用户名 |
REDIS_PASSWORD | redis 实例的密码 |
REDIS_REDIS_CONNECT_ADDRESS | redis 实例的链接地址 |
