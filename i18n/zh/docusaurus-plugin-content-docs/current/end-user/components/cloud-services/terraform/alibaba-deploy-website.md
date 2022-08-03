---
title:  阿里云 DEPLOY-WEBSITE
---

## 描述

部署一个静态网站到对象存储服务，比如 ASW S3 或 阿里云 OSS。

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: alibaba-cloud-deploy-website
spec:
  components:
    - name: deploy-website-example
      type: deploy-website
      properties:
        bucket: deploy-website-example
        endpoint: oss-cn-hangzhou.aliyuncs.com
        static_web_url: 'https://github.com/cloudflare/cloudflare.github.io.git'
```

## 参数说明

### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值
------------|------------|------------|------------|------------
 bucket | OSS bucket name | string | false |
 endpoint | OSS bucket endpoint | string | true |
 static_web_url | The URL of the static website | string | false |
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
 URL | The URL of the website
