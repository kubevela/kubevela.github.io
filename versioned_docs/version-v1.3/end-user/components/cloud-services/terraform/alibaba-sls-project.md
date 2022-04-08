---
title:  Alibaba Cloud SLS-PROJECT
---

## Description

Terraform configuration for Alibaba Cloud SLS Project

## Samples

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-sls-project-sample
spec:
  components:
    - name: sample-sls-project
      type: alibaba-sls-project
      properties:
        name: kubevela-1112
        description: "Managed by KubeVela"

        writeConnectionSecretToRef:
          name: sls-project-conn
```

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 description | Description of security group | string | false |  
 name | Name of security group. It is used to create a new security group. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
