---
title:  阿里云 VPC
---

## 描述

用于部署阿里云 VPC 的组件说明

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-vpc-sample
spec:
  components:
    - name: sample-vpc
      type: alibaba-vpc
      properties:
        vpc_cidr: "172.16.0.0/12"
        writeConnectionSecretToRef:
          name: vpc-conn
```

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 vpc_cidr | The cidr block used to launch a new vpc. | string | false |  
 vpc_description | The vpc description used to launch a new vpc. | string | false |  
 vpc_name | The vpc name used to launch a new vpc. | string | false |  
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
 VPC_ID | The vpc id of the newly created vpc.
