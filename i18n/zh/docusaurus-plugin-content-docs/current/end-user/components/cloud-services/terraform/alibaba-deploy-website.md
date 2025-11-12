---
title:  阿里云 DEPLOY-WEBSITE
---

## 描述

部署一个静态网站到阿里云 OSS。

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
        bucket: static-website-example
        endpoint: oss-cn-hangzhou.aliyuncs.com
        src_url: https://github.com/open-gitops/website.git
        prerequisite_cmd: apk add nodejs npm && npm install --global yarn
        build_cmd: yarn install && yarn build
        generated_dir: public
```

## 参数说明

### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值
------------|------------|------------|------------|------------
 bucket | OSS bucket name | string | false |
 build_cmd | Commands for building website source code | string | false |
 endpoint | OSS bucket endpoint | string | true |
 generated_dir | Directory name of generated static content | string | true |
 prerequisite_cmd | Prerequisite commands to setup building env, support Alpine `apk` package manager | string | true |
 src_url | The URL of the website source code repository | string | true |
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
