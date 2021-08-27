---
title:  组件交付
---

组件（Components）是应用部署计划的核心组成之一，你可以使用它来构建最常见的服务类型，比如一个对外提供访问的 Web Service、一个在后端跑定时任务的 Worker，又或者开启 Redis 和引用 OSS 等等。

为了帮你快速而全面的落地业务，KubeVela 不仅提供了开箱即用的默认组件，同时允许通过 Helm、Kustomzie 和 CUE 自定义扩展任何你需要的服务能力。

## 使用默认组件

我们通过 [KubeVela CLI](.,/../../getting-started/quick-install.mdx#3-安装-kubevela-cli) 来查看可用的内部组件：

```shell
$ vela components                                                           
NAME      	NAMESPACE  	WORKLOAD                	DESCRIPTION                                                 
raw       	vela-system	autodetects.core.oam.dev	raw allow users to specify raw K8s object in properties     
task      	vela-system	jobs.batch              	Describes jobs that run code or a script to completion.     
webservice	vela-system	deployments.apps        	Describes long-running, scalable, containerized services    
          	           	                        	that have a stable network endpoint to receive external     
          	           	                        	network traffic from customers.                             
worker    	vela-system	deployments.apps        	Describes long-running, scalable, containerized services    
          	           	                        	that running at backend. They do NOT have network endpoint  
          	           	                        	to receive external network traffic.      
```
每个类型具体是指：
- `raw`：可以直接引用原生的 Kubernetes 资源对象
- `task`：跑代码或者脚本的任务
- `webservice`：长时间运行、弹性的容器化服务，对外提供访问
- `worker`：长时间运行、弹性、容器化的后端服务，不对外访问

以上所有组件的底层，均通过 CUE 模版来实现。我们会在下面的 CUE 组件中为你介绍，如何使用它们制作一个应用部署计划。

## 自由扩展组件

### Helm 组件

KubeVela 允许你使用最常见的 Helm Chart 来扩展你需要的服务能力。可以选择来自 Helm 仓库、Git 仓库和 OSS bucket 的这三种方式。

我们以 Helm 仓库的方式，进行示例讲解。在这次的应用部署计划中，希望交付的是一个名为 redis-comp 的组件。它是来自 https://charts.bitnami.com/bitnami Helm 仓库的 Chart。Chart 类型为 redis-cluster，版本 6.2.7。

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
vela ls
APP                   COMPONENT       TYPE        TRAITS        PHASE  HEALTHY  STATUS  CREATED-TIME
app-delivering-chart  redis-comp      helm                                              2021-08-27 19:36:15 +0800 CST
```

关于 Git 仓库和 OSS bucket 的使用示例，以及关于它们的详细配置项信息，请前往管理员手册里的[内置组件](../platform-engineers/components/build-in-component)查阅。

### Kustomize 组件

Kustomize 也是常见的扩展能力的方式。目前支持用 Git 仓库、OSS bucket 两种方式进行集成。

我们以 OSS bucket 仓库的方式，进行示例讲解。这一次的应用部署计划中，希望交付的是一个名为 bucket-comp 的组件。它的类型是 OSS bucket，使用对应 bucket 名称是 definition-registry。kustomize.yaml 来自 oss-cn-beijing.aliyuncs.com 的这个地址，所在路径为 `./app/prod/`。

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
APP                   COMPONENT       TYPE        TRAITS        PHASE  HEALTHY  STATUS  CREATED-TIME
bucket-comp           bucket-comp     kustomize                                         2021-08-27 19:36:15 +0800 CST
```

关于 Git 仓库的使用示例，以及关于它们的详细配置项信息，请前往管理员手册里的[内置组件](../platform-engineers/components/build-in-component)查阅。

### Cue 组件

前文我们提到，你所看到，在 vela-system 命令空间下的 webservice、task 和 worker 等组件类型，都是通过 CUE 模版来内置的。这几种开箱即用的 CUE 组件，涵盖了主流的微服务场景。

我们以 Web Service 作为例子进行讲解，编写如下的 YAML 文件：

```shell
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
          - name: FOO
            valueFrom:
              secretKeyRef:
                name: bar
                key: bar

```

部署到运行时集群，并通过 `vela ls` 查看是否成功：

```shell
$ kubectl apply -f web-service.yaml 
application.core.oam.dev/website configured

$ vela ls
APP                     COMPONENT       TYPE        TRAITS              PHASE           HEALTHY     STATUS                                  CREATED-TIME                 
website                 frontend        webservice                      rendering       healthy                                             2021-07-15 11:24:52 +0800 CST
```

最后，当以上默认 CUE 组件和 Helm、Kustomize 集成生态能力的组件，都无法满足需求的时候，可以自己查看管理员手册里的[自定义组件](../platform-engineers/components/custom-component)进行开发，或者请求你们的平台管理员进行开发。