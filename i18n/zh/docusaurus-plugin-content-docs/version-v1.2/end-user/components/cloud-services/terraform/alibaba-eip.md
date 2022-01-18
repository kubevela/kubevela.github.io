---
title:  阿里云 EIP
---

## 描述

用于部署阿里云 Elastic IP 的组件说明

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: provision-cloud-resource-eip
spec:
  components:
    - name: sample-eip
      type: alibaba-eip
      properties:
        writeConnectionSecretToRef:
          name: eip-conn
```

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | Name to be used on all resources as prefix. Default to 'TF-Module-EIP'. | string | true |  
 bandwidth | Maximum bandwidth to the elastic public network, measured in Mbps (Mega bit per second). | number | true |  
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
 EIP_ADDRESS | The elastic ip address.
