---
title:  Terraform 组件
---

在自定义组件时，集成云资源往往是最频繁使用的一类需求。不管你要集成阿里云、AWS 还是 GCP 甚至 VMWare，我们推荐你使用开源工具 Terraform 来完成集成操作。

本章节，将专门为你介绍这类需求如何开发。我们以阿里云的对象存储(OSS)，作为例子来进行讲解。

它的大致流程如下：
1. 熟悉各云服务商的鉴权机制，准备相关的 `secret` 和 `token` 等必要信息。
2. Terraform 使用 `Provider` 对象，完成对应云服务商的权限校验过程。
3. KubeVela 通过 Terraform 控制器来拉起对应的云资源。


### 安装 Terraform 控制器

从最新的 [发布列表](https://github.com/oam-dev/terraform-controller/releases) 里下载并安装，比如 `terraform-controller-chart-0.1.8.tgz`。

```shell
$ helm install terraform-controller terraform-controller-0.1.8.tgz
NAME: terraform-controller
LAST DEPLOYED: Mon Apr 26 15:55:35 2021
NAMESPACE: default
STATUS: deployed
REVISION: 1
TEST SUITE: None
```

### 配置阿里云鉴权
以下是阿里云的鉴权相关步骤，其它云服务商同理：

```
$ export ALICLOUD_ACCESS_KEY=xxx; export ALICLOUD_SECRET_KEY=yyy
If you'd like to use Alicloud Security Token Service, also export ALICLOUD_SECURITY_TOKEN.

$ export ALICLOUD_SECURITY_TOKEN=zzz
$ sh hack/prepare-alibaba-credentials.sh

$ kubectl get secret -n vela-system
NAME                                              TYPE                                  DATA   AGE
alibaba-account-creds                             Opaque                                1      11s

$ kubectl apply -f examples/alibaba/provider.yaml
provider.terraform.core.oam.dev/default created
```

`provider.yaml` 请使用示例：

```
apiVersion: terraform.core.oam.dev/v1beta1
kind: Provider
metadata:
  name: default
spec:
  provider: alibaba
  region: cn-beijing
  credentials:
    source: Secret
    secretRef:
      namespace: vela-system
      name: alibaba-account-creds
      key: credentials
```

### 云资源关联 Provider

Terraform 可以编写、应用一个 configuration_hcl_oss.yaml 来配置阿里云的 OSS 存储 Bukcet。它会去自动关联 Kubernetes 集群里的默认 `Provider`，即上一步的 `name: default` YMAL 文件。

```
apiVersion: terraform.core.oam.dev/v1beta1
kind: Configuration
metadata:
  name: alibaba-oss
spec:
  hcl: |
    resource "alicloud_oss_bucket" "bucket-acl" {
      bucket = var.bucket
      acl = var.acl
    }

    output "BUCKET_NAME" {
      value = "${alicloud_oss_bucket.bucket-acl.bucket}.${alicloud_oss_bucket.bucket-acl.extranet_endpoint}"
    }

    variable "bucket" {
      description = "OSS bucket name"
      default = "vela-website"
      type = string
    }

    variable "acl" {
      description = "OSS bucket ACL, supported 'private', 'public-read', 'public-read-write'"
      default = "private"
      type = string
    }

  variable:
    bucket: "vela-website"
    acl: "private"

  writeConnectionSecretToRef:
    name: oss-conn
    namespace: default
```
然后部署：

```
$ kubectl apply -f configuration_hcl_oss.yaml

$ kubectl get configuration.terraform.core.oam.dev
NAME         AGE
alibaba-oss   1h

$ kubectl get configuration.terraform.core.oam.dev alibaba-oss -o yaml
apiVersion: terraform.core.oam.dev/v1beta1
kind: Configuration
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"terraform.core.oam.dev/v1beta1","kind":"Configuration","metadata":{"annotations":{},"name":"alibaba-oss","namespace":"default"},"spec":{"JSON":"{\n  \"resource\": {\n    \"alicloud_oss_bucket\": {\n      \"bucket-acl\": {\n        \"bucket\": \"${var.bucket}\",\n        \"acl\": \"${var.acl}\"\n      }\n    }\n  },\n  \"output\": {\n    \"BUCKET_NAME\": {\n      \"value\": \"${alicloud_oss_bucket.bucket-acl.bucket}.${alicloud_oss_bucket.bucket-acl.extranet_endpoint}\"\n    }\n  },\n  \"variable\": {\n    \"bucket\": {\n      \"default\": \"poc\"\n    },\n    \"acl\": {\n      \"default\": \"private\"\n    }\n  }\n}\n","variable":{"acl":"private","bucket":"vela-website"},"writeConnectionSecretToRef":{"name":"oss-conn","namespace":"default"}}}
  creationTimestamp: "2021-04-02T08:17:08Z"
  generation: 2
spec:
  ...
  variable:
    acl: private
    bucket: vela-website
  writeConnectionSecretToRef:
    name: oss-conn
    namespace: default
status:
  outputs:
    BUCKET_NAME:
      type: string
      value: vela-website.oss-cn-beijing.aliyuncs.com
  state: provisioned
```

可以看到 OSS bucket 已经被分配出来。

```
$ ossutil ls oss://
CreationTime                                 Region    StorageClass    BucketName
2021-04-10 00:42:09 +0800 CST        oss-cn-beijing        Standard    oss://vela-website
Bucket Number is: 1

0.146789(s) elapsed
```

### 自定义 OSS 云资源组件
当前面的步骤全部完成之后，最后我们只需要继续使用组件定义，将这个 `alibaba-oss` 引入，作为后续应用部署计划的内置能力即可。

```
apiVersion: core.oam.dev/v1alpha2
kind: ComponentDefinition
metadata:
  name: alibaba-oss
  annotations:
    definition.oam.dev/description: Terraform configuration for Alibaba Cloud OSS object
    type: terraform
spec:
  workload:
    definition:
      apiVersion: terraform.core.oam.dev/v1beta1
      kind: Configuration
  schematic:
    terraform:
      configuration: |
        resource "alicloud_oss_bucket" "bucket-acl" {
          bucket = var.bucket
          acl = var.acl
        }

        output "BUCKET_NAME" {
          value = "${alicloud_oss_bucket.bucket-acl.bucket}.${alicloud_oss_bucket.bucket-acl.extranet_endpoint}"
        }

        variable "bucket" {
          description = "OSS bucket name"
          default = "vela-website"
          type = string
        }

        variable "acl" {
          description = "OSS bucket ACL, supported 'private', 'public-read', 'public-read-write'"
          default = "private"
          type = string
        }
```