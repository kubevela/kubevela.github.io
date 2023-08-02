---
title:  Elastic Cloud Deployment
---

## Description

提供一个 Elastic Cloud deployment 资源，允许创建、更新和删除 deployment。

## Examples

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ec-deploy
spec:
  components:
    - name: ec-deploy-comp
      type: elastic-ec-deployment
      properties:
        name: test-app
        region: aws-ap-east-1
        deployment_template_id: aws-compute-optimized-v3
        version: 8.3.3
```

## 参数说明

### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值
 ---- | ----------- | ---- | -------- | -------
 deployment_template_id | Deployment template identifier to create the deployment from, full list: https://www.elastic.co/guide/en/cloud/current/ec-regions-templates-instances.html. | string | false |
 name | Name of the deployment. | string | false |
 region | Elasticsearch Service region, full list: https://www.elastic.co/guide/en/cloud/current/ec-regions-templates-instances.html. | string | false |
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值
 ---- | ----------- | ---- | -------- | -------
 name | The secret name which the cloud resource connection will be written to. | string | true |
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述
 ------------ | -------------
 ES_CLOUD_ID |
 ES_HTTPS_ENDPOINT |
 ES_PASSWORD |
 ES_USERNAME |
 ES_VERSION |
