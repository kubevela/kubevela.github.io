---
title:  Alibaba Cloud OSS
---

# 描述

Terraform configuration for Alibaba Cloud OSS object

# 示例

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

# 参数说明


## Properties

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
bucket | OSS bucket name | string | true |
acl | OSS bucket ACL, supported 'private', 'public-read', 'public-read-write' | string | true |
writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |


### writeConnectionSecretToRef

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
name | The secret name which the cloud resource connection will be written to | string | true |
namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
