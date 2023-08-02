---
title:  VMware vSphere Folder
---

## 描述

vSphere folder 资源可以用于管理 vSphere inventory 文件夹。

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vsphere-test-folder
spec:
  components:
    - name: folder-comp
      type: vsphere-folder
      properties:
        folder_path: terraform-test-folder
        folder_type: vm
```

## 参数说明

### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值
 ---- | ----------- | ---- | -------- | -------
 folder_path | The path of the folder to be created. | string | false |
 folder_type | The type of folder to create. Allowed options: `datacenter`, `host`, `vm`, `datastore` and `network`. | string | false |
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
 FOLDER |
