---
title:  Elastic Cloud EC Deployment
---

## Description

Provides an Elastic Cloud deployment resource, which allows deployments to be created, updated, and deleted.

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

## Specification

### Properties

 Name | Description | Type | Required | Default
 ---- | ----------- | ---- | -------- | -------
 deployment_template_id | Deployment template identifier to create the deployment from, full list: https://www.elastic.co/guide/en/cloud/current/ec-regions-templates-instances.html. | string | false |
 name | Name of the deployment. | string | false |
 region | Elasticsearch Service region, full list: https://www.elastic.co/guide/en/cloud/current/ec-regions-templates-instances.html. | string | false |
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default
 ---- | ----------- | ---- | -------- | -------
 name | The secret name which the cloud resource connection will be written to. | string | true |
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description
 ------------ | -------------
 ES_CLOUD_ID |
 ES_HTTPS_ENDPOINT |
 ES_PASSWORD |
 ES_USERNAME |
 ES_VERSION |
