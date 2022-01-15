---
title:  AWS S3
---

## 描述

用于部署 AWS S3 的组件说明

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: s3-cloud-source
spec:
  components:
    - name: sample-s3
      type: aws-s3
      properties:
        bucket: vela-website-20211019
        acl: private

        writeConnectionSecretToRef:
          name: s3-conn
```

## 参数说明


### Properties

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
bucket                     | S3 bucket 名字                                                    | string                                                    | 是     |         |
acl                        | S3 bucket ACL                                                     | string                                                    | 是     |         |
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
BUCKET_NAME | S3 bucket 名字 |