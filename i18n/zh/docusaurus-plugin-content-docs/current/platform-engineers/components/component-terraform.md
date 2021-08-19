---
title:  Terraform 组件
---

对云资源的集成需求往往是最频繁出现，比如你可能希望数据库、中间件等服务使用阿里云、AWS 等云厂商的，以获得生产级别的可用性并免去运维的麻烦。Terraform 是目前业内支持云资源最广泛也最受欢迎的组件，KubeVela 对 Terraform 进行了额外的支持，使得用户可以通过 Kubernetes CRD 的方式配合 Terraform 使用任意的云资源。

本章节，将专门为你介绍如何通过 KubeVela 以及 Terraform 来实现自定义的云资源组件。我们以阿里云的对象存储(OSS)，作为例子来进行讲解。

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

```yaml
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