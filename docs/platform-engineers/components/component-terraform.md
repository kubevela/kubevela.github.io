---
title: Terraform Components
---

To enable end users to [provision and consume cloud resources](../../end-user/components/cloud-services/provider-and-consume-cloud-services),
platform engineers need to prepare ComponentDefinitions for cloud resources if end users' requirements are beyond the
[built-in capabilities](../../end-user/components/cloud-services/provider-and-consume-cloud-services#supported-cloud-resource-list).

Here is the guide to create Terraform typed ComponentDefinitions of cloud resources for cloud providers Alibaba Cloud, AWS and Azure.

# Alibaba Cloud

Take [Elastic IP](https://www.alibabacloud.com/help/doc-detail/36016.htm) as an example.

## Develop a Terraform resource or module

Create a Terraform resource or module for Alibaba Cloud EIP resource and store it in a GitHub repo like https://github.com/oam-dev/terraform-alibaba-eip.git.

## Generate ComponentDefinition

```shell
$ vela def init eip --type component --provider alibaba --desc "Terraform configuration for Alibaba Cloud Elastic IP" --git https://github.com/oam-dev/terraform-alibaba-eip.git
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: Terraform configuration for Alibaba Cloud Elastic
      IP
  creationTimestamp: null
  labels:
    type: terraform
  name: alibaba-eip
  namespace: vela-system
spec:
  schematic:
    terraform:
      configuration: https://github.com/oam-dev/terraform-alibaba-eip.git
      type: remote
  workload:
    definition:
      apiVersion: terraform.core.oam.dev/v1beta1
      kind: Configuration
status: {}
```

The ComponentDefinition for Alibaba Cloud EIP is generated. You are warmly welcome to contribute this extended cloud
resource ComponentDefinition to [oam-dev/catalog](https://github.com/oam-dev/catalog/tree/master/addons/terraform-alibaba/definitions).

## Verify

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
the doc [Provision cloud resources](../../end-user/components/cloud-services/provider-and-consume-cloud-services#provision-cloud-resources).

## Generate documentation

You are encouraged to generate the documentation for your ComponentDefinition and submit it to [KubeVela official site](https://github.com/oam-dev/kubevela.io).

```shell
$ vela def doc-gen alibaba-eip -n vela-system
Generated docs for alibaba-eip in ./kubevela.io/docs/end-user/components/cloud-services/terraform/alibaba-eip.md
```

Move the file generated to oam-dev/catalog repo. Follow the [contribution guide](https://github.com/oam-dev/kubevela.io#contributing-to-kubevela-en-docs) to submit the doc. 

# AWS, Azure and other cloud providers

This only difference from Alibaba Cloud lies in the section of [Generate ComponentDefinition](#generate-componentdefinition).
Please set `--provider` as `aws` or `azure` to generate the ComponentDefinition for an AWS or Azure cloud resource.

```shell
$ vela def init -h

Usage:
  vela def init DEF_NAME [flags]

Examples:
# Command below initiate a typed ComponentDefinition named vswitch from Alibaba Cloud.
> vela def init vswitch --type component --provider alibaba --desc xxx --git https://github.com/kubevela-contrib/terraform-modules.git --path alibaba/vswitch

Flags:
  -d, --desc string            Specify the description of the new definition.
      --git string             Specify which git repository the configuration(HCL) is stored in. Valid when --provider/-p is set.
  -h, --help                   help for init
      --path string            Specify which path the configuration(HCL) is stored in the Git repository. Valid when --git is set.
  -p, --provider alibaba       Specify which provider the cloud resource definition belongs to. Only `alibaba`, `aws`, `azure` are supported.
```
