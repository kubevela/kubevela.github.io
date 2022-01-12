---
title: 给应用配置访问网关
description: 本页面介绍通过为应用分配网关策略，或设置应用的 Service 类型为 Loadbalancer 或 NodePort 实现应用的集群外访问。
---

本文介绍多种应用访问策略的设置方法，你可以根据基础设施条件选择应用合适访问方式。

## 开始之前

- 建议在 Kubernetes 集群中安装 Ingress 控制器，比如 [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/deploy/)。

## 如何使用

我们以给一个 Web Service 组件配置网关，来进行示例讲解。这个组件从 `crccheck/hello-world` 镜像中拉取过来，设置网关后，对外通过 `testsvc.example.com` 加上端口 8000 提供访问。


为了便于你快速学习，请直接复制下面的 Shell 执行，会部署到集群中：


```shell
cat <<EOF | vela up -f -
# YAML 文件开始
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ingress-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
# YAML 文件结束
EOF
```


你也可以自行将 YAML 文件保存为 ingerss-app.yaml，使用 `vela up -f ingerss-app.yaml` 命令进行部署。


当我们通过 `vela ls` 看到应用的 status 为 running 并且服务为 healthy，表示应用部署计划完全生效。同时它的 TRAITS 类型也正确显示为 ingress。


```shell
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
ingerss-app         	express-server	webservice 	ingress	running	healthy	      	2021-08-28 21:49:44 +0800 CST
```


如果 status 显示为 rendering，则表示仍在渲染中，或者 HEALTHY 一直 false，则你需要使用 `vela status ingress-app` 查看报错信息进行对应的处理。


查看返回的信息：


```shell
$ vela status ingress-app
About:

  Name:      	ingress-app
  Namespace: 	default
  Created at:	2022-01-12 17:34:25 +0800 CST
  Status:    	running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:n5u4dsa1t4
    name:express-server3
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: express-server3  Env:
    Type: webservice
    healthy Ready:1/1
    Traits:
      -  ✅ gateway: Visiting URL: testsvc.example.com, IP: 1.5.1.1
```

最后通过 `vela port-forward ingress-app` 转发到本地处理请求：

```shell
vela port-forward ingress-app
Forwarding from 127.0.0.1:8000 -> 8000
Forwarding from [::1]:8000 -> 8000

Forward successfully! Opening browser ...
Handling connection for 8000
```
访问服务：
```shell
curl -H "Host:testsvc.example.com" http://127.0.0.1:8000/
Hello World


                                       ##         .
                                 ## ## ##        ==
                              ## ## ## ## ##    ===
                           /""""""""""""""""\___/ ===
                      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~ ~ /  ===- ~~~
                           \______ o          _,/
                            \      \       _,'
                             `'--.._\..--''
```



## Specification

|  NAME  |                                 DESCRIPTION                                  |      TYPE      | REQUIRED | DEFAULT |
|--------|------------------------------------------------------------------------------|----------------|----------|---------|
| http   | Specify the mapping relationship between the http path and the workload port | map[string]int | true     |         |
| class  | Specify the class of ingress to use                                          | string         | true     | nginx   |
| domain | Specify the domain you want to expose                                        | string         | true     |         |
