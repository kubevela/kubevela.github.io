***kubevela订购aws s3中间过程演示***

------

> 本文介绍如何通过Kubevela订购aws s3 bucket，演示kubevela在订购aws s3过程中，涉及到的kubevela application示例，以及kubevela在订购s3时，terraform-controller处理configuration的中间状态。对于在阅读kubevela terraform-controller代码时，本文可以作为参考，加深理解源码。

# 创建aws-s3

## 示例介绍

使用官方aws-s3 comp，订购aws s3 bucket。通过观察中间过程，深入理解vela实现订购云资源的过程。可以对照这更好的read terraform controller代码。

![architecture.jpg](https://github.com/oam-dev/terraform-controller/blob/v0.2.13/docs/resources/architecture.jpg?raw=true)

## 演示步骤



### 环境配置

本示例演示环境是minikube+kubevela+terraform-controller，其版本信息如下：

| 组件                 | 版本                                                         |
| -------------------- | ------------------------------------------------------------ |
| minikube             | minikube version: v1.23.2<br/>commit: 0a0ad764652082477c00d51d2475284b5d39ceed |
| kubevela             | Version: v1.2.0-beta.2<br/>GitRevision: git-ad4b446<br/>GolangVersion: go1.16.10 |
| terraform-controller | oamdev/terraform-controller:0.2.14                           |

> 安装minikube、kubevela、terraform controller以及terraform-aws addon过程省略。

### 定义配置provider

***provider模板如下***：

```
apiVersion: terraform.core.oam.dev/v1beta1
kind: Provider
metadata:
  name: aws
  namespace: default
spec:
  credentials:
    secretRef:
      key: credentials
      name: aws-account-creds
      namespace: vela-system
    source: Secret
  provider: aws
  region: us-east-2
```

provider使用secret aws-account-creds，其存储了terraform访问aws api所需的ak/sk信息：

```
apiVersion: v1
data:
  credentials: xxx
kind: Secret
metadata:
  name: aws-account-creds
  namespace: vela-system

>>>base64 decode:
awsAccessKeyID: xxx
awsSecretAccessKey: xxx
```

> 不同云提供商认证方式不同，aws采用ak/sk方式，其他云请参考官方文档

截止到kubevela 最新的1.2版本为止，provider支持如下，***且都是hardcode编码的***：

```
const (
	alibaba CloudProvider = "alibaba"
	aws     CloudProvider = "aws"
	gcp     CloudProvider = "gcp"
	azure   CloudProvider = "azure"
	vsphere CloudProvider = "vsphere"
	ec      CloudProvider = "ec"
	ucloud  CloudProvider = "ucloud"
)
```

### 定义application

```
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: sml-aws-s3
  namespace: terraform-system
spec:
  components:
    - name: sml-aws-s3
      type: aws-s3
      properties:
        bucket: "sml-aws-s3"
        acl: "private"
        region: "us-west-1"    //替换provider默认的region
        providerRef:    //指定provider
          name: aws
          namespace: default
        writeConnectionSecretToRef:    //存储s3 url
          name: "sml-aws-s3-secret"
          namespace: terraform-system
```

kubectl apply即可

如果用户不知道aws-s3 component格式，可以使用命令查看：

```
#vela show aws-s3
```

详细component definition，请参考：

```
#kubectl get componentdefinition aws-s3 -n vela-system -o yaml
```



### 查看创建资源

#### configuration

kubectl apply application后，application controller会根据aws-s3 component definition模板，渲染出configuration workload。

其中aws-s3 component definition模板内容如下：

```
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: aws-s3
  namespace: vela-system
spec:
  schematic:
    terraform:
      configuration: |
        resource "aws_s3_bucket" "bucket-acl" {
          bucket = var.bucket
          acl    = var.acl
        }

        output "BUCKET_NAME" {
          value = aws_s3_bucket.bucket-acl.bucket_domain_name
        }

        variable "bucket" {
          description = "S3 bucket name"
          default = "vela-website"
          type = string
        }

        variable "acl" {
          description = "S3 bucket ACL"
          default = "private"
          type = string
        }
      deleteResource: true
      providerRef:
        name: aws
        namespace: default
      type: hcl
  workload:
    definition:
      apiVersion: terraform.core.oam.dev/v1beta1
      kind: Configuration
    type: configurations.terraform.core.oam.dev
```

可以看出，需要将上面comp definition模板内容渲染，最终输出configuration.

configuration内容如下：

```
apiVersion: terraform.core.oam.dev/v1beta1
kind: Configuration
metadata:
  name: littletiger-aws-s3
  namespace: terraform-system
spec:
  deleteResource: true
  hcl: |
    resource "aws_s3_bucket" "bucket-acl" {
      bucket = var.bucket
      acl    = var.acl
    }

    output "BUCKET_NAME" {
      value = aws_s3_bucket.bucket-acl.bucket_domain_name
    }

    variable "bucket" {
      description = "S3 bucket name"
      default = "vela-website"
      type = string
    }

    variable "acl" {
      description = "S3 bucket ACL"
      default = "private"
      type = string
    }
  providerRef:
    name: aws
    namespace: default
  region: us-west-1
  variable:
    acl: private
    bucket: littletiger-aws-s3
  writeConnectionSecretToRef:
    name: littletiger-aws-s3-secret
    namespace: terraform-system
```

紧接着，terraform controller会处理该configuration，具体逻辑可参考代码：terraform-controller/controllers/configuraton_controller.go

#### rbac

configuration controller reconcile会处理configuration event，其大致思路是：针对每个configuration，创建一个job，拉起一个terraform pod，将configuration内容转换后通过secret/cm方式挂载到pod中，在pod中启动terraform，根据配置在远端创建s3 bucket云资源。

因此，configuration controller需要针对拉起的job/pod，创建rbac/cm/secret等资源，给pod使用。

configuration controller首先创建rbac策略（cr/crb/sa）给tf job使用，rbac策略都是hard code的，内容示例如下：

```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  creationTimestamp: "2021-12-29T08:53:03Z"
  name: terraform-system-tf-executor-clusterrole
  resourceVersion: "8236412"
  uid: 5c128ba4-8a61-4f3c-a10a-b868e9355850
rules:
- apiGroups:
  - ""
  resources:
  - secrets
  verbs:
  - get
  - list
  - create
  - update
  - delete
- apiGroups:
  - coordination.k8s.io
  resources:
  - leases
  verbs:
  - get
  - create
  - update
  - delete

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  creationTimestamp: "2021-12-29T08:53:03Z"
  name: terraform-system-tf-executor-clusterrole-binding
  resourceVersion: "8236416"
  uid: 50881502-e923-4f14-badf-fe7f2ef2957b
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: terraform-system-tf-executor-clusterrole
subjects:
- kind: ServiceAccount
  name: tf-executor-service-account
  namespace: terraform-system

apiVersion: v1
kind: ServiceAccount
metadata:
  creationTimestamp: "2021-12-29T08:53:03Z"
  name: tf-executor-service-account
  namespace: terraform-system
  resourceVersion: "8236415"
  uid: 4dcbf6bc-3a6d-45ca-aa8b-b24110868c9a
secrets:
- name: tf-executor-service-account-token-vlr4h
```

#### configmap

controller会根据configuration内容，生成configmap，并挂在到tf pod，用于将渲染的tf模板放置到Pod /data目录下面，configmap内容如下：

```
apiVersion: v1
data:
  kubeconfig: ""
  main.tf: |
    resource "aws_s3_bucket" "bucket-acl" {
      bucket = var.bucket
      acl    = var.acl
    }

    output "BUCKET_NAME" {
      value = aws_s3_bucket.bucket-acl.bucket_domain_name
    }

    variable "bucket" {
      description = "S3 bucket name"
      default = "vela-website"
      type = string
    }

    variable "acl" {
      description = "S3 bucket ACL"
      default = "private"
      type = string
    }

    terraform {
      backend "kubernetes" {
        secret_suffix     = "littletiger-aws-s3"
        in_cluster_config = true
        namespace         = "vela-system"
      }
    }
kind: ConfigMap
metadata:
  name: tf-littletiger-aws-s3
  namespace: terraform-system
```



#### variable secret

controller会根据configuration中variable，以及provider中存储的认证信息，生成variable secret，作为pod env使用。示例如下：

```
apiVersion: v1
data:
  AWS_ACCESS_KEY_ID: xxx
  AWS_DEFAULT_REGION: xxx
  AWS_SECRET_ACCESS_KEY: xxx
  AWS_SESSION_TOKEN: ""
  TF_VAR_acl: cHJpdmF0ZQ==
  TF_VAR_bucket: bGl0dGxldGlnZXItYXdzLXMz
kind: Secret
metadata:
  name: variable-littletiger-aws-s3
  namespace: terraform-system
type: Opaque
```

其中TF_VAR开头的，是从configuration variable中提取的参数。其他从provider secret中拿到并转换格式的。



#### job/pod

上面创建的rbac/cm/secret都是给pod准备的，configuration会创建一个job，job模板也是hardcode的。job拉起pod启动后，直接执行：

```
terraform init && terraform apply -lock=false -auto-approve
```

即可拉取terraform aws镜像，初始化tf provider，并最终apply创建云资源。

进入pod中，查看有configmap转换后的terraform内容main.tf如下：

```
/data # cat main.tf
resource "aws_s3_bucket" "bucket-acl" {
  bucket = var.bucket
  acl    = var.acl
}

output "BUCKET_NAME" {
  value = aws_s3_bucket.bucket-acl.bucket_domain_name
}

variable "bucket" {
  description = "S3 bucket name"
  default = "vela-website"
  type = string
}

variable "acl" {
  description = "S3 bucket ACL"
  default = "private"
  type = string
}

terraform {
  backend "kubernetes" {
    secret_suffix     = "littletiger-aws-s3"
    in_cluster_config = true
    namespace         = "vela-system"
  }
}
```

执行成功terraform apply效果：

```
bash-5.1# terraform apply -lock=false -auto-approve

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # aws_s3_bucket.bucket-acl will be created
  + resource "aws_s3_bucket" "bucket-acl" {
      + acceleration_status         = (known after apply)
      + acl                         = "private"
      + arn                         = (known after apply)
      + bucket                      = "littletiger-aws-s3"
      + bucket_domain_name          = (known after apply)
      + bucket_regional_domain_name = (known after apply)
      + force_destroy               = false
      + hosted_zone_id              = (known after apply)
      + id                          = (known after apply)
      + region                      = (known after apply)
      + request_payer               = (known after apply)
      + tags_all                    = (known after apply)
      + website_domain              = (known after apply)
      + website_endpoint            = (known after apply)

      + versioning {
          + enabled    = (known after apply)
          + mfa_delete = (known after apply)
        }
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + BUCKET_NAME = (known after apply)
aws_s3_bucket.bucket-acl: Creating...
aws_s3_bucket.bucket-acl: Still creating... [10s elapsed]
aws_s3_bucket.bucket-acl: Still creating... [20s elapsed]
aws_s3_bucket.bucket-acl: Creation complete after 25s [id=littletiger-aws-s3]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

BUCKET_NAME = "littletiger-aws-s3.s3.amazonaws.com"
```



#### secret

s3订购成功后，controller会根据返回的数据，会创建secret保存s3的name，这个也是在application中“writeConnectionSecretToRef”定义名字，示例如下：

```
apiVersion: v1
data:
  BUCKET_NAME: bGl0dGxldGlnZXItYXdzLXMzLnMzLmFtYXpvbmF3cy5jb20=
kind: Secret
metadata:
  labels:
    created-by: terraform-controller
  name: littletiger-aws-s3-secret
  namespace: terraform-system
type: Opaque
```

用户即可根据这个BUCKET_NAME使用云资源。