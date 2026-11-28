---
title:  Alibaba Cloud DEPLOY-WEBSITE
---

## Description

Deploy a static website in object stroage, like S3 or OSS.

## Examples

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: alibaba-cloud-deploy-website
spec:
  components:
    - name: static-website-example
      type: deploy-website
      properties:
        bucket: static-website-example
        endpoint: oss-cn-hangzhou.aliyuncs.com
        static_web_url: 'https://github.com/cloudflare/cloudflare.github.io.git'
```

## Specification

### Properties

 Name | Description | Type | Required | Default
------------|------------|------------|------------|------------
 bucket | OSS bucket name | string | false |
 endpoint | OSS bucket endpoint | string | true |
 static_web_url | The URL of the static website | string | false |
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default
 ------------ | ------------- | ------------- | ------------- | -------------
 name | The secret name which the cloud resource connection will be written to | string | true |
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description
 ------------ | -------------
 URL | The URL of the website
