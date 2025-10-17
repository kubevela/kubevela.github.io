---
title:  Alibaba Cloud EIP
---

## Description

Bind and unbind hundreds of EIPs to multiple cloud resources with one click based on Terraform.

## Examples

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

## Specification

### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 bandwidth | Maximum bandwidth to the elastic public network, measured in Mbps (Mega bit per second). | number | false |  
 computed_instances | List of ECS, NAT, SLB or NetworkInterface instances. See Instance Schema section below. | `list(object({ instance_type = string, instance_ids = list(string), private_ips = list(string) }))` | false |
 create | Whether to create an EIP instance and whether to associate EIP with other resources. | bool | false |  
 description | Description of the EIP, This description can have a string of 2 to 256 characters, It cannot begin with http:// or https://. Default value is null. | string | false |  
 instance_charge_type | (Deprecated from version 1.3.0) Elastic IP instance charge type. Use payment_type instead. | string | false |  
 instances | A list of instances found by the condition. If this parameter is used, `number_of_eips` will be ignored. See Instance Schema section below. | `list(object({ instance_type = string, instance_ids = list(string), private_ips = list(string) }))` | false |
 internet_charge_type | Internet charge type of the EIP, Valid values are `PayByBandwidth`, `PayByTraffic`. | string | false |  
 isp | The line type of the Elastic IP instance. | string | false |  
 name | Name to be used on all resources as prefix. Default to 'TF-Module-EIP'. The final default name would be TF-Module-EIP001, TF-Module-EIP002 and so on. | string | false |  
 number_of_computed_instances | The number of instances created by calling the API. If this parameter is used, \`number_of_eips\` will be ignored. | number | false |  
 number_of_eips | The number of eip to be created. This parameter will be ignored if \`number_of_computed_instances\` and \`instances\` is used. | number | false |  
 payment_type | The billing method of the NAT gateway. | string | false |  
 period | The duration that you will buy the resource, in month. | number | false |  
 profile | (Deprecated from version 1.2.0) The profile name as set in the shared credentials file. If not set, it will be sourced from the ALICLOUD_PROFILE environment variable. | string | false |  
 resource_group_id | The Id of resource group which the eip belongs. | string | false |  
 shared_credentials_file | (Deprecated from version 1.2.0) This is the path to the shared credentials file. If this is not set and a profile is specified, $HOME/.aliyun/config.json will be used. | string | false |  
 skip_region_validation | (Deprecated from version 1.2.0) Skip static validation of region ID. Used by users of alternative AlibabaCloud-like APIs or users w/ access to regions that are not public (yet). | bool | false |  
 tags | A mapping of tags to assign to the EIP instance resource. | map(string) | false |  
 use_num_suffix | Always append numerical suffix to instance name, even if number_of_instances is 1. | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  

### Instance Schema

#### Instance Object Structure

```hcl
list(object({
  instance_type = string
  instance_ids  = list(string)
  private_ips   = list(string)
}))
```

#### Instance Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| instance_type | string | Yes | The type of instance (ECS, NAT, SLB, NetworkInterface) |
| instance_ids | list(string) | Yes | List of instance IDs to associate with EIP |
| private_ips | list(string) | No | List of private IPs to associate with EIP |

#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to. | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to. | string | false |  
