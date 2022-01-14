---
title:  Alibaba Cloud OSS
---

## Description

Terraform configuration for Alibaba Cloud OSS object

## Samples

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

## Specification


### Properties

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
bucket | OSS bucket name | string | true |
acl | OSS bucket ACL, supported 'private', 'public-read', 'public-read-write' | string | true |
writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |


#### writeConnectionSecretToRef

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
name | The secret name which the cloud resource connection will be written to | string | true |
namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


## Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

Name | Description
------------ | -------------
BUCKET_NAME | OSS bucket name |
