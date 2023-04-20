---
title:  VMware vSphere Folder
---

## Description

The vsphere_folder resource can be used to manage vSphere inventory folders.

## Examples

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

## Specification

### Properties

 Name | Description | Type | Required | Default
 ---- | ----------- | ---- | -------- | -------
 folder_path | The path of the folder to be created. | string | false |
 folder_type | The type of folder to create. Allowed options: `datacenter`, `host`, `vm`, `datastore` and `network`. | string | false |
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
 FOLDER |
