---
title:  阿里云 EIP
---

## 描述

用于部署阿里云弹性 IP 的组件说明

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


### Properties

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
name | EIP 名字， 默认：'TF-Module-EIP' | string | 否 |
bandwidth | EIP 带宽，单位 Mbps | number | 否 |
writeConnectionSecretToRef | 云资源连接信息即将写入的 secret 的信息 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | 否 |


#### writeConnectionSecretToRef

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
name | 云资源连接信息即将写入的 secret 的名字 | string | 是 |
namespace | 云资源连接信息即将写入的 secret 的 namespace | string | 否 |


## 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）。

名字 | 描述
------------ | -------------
EIP_ADDRESS | EIP 地址 |