---
title:  组件交付
---

组件（Components）是应用部署计划的核心组成之一，你可以使用它来构建最常见的服务类型，比如一个对外提供访问的 Web Service、一个在后端跑定时任务的 Worker，又或者开启 Redis 和引用 OSS 等等。

为了帮你快速而全面的落地业务，KubeVela 提供了大量开箱即用的组件类型，不仅包含了面向常规微服务场景的业务型组件，如”服务型组件”（webservice）、“后台运行组件”（worker）、“一次性任务组件”（task）等，还包含了面向社区不同制品类别的通用型组件，如支持 Helm Chart 的“Helm 组件”、支持 Git 仓库的“Kustomize 组件”等，同时还包含了一系列常用的云服务组件。如果 KubeVela 内置的组件类型不能满足你的全部需求，KubeVela 还拥有几乎可以对接任意类型组件制品的扩展能力。

## 查看 KubeVela 的组件类型

我们通过 [KubeVela CLI][1] 来查看系统中可用组件类型：

```shell
$ vela components
NAME        NAMESPACE  	WORKLOAD                             	DESCRIPTION                                                            
alibaba-ack	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud ACK cluster       
alibaba-oss	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud OSS object        
alibaba-rds	vela-system	configurations.terraform.core.oam.dev	Terraform configuration for Alibaba Cloud RDS object        
helm       	vela-system	autodetects.core.oam.dev             	helm release is a group of K8s resources from either git    
           	           	                                     	repository or helm repo                                     
kustomize  	vela-system	autodetects.core.oam.dev             	kustomize can fetching, building, updating and applying     
           	           	                                     	Kustomize manifests from git repo.                          
raw        	vela-system	autodetects.core.oam.dev             	raw allow users to specify raw K8s object in properties     
task       	vela-system	jobs.batch                           	Describes jobs that run code or a script to completion.     
webservice 	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services    
           	           	                                     	that have a stable network endpoint to receive external     
           	           	                                     	network traffic from customers.                             
worker     	vela-system	deployments.apps                     	Describes long-running, scalable, containerized services    
           	           	                                     	that running at backend. They do NOT have network endpoint  
           	           	                                     	to receive external network traffic.    
```

每个类型具体是指：
- `webservice`：长时间运行、弹性的容器化服务，对外提供访问
- `worker`：长时间运行、弹性、容器化的后端服务，不对外访问
- `task`：跑代码或者脚本的一次性任务
- `helm`：面向社区不同制品类别的通用型 Helm 组件
- `kustomize`：面向社区不同制品类别的通用型 Kustomize 组件
- `alibaba-ack`：云资源之一，阿里云容器服务 Kubernetes 版（ACK ）
- `alibaba-oss`：云资源之一，阿里云对象存储服务（OSS）
- `alibaba-rds`：云资源之一，阿里云关系型数据库服务（RDS）
- `raw`：直接引用原生的 Kubernetes 资源对象的组件

下面让我们以几个典型的组件类型为例，介绍 KubeVela 组件交付的用法。如果你希望直接查看云资源的使用方式，请阅读[集成云资源][2]。

## 使用服务型组件(webservice)部署应用

服务型组件是以容器为核心支撑对外访问服务的组件，其功能涵盖了主流微服务场景的需要。

为了便于你快速学习，请直接复制下面的 Shell 执行，会部署到集群中：
```shell
cat <<EOF | kubectl apply -f -
# YAML 文件开始
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        port: 8080
        cpu: "0.1"
        env:
          - name: FOO
            value: bar
# YAML 文件结束
EOF
```
你也可以自行将 YAML 文件保存为 website.yaml，使用 `kubectl apply -f website.yaml` 命令进行部署。

接下来，通过 `kubectl get application <应用 name> -o yaml` 查看应用的部署状态：
```shell
$ kubectl get application website -o yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
  ... #  省略非关键信息
spec:
  components:
  - name: frontend
    properties:
      ... #  省略非关键信息
    type: webservice
status:
  conditions:
  - lastTransitionTime: "2021-08-28T10:26:47Z"
    reason: Available
    status: "True"
    ... #  省略非关键信息
    type: HealthCheck
  observedGeneration: 1
  ... #  省略非关键信息
  services:
  - healthy: true
    name: frontend
    workloadDefinition:
      apiVersion: apps/v1
      kind: Deployment
  status: running
```
当我们看到 status-services-healthy 的字段为 true，并且 status 为 running 时，即表示整个应用交付成功。

如果 status 显示为 rendering，或者 healthy 为 false，则表示应用要么部署失败，要么还在部署中。请根据 `kubectl get application <应用 name> -o yaml` 中返回的信息对应地进行处理。

你也可以通过 vela 的 CLI 查看，使用如下命令：
```shell
$ vela ls
APP    	COMPONENT	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
website	frontend 	webservice	      	running	healthy	      	2021-08-28 18:26:47 +0800 CST
```
我们也看到 website APP 的 PHASE 为 running，同时 STATUS 为 healthy。

## 使用 Helm 组件部署应用

KubeVela 的 `helm` 组件满足了用户对接 Helm Chart 的需求，你可以通过 `helm` 组件部署任意来自 Helm 仓库、Git 仓库或者 OSS bucket 的现成 Helm chart 软件包，并对其进行参数覆盖。

我们以来自 Helm 仓库的 Chart 包部署方式，进行示例讲解。在这次的应用部署计划中，希望交付的是一个名为 redis-comp 的组件。它是来自 https://charts.bitnami.com/bitnami Helm 仓库的 Chart。Chart 类型为 redis-cluster，版本 6.2.7。

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-delivering-chart
spec:
  components:
    - name: redis-comp
      type: helm
      properties:
        chart: redis-cluster
        version: 6.2.7
        url: https://charts.bitnami.com/bitnami
        repoType: helm
EOF
```

请复制上面的代码块，直接部署到运行时集群：
```shell
application.core.oam.dev/app-delivering-chart created
```

最后我们使用 `vela ls` 来查看交付成功后的应用状态：
```shell
APP                 	COMPONENT 	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
app-delivering-chart	redis-comp	helm      	      	running	healthy	      	2021-08-28 18:48:21 +0800 CST
```

我们也看到 app-delivering-chart APP 的 PHASE 为 running，同时 STATUS 为 healthy。

关于 Git 仓库和 OSS bucket 的使用示例，以及关于它们的详细配置项信息，请前往管理员手册里的[内置组件][3]查阅。

## 使用 Kustomize 组件部署应用

KubeVela 的 `kustomize` 组件满足了用户直接对接 Yaml 文件、文件夹作为组件制品的需求。无论你的 Yaml 文件/文件夹是存放在 Git 仓库还是 OSS bucket，KubeVela 均能读取并交付。

我们以来自 OSS bucket 仓库 YAML 文件夹组件为例来做用法的讲解。这一次的应用部署计划中，希望交付的是一个名为 bucket-comp 的组件。组件对应的部署文件存放在云存储 OSS bucket，使用对应 bucket 名称是 definition-registry。kustomize.yaml 来自 oss-cn-beijing.aliyuncs.com 的这个地址，所在路径为 `./app/prod/`。

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      properties:
        repoType: oss
        # 如果 bucket 是私用权限，会需要你提供
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        oss:
          bucketName: definition-registry
        path: ./app/prod/
EOF
```
请复制上面的代码块，直接部署到运行时集群：

```shell
application.core.oam.dev/bucket-app created
```

最后我们使用 `vela ls` 来查看交付成功后的应用状态：
```shell
vela ls
APP                 	COMPONENT  	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
bucket-app          	bucket-comp	kustomize 	      	running	healthy	      	2021-08-28 18:53:14 +0800 CST
```

bucket-app APP 的 PHASE 为 running，同时 STATUS 为 healthy。应用部署成功！

关于 Git 仓库的使用示例，以及关于它们的详细配置项信息，请前往管理员手册里的[内置组件][4]查阅。

## 使用云资源组件

云资源组件也是 KubeVela 支持的核心组件，云资源往往不会单独使用，如数据库、缓存等云资源，往往需要在创建之后将相关信息传递到其他组件使用，同时云资源涉及到不同云厂商，以及一些鉴权相关的准备工作，我们将在[集成云资源][5]这个章节独立讲解。

## 自定义组件

当以上 KubeVela 内置的开箱组件都无法满足需求的时候，不要担心，KubeVela 提供了强大了扩展能力，几乎可以对接任意类型的组件形态，你可以查看管理员手册里的[自定义组件][6]学习使用 CUE 和 Kubernetes 扩展 KubeVela 的组件类型。

## 下一步

- 访问[集成云资源][7]文档，掌握不同类型不同厂商的云资源集成方式
- 访问[绑定运维特征][8]文档，掌握如何给组件绑定你需要的运维动作和策略

[1]:	../getting-started/quick-install#3-get-kubevela-cli
[2]:	./cloud-services
[3]:	../platform-engineers/components/build-in-component
[4]:	../platform-engineers/components/build-in-component
[5]:	./cloud-services
[6]:	../platform-engineers/components/custom-component
[7]:	./cloud-services
[8]:	./binding-traits