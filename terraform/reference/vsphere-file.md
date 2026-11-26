---
title:  VMware vSphere File Storage
---

## Description

The vsphere-file resource can be used to upload files (such as ISOs and virtual disk files) from the host machine that Terraform is running on to a datastore.

## Examples

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

## Specification

### Properties

 Name | Description | Type | Required | Default
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

 Name | Description | Type | Required | Default
 ---- | ----------- | ---- | -------- | -------
 name | The secret name which the cloud resource connection will be written to. | string | true |
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description
 ------------ | -------------
 DATACENTOR |
 DATASTORE |
