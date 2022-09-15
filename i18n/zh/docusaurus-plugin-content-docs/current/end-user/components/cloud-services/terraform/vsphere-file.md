---
title:  VMware vSphere File Storage
---

## 描述

vSphere file 资源可以用来从 Terraform 运行的主机上传文件（如 ISO 和虚拟磁盘文件）到 vSphere datastore。

## 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vsphere-test-file
spec:
  components:
    - name: file-comp
      type: vsphere-file
      properties:
        datacenter: dc-01
        datastore: datastore-01
        source_file: /my/src/path/custom_ubuntu.vmdk
        destination_file: /my/dst/path/custom_ubuntu.vmdk
        create_directories: true
```

## 参数说明

### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值
 ---- | ----------- | ---- | -------- | -------
 create_directories | Create directories in destination_file path parameter on first apply if any are missing for copy operation. | bool | false |
 datacenter | The name of a datacenter to which the file will be uploaded. | string | false |
 datastore | The name of the datastore to which to upload the file. | string | false |
 destination_file | The path to where the file should be uploaded or copied to on the destination datastore in vSphere. | string | false |
 source_datacenter | The name of a datacenter from which the file will be copied. | string | false |
 source_datastore | The name of the datastore from which file will be copied. | string | false |
 source_file | The path to the file being uploaded from the Terraform host to the vSphere environment or copied within vSphere environment. | string | false |
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
 DATACENTOR |
 DATASTORE |
