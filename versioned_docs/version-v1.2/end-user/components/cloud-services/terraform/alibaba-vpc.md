---
title:  Alibaba Cloud VPC
---

## Description

Terraform configuration for Alibaba Cloud VPC

## Samples

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

## Specification


### Properties

Name | Description | Type | Required | Default 
------------ | ------------- | ------------- | ------------- | ------------- 
 vpc_name | The vpc name used to launch a new vpc. | string | true |  
 vpc_description | The vpc description used to launch a new vpc. | string | true |  
 vpc_cidr | The cidr block used to launch a new vpc. | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

Name | Description | Type | Required | Default 
------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

Name | Description
------------ | ------------- 
 VPC_ID | The vpc id of the newly created vpc.
