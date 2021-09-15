---
title: Terraform Component
---

To enable end users to [provision and consume cloud resources](../../end-user/components/cloud-services/provider-and-consume-cloud-services),
platform engineers need to prepare ComponentDefinitions for cloud resources if end users' requirements are beyond the
[built-in capabilities](../../end-user/components/cloud-services/provider-and-consume-cloud-services#supported-cloud-resource-list).

## Develop a ComponentDefinition for a cloud resource

### Alibaba Cloud

Take [Elastic IP](https://www.alibabacloud.com/help/doc-detail/36016.htm) as an example.

#### Develop a Terraform resource or module for the cloud resource

We recommend you to search the required cloud resource module in [Terraform official module registry](https://registry.terraform.io/browse/modules).
If no luck, you can create a Terraform resource or module yourself per
[Terraform Alibaba Cloud Provider specifications](https://registry.terraform.io/providers/aliyun/alicloud/latest/docs).

```terraform
module "eip" {
  source = "github.com/zzxwill/terraform-alicloud-eip"
  name = var.name
  bandwidth = var.bandwidth
}

variable "name" {
  description = "Name to be used on all resources as prefix. Default to 'TF-Module-EIP'."
  default = "TF-Module-EIP"
  type = string
}

variable "bandwidth" {
  description = "Maximum bandwidth to the elastic public network, measured in Mbps (Mega bit per second)."
  type = number
  default = 5
}

output "EIP_ADDRESS" {
  description = "The elastic ip address."
  value       = module.eip.this_eip_address.0
}
```

For Alibaba Cloud EIP, here is the complete ComponentDefinition. You are warmly welcome to contribute this extended cloud
resource ComponentDefinition to [oam-dev/kubevela](https://github.com/oam-dev/kubevela/tree/master/charts/vela-core/templates/definitions).

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: ComponentDefinition
metadata:
  name: alibaba-eip
  namespace: {{.Values.systemDefinitionNamespace}}
  annotations:
    definition.oam.dev/description: Terraform configuration for Alibaba Cloud Elastic IP
  labels:
    type: terraform
spec:
  workload:
    definition:
      apiVersion: terraform.core.oam.dev/v1beta1
      kind: Configuration
  schematic:
    terraform:
      configuration: |
        module "eip" {
          source = "github.com/zzxwill/terraform-alicloud-eip"
          name = var.name
          bandwidth = var.bandwidth
        }

        variable "name" {
          description = "Name to be used on all resources as prefix. Default to 'TF-Module-EIP'."
          default = "TF-Module-EIP"
          type = string
        }

        variable "bandwidth" {
          description = "Maximum bandwidth to the elastic public network, measured in Mbps (Mega bit per second)."
          type = number
          default = 5
        }

        output "EIP_ADDRESS" {
          description = "The elastic ip address."
          value       = module.eip.this_eip_address.0
        }

```

#### Verify

You can quickly verify the ComponentDefinition by command `vela show`.

```shell
$ vela show alibaba-eip
# Properties
+----------------------------+------------------------------------------------------------------------------------------+-----------------------------------------------------------+----------+---------+
|            NAME            |                                       DESCRIPTION                                        |                           TYPE                            | REQUIRED | DEFAULT |
+----------------------------+------------------------------------------------------------------------------------------+-----------------------------------------------------------+----------+---------+
| name                       | Name to be used on all resources as prefix. Default to 'TF-Module-EIP'.                  | string                                                    | true     |         |
| bandwidth                  | Maximum bandwidth to the elastic public network, measured in Mbps (Mega bit per second). | number                                                    | true     |         |
| writeConnectionSecretToRef | The secret which the cloud resource connection will be written to                        | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false    |         |
+----------------------------+------------------------------------------------------------------------------------------+-----------------------------------------------------------+----------+---------+


## writeConnectionSecretToRef
+-----------+-----------------------------------------------------------------------------+--------+----------+---------+
|   NAME    |                                 DESCRIPTION                                 |  TYPE  | REQUIRED | DEFAULT |
+-----------+-----------------------------------------------------------------------------+--------+----------+---------+
| name      | The secret name which the cloud resource connection will be written to      | string | true     |         |
| namespace | The secret namespace which the cloud resource connection will be written to | string | false    |         |
+-----------+-----------------------------------------------------------------------------+--------+----------+---------+
```

If the tables display, the ComponentDefinition should work. To take a step further, you can verify it by provision an actual EIP instance per
the doc [Provision cloud resources](../../end-user/components/cloud-services/provider-and-consume-cloud-services#provision-cloud-resources
).
