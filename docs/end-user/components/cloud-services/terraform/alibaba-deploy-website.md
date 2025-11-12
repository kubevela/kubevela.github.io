---
title:  Alibaba Cloud DEPLOY-WEBSITE
---

## Description

Deploy a static website in Alibaba OSS.

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
        src_url: https://github.com/open-gitops/website.git
        prerequisite_cmd: apk add nodejs npm && npm install --global yarn
        build_cmd: yarn install && yarn build
        generated_dir: public
```

## Specification

### Properties

 Name | Description | Type | Required | Default
------------|------------|------------|------------|------------
 bucket | OSS bucket name | string | false |
 build_cmd | Commands for building website source code | string | false |
 endpoint | OSS bucket endpoint | string | true |
 generated_dir | Directory name of generated static content | string | true |
 prerequisite_cmd | Prerequisite commands to setup building env, support Alpine `apk` package manager | string | true |
 src_url | The URL of the website source code repository | string | true |
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
