---
title:  AWS S3
---

## Description

Terraform configuration for AWS S3 bucket

## Samples

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

## Specification


### Properties

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
bucket                     | S3 bucket name                                                    | string                                                    | true     |         |
acl                        | S3 bucket ACL                                                     | string                                                    | true     |         |
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
BUCKET_NAME | S3 bucket name |
