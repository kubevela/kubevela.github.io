---
title:  阿里云 OSS
---

## 描述

用于部署阿里云 OSS 的组件说明

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: oss-cloud-source
spec:
  components:
    - name: sample-oss
      type: alibaba-oss
      properties:
        bucket: vela-website
        acl: private
        writeConnectionSecretToRef:
          name: oss-conn
```

## 参数说明


### Properties

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
bucket | OSS bucket 名字 | string | 是 |
acl | OSS bucket ACL, 支持 'private', 'public-read', 'public-read-write' | string | 是 |
writeConnectionSecretToRef | 云资源连接信息即将写入的 secret 的信息 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | 否 |


#### writeConnectionSecretToRef

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
name | 云资源连接信息即将写入的 secret 的名字 | string | 是 |
namespace | 云资源连接信息即将写入的 secret 的 namespace | string | 否 |
