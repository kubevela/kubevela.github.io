---
title:  阿里云 SLS-PROJECT
---

## 描述

用于部署阿里云 SLS Project 的组件说明

## 示例

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

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 description | Description of security group | string | false |  
 name | Name of security group. It is used to create a new security group. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
