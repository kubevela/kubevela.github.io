---
title:  阿里云 OSS-WEBSITE
---

## 描述

使用阿里云 OSS 托管静态网站。

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: alibaba-cloud-oss-webstie
spec:
  components:
    - name: oss-website-example
      type: alibaba-oss-website
      properties:
        acl: public-read
        bucket: oss-website-example
        index_document: index.html
        error_document: 404.html
        writeConnectionSecretToRef:
          name: oss-website-conn
```

## 参数说明

### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 acl | OSS bucket ACL, supported 'private', 'public-read', 'public-read-write'. | string | false |
 bucket | OSS bucket name. | string | false |
 error_document | OSS bucket static website error document. | string | false |
 index_document | OSS bucket static website index document. | string | false |
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值
 ------------ | ------------- | ------------- | ------------- | -------------
 name | The secret name which the cloud resource connection will be written to. | string | true |
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述
 ------------ | -------------
 BUCKET_NAME |
 EXTRANET_ENDPOINT | OSS bucket external endpoint
 INTRANET_ENDPOINT | OSS bucket internal endpoint
