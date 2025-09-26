---
title:  Alibaba Cloud SLB-ACL
---

## Description

Terraform-based module supports creating access control lists for load balancers.

## Specification


| Name | Description | Type | Required | Default |
|------|-------------|------|----------|---------|
| entry_list | A list of entry (IP addresses or CIDR blocks) to be added. At most 50 entries can be supported in one resource. It contains two sub-fields: `entry` (IP addresses or CIDR blocks) and `comment` (the comment of the entry). | `list(object({ entry = string, comment = string }))` | true | |
| ip_version | The IP Version of access control list. Valid values: `ipv4` or `ipv6`. Default is `ipv4`. | `string` | false | `"ipv4"` |
| name | The name of the access control list. | `string` | false | |
| region | (Deprecated from version 1.2.0) The region used to launch this module resources. | `string` | false | |
| writeConnectionSecretToRef | The secret which the cloud resource connection will be written to. | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false | |


#### writeConnectionSecretToRef

| Name | Description | Type | Required | Default |
|------|-------------|------|----------|---------|
| name | The secret name which the cloud resource connection will be written to. | `string` | true | |
| namespace | The secret namespace which the cloud resource connection will be written to. | `string` | false | |
