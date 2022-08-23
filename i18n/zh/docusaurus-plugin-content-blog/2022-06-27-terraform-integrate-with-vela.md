---
title: 将 Terraform 生态粘合到 Kubernetes 世界
author: 曾庆国，孙健波
author_title: KubeVela Team
author_url: https://github.com/barnettZQG
author_image_url: https://KubeVela.io/img/logo.svg
tags: [ KubeVela, Terraform, Kubernetes, DevOps, CNCF, CI/CD, Application delivery]
description: "This article discusses how to Integrate terraform ecosystem with KubeVela."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

> 如果您正在寻找将 Terraform 生态系统与 Kubernetes 世界粘合在一起的东西，那么恭喜！你在这个博客中得到了你想要的答案。

随着各大云厂商产品版图的扩大，基础计算设施，中间件服务，大数据/AI 服务，应用运维管理服务等都可以直接被企业和开发者拿来即用。我们注意到也有不少企业基于不同云厂商的服务作为基础来建设自己的企业基础设施中台。为了更高效，统一的管理云服务，IaC 思想近年来盛行，其中 Terrafrom 更是成功得到了几乎所有的云厂商的采纳和支持。以 Terrafrom 模型为核心的云服务 IaC 生态已经形成。然而在 Kubernetes 大行其道的今天，IaC 被冠以更广大的想象空间，Terraform IaC 能力和生态成果如果融入 Kubernetes 世界，我们认为这是一种强强联合。

<!--truncate-->

* 理由一：构建统一的企业混合云 PaaS 平台

目前大多数企业基于 Kubernetes 服务来构建 PaaS 平台或基础设施管理平台，统一集成云上和自建基础设施。但除了提供基础设施以外，各种中间件，大数据服务，AI 服务，应用可观测等也是云厂商重点提供的产品。企业平台需要具备创建和销毁更多云服务的能力，这时 Terraform 会进入平台构建者的视线，那么他们还需要在 Kuberntes 之外再做一次对接开发吗？而且同时还需要考虑持续发布，GitOps，灰度发布等需求。显然如果直接 基于 Kubernetes 即可完成对接是更好的选项。

* 理由二：为开发者打造 Serverless 体验

云计算的本质或目标就是 Serverless 化，然而自建的基础设施总是有限的，无缝接入云服务可以开启 “近乎无限”的资源池。同时开发者在架构业务应用时，除了在 Serverless 平台上直接完成业务服务部署以外，还需要直接获得例如消息中间件，数据库等服务。更多的企业会采用对接云厂商的方案，运维管理成本更低。但对于开发者，这最好是透明的，一致的。

* 理由三：更彻底的 IaC 能力

一切皆服务，我们需要通过统一的模型来描述云资源、自建基础设施和各种企业应用。Terraform 和 Kubernetes 可以整合并统一为面向开发者的 IaC 规范。带来的好处是同时纳管云资源和容器生态丰富的运维能力，以及面向复杂应用的统一编排。

* 理由四：Terraform 开源版本是客户端模式工作，无法像 Kubernetes 一样进行终态维持。

Terraform 开源发行版只能以客户端模式工作，即用户进行完一次交付后无法维持服务状态，且如果遇到网络故障交付失败时需要手动进行重试处理。Kubernetes 为开发者带来了面向终态的 IaC 思想，通过控制器模式实现对目标资源的状态维持，这进一步提升了 Terraform 工具在自动化层面的优势。

KubeVela 是一个现代的软件交付控制平面， 面向开发者提供统一的 API 抽象，使开发者使用相同的 IaC 方式来同时交付普通应用和云服务。KubeVela 向下直接支持 Terraform 的 API 和 Kubernetes API，无需修改可复用所有 Terraform 模块和所有 Kubernetes 对象。通过 KubeVela 你可以非常简单的实现上诉三方面诉求。我们也看到了另外一种模式的 Crossplane 项目，通过定义 Kubernetes 原生 CRD 的形式在对接云服务，使其体验更加原生，KubeVela 也天然支持 Crossplane API。

接下来让我们通过两部分内容，来详细看看 KubeVela 是如何应用 Terraform 来为用户提供统一 IaC 体验的。

* Part.1 将介绍如何将 Terraform 与 KubeVela 粘合，这需要一些 Terraform 和 KubeVela 的基础知识。
* Part.2 将介绍 KubeVela 交付云服务的一个实践案例，包括 ： 
  * 1）通过 KubeVela 提供一个公网 IP 的 Cloud ECS 实例； 
  * 2）使用 ECS 实例作为隧道服务器，为内网环境中的任何容器服务提供公共访问；

## 将 Terraform 模块转化为 KubeVela 组件

### 准备 Terraform Module

> 如果你已经有一个经过良好测试的 Terraform 模块，那么可以跳过该步骤。

在开始之前，请确保您拥有：

* 安装 Terraform CLI.
* 准备一个云服务账号（AK/SK），本文用例使用阿里云。
* 学习一些使用 Terraform 的基础知识。

这是我用于此演示的 Terraform 模块（ https://github.com/wonderflow/terraform-alicloud-ecs-instance ）。

1. 下载 Terraform 模块。

```bash
git clone https://github.com/wonderflow/terraform-alicloud-ecs-instance.git
cd terraform-alicloud-ecs-instance
```

2. 初始化并下载最新稳定版本的阿里云 Provider。

```bash
terraform init
```

3. 配置阿里云授权账号信息。

```bash
export ALICLOUD_ACCESS_KEY="your-accesskey-id"
export ALICLOUD_SECRET_KEY="your-accesskey-secret"
export ALICLOUD_REGION="your-region-id"
```

你也可以通过创建 provider.tf文件来配置账号信息。

```
provider "alicloud" {
    access_key  = "your-accesskey-id"
    secret_key   = "your-accesskey-secret"
    region           = "cn-hangzhou"
}
```

4. 测试资源创建是否正常。

```bash
terraform apply -var-file=test/test.tfvars
```

5. 测试正常后销毁所有已创建的资源。

```bash
terraform destroy  -var-file=test/test.tfvars
```

到此你也可以根据需要将此模块推送到你自己的代码仓库中。

### 转化 Terrafrom 模块作为 KubeVela 扩展组件类型

这一步是核心，在开始之前，请确保您已经[安装了 Kubevela 控制平面](https://kubevela.net/docs/install#1-install-velad)，如果您没有 Kubernetes 集群也不用担心，快速演示时通过 VelaD 一键安装完成就足够了。

我们将使用我们刚刚准备好的 Terraform 模块来进行下述动作。

1. 生成 KubeVela 组件定义。

```bash
vela def init ecs --type component --provider alibaba --desc "Terraform configuration for Alibaba Cloud Elastic Compute Service" --git https://github.com/wonderflow/terraform-alicloud-ecs-instance.git > alibaba-ecs-def.yaml
vela kube apply -f alibaba-ecs-def.yaml
```

如果你已自定义过 Module ，请直接使用自己的代码仓库地址。
到此你已经成功的将 ECS 模块添加为 KubeVela 的扩展组件类型，您可以从 这里 了解更多详细信息。 Vela 平台上的开发者可以开始直接使用该类型的组件。你可以通过下述命令来查阅自动生成的组件使用文档：

```bash
vela show alibaba-ecs

# OR
vela show alibaba-ecs --web
```

是不是非常简单？KubeVela 对 Terraform 有完善的工具链，但你也不必担心需要为所有的 Terraform 模块重复做该操作，因为社区已经为用户提供了开箱即用的插件，只需要安装对应云厂商的插件即可获得已经转化好的组件。接下来让我们来应用这项能力实验一些有意思的场景。

## 使用云服务将本地容器应用暴露到公网

在这一部分中，我们将介绍一种解决方案，您可以使用特定端口将任何 Kubernetes 服务公开。解决方案由以下组成：

1. KubeVela 环境，如果你在第 1 部分练习过，你已经拥有了。
2. 阿里云 ECS，KubeVela 会通过 Access Key 自动创建一个 tiny ECS(1u1g)。
3. FRP，KubeVela 将在服务器端和客户端启动这个代理。

### 准备 KubeVela 环境
 

* 安装 KubeVela

```bash
curl -fsSl https://static.kubevela.net/script/install-velad.sh | bash
velad install
```

查看 [此文档](https://kubevela.net/docs/install#1-install-velad) 以了解更多安装细节。

* 启用 Terraform Addon 和 Alibaba Provider

```bash
vela addon enable terraform
vela addon enable terraform-alibaba
```

* 添加授权信息

```bash
vela provider add terraform-alibaba --ALICLOUD_ACCESS_KEY <"your-accesskey-id"> --ALICLOUD_SECRET_KEY "your-accesskey-secret" --ALICLOUD_REGION <your-region> --name terraform-alibaba-default
```

查看 [此文档](https://kubevela.net/docs/reference/addons/terraform) 以获取有关其他云的更多详细信息。

### 部署带有公网 IP 地址的 ECS 实例并启动 FRP 服务

```bash
cat <<EOF | vela up -f -
# YAML begins
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ecs-demo
spec:
  components:
    - name: ecs-demo
      type: alibaba-ecs
      properties:
        providerRef:
          name: terraform-alibaba-default
        writeConnectionSecretToRef:
          name: outputs-ecs          
        name: "test-terraform-vela-123"
        instance_type: "ecs.n1.tiny"
        host_name: "test-terraform-vela"
        password: "Test-123456!"
        internet_max_bandwidth_out: "10"
        associate_public_ip_address: "true"
        instance_charge_type: "PostPaid"
        user_data_url: "https://raw.githubusercontent.com/wonderflow/terraform-alicloud-ecs-instance/master/frp.sh"
        ports:
        - 8080
        - 8081
        - 8082
        - 8083
        - 9090
        - 9091
        - 9092
        tags:
          created_by: "Terraform-of-KubeVela"
          created_from: "module-tf-alicloud-ecs-instance"
# YAML ends
EOF
```

此应用定义将部署一个带有公网 IP 地址的 ECS 实例。
你可以通过下述命令详细了解每一个字段说明：

```bash
vela show alibaba-ecs
```

执行完上述部署命令后，你可以通过下面的方式查看应用部署状态：

```bash
vela status ecs-demo
vela logs ecs-demo
```

应用部署完成后可以通过下述命令获取到 IP 地址：

```bash
$ kubectl get secret outputs-ecs --template={{.data.this_public_ip}} | base64 --decode
["121.196.106.174"]
```

你可以通过 `IP:9091`  地址访问到 FRP 服务的管理页面，初始账号密码为：`admin:vela123` 到此我们完成了 ECS 服务的部署。

### 使用 FRP 服务

FRP 客户端的使用非常简单，我们可以为集群内的任何服务提供公共 IP。

1. 单独部署 FRP-Proxy。

```bash
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: frp-proxy
spec:
  components:
    - name: frp-proxy
      type: worker
      properties:
        image: oamdev/frpc:0.43.0
        env:
          - name: server_addr
            value: "121.196.106.174"
          - name: server_port
            value: "9090"
          - name: local_port
            value: "80"
          - name: connect_name
            value: "velaux-service"
          - name: local_ip
            value: "velaux.vela-system"
          - name: remote_port
            value: "8083"
EOF
```

在这种情况下，我们通过  velaux.vela-system 指定 local_ip，这意味着我们正在访问命名空间 vela-system 中名为 velaux 的 Kubernetes 服务。你可以通过公网 IP:8083来访问该服务。

2. 将代理和普通应用共同部署。

```bash
cat <<EOF | vela up -f -
# YAML begins
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: composed-app
spec:
  components:
    - name: web-new
      type: webservice
      properties:
        image: oamdev/hello-world:v2
        ports:
          - port: 8000
            expose: true
    - name: frp-web
      type: worker
      properties:
        image: oamdev/frpc:0.43.0
        env:
          - name: server_addr
            value: "121.196.106.174"
          - name: server_port
            value: "9090"
          - name: local_port
            value: "8000"
          - name: connect_name
            value: "composed-app"
          - name: local_ip
            value: "web-new.default"
          - name: remote_port
            value: "8082"
EOF
```

如此部署完成后可通过公网 `IP:8082` 来访问该服务。还有一种玩法是将 FRP-Proxy 定义为 Trait，直接挂载到需要暴露服务的组件上，这种方式希望你通过阅读 KubeVela 的文档来探索实现啦。

### 清理环境

通过下述命令完成测试过程中创建应用的清理动作：

```bash
vela delete composed-app -y
vela delete frp-proxy -y
vela delete ecs-demo -y
```

云服务组件也会随着应用删除被销毁。

到此我们通过一个具体的使用案例来描述了 KubeVela 是如何完成云服务和普通应用的统一描述和交付，希望你已经掌握并在自己的环境中进行多样化尝试。通过这个案例你也应该大概了解了 KubeVela 结合 Terraform 的最终效果。更多关于 KubeVela 的玩法，可通过阅读 KubeVela 官方文档获得。
