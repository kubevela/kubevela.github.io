---
title:  Terraform 组件
---

对云资源的集成需求往往是最频繁出现，比如你可能希望数据库、中间件等服务使用阿里云、AWS 等云厂商的，以获得生产级别的可用性并免去运维的麻烦。
Terraform 是目前业内支持云资源最广泛也最受欢迎的组件，KubeVela 对 Terraform 进行了额外的支持，使得用户可以通过 Kubernetes CRD 的方式配合
Terraform 使用任意的云资源。

为了使最终用户能够[部署和消费云资源](../../end-user/components/cloud-services/provider-and-consume-cloud-services)，管理员需要：
1）配置云提供商的鉴权信息；2）当用户的要求超出了 [内置云资源的能力](../../end-user/components/cloud-services/provider-and-consume-cloud-services)
，要为云资源准备 ComponentDefinitions。

### 配置云服务商的鉴权

为了使 Terraform 能够部署云资源，需要配置云服务商的鉴权信息。

以下示例以阿里云为例，对于其他云供应商，请参考 [Terraform controller getting started](https://github.com/oam-dev/terraform-controller/blob/master/getting-started.md)。

```shell
$ export ALICLOUD_ACCESS_KEY=xxx; export ALICLOUD_SECRET_KEY=yyy
```

If you'd like to use Alicloud Security Token Service, also export `ALICLOUD_SECURITY_TOKEN`.
```shell
$ export ALICLOUD_SECURITY_TOKEN=zzz
```

```
$ sh https://raw.githubusercontent.com/oam-dev/terraform-controller/master/hack/prepare-alibaba-credentials.sh

$ kubectl get secret -n vela-system
NAME                                              TYPE                                  DATA   AGE
alibaba-account-creds                             Opaque                                1      11s

$ kubectl apply -f https://raw.githubusercontent.com/oam-dev/terraform-controller/master/examples/alibaba/provider.yaml
provider.terraform.core.oam.dev/default created
```

## 为云资源开发 ComponentDefinition

### 阿里云

以 [弹性 IP](https://help.aliyun.com/document_detail/120192.html)为例。

#### 为云资源开发一个 ComponentDefinition

这是 Terraform ComponentDefinition 的脚手架。你只需要修改三个字段：`metadata.name`，`metadata.annotations.definition.oam.dev/description`
和 `spec.schematic.terraform.configuration`。


```yaml
apiVersion: core.oam.dev/v1alpha2
kind: ComponentDefinition
metadata:
  name: # 1. ComponentDefinition name, like `alibaba-oss`
  namespace: {{.Values.systemDefinitionNamespace}}
  annotations:
    definition.oam.dev/description: # 2. description, like `Terraform configuration for Alibaba Cloud OSS object`
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
        # 3. The developed Terraform HCL
```

这里阿里云 EIP 的完整的 ComponentDefinition，我们热烈欢迎你将扩展的云资源的 ComponentDefinition 贡献到 [oam-dev/kubevela](https://github.com/oam-dev/kubevela/tree/master/charts/vela-core/templates/definitions)。

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

#### 验证

你可以通过 `vela show` 命令快速验证 ComponentDefinition。

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

如果表格能正常出来，ComponentDefinition 应该就可以工作了。更进一步，你可以通过文档[部署云资源](../../end-user/components/cloud-services/provider-and-consume-cloud-services)创建一个实际的 EIP 来验证。

