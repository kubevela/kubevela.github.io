---
title:  绑定运维特征 // Deprecated
---

运维特征（Traits）也是应用部署计划的核心组成之一，它作用于组件层面，可以让你自由地给组件绑定各式各样的运维动作和策略。比如业务层面的配置网关、标签管理和容器注入（Sidecar），又或者是管理员层面的弹性扩缩容、灰度发布等等。


与组件定义类似，KubeVela 提供了一系列开箱即用的运维特征能力，同时也允许你自定义扩展其它的运维能力。


## 查看 KubeVela 的运维特征类型


```
$ vela traits
NAME                    	NAMESPACE  	APPLIES-TO      	CONFLICTS-WITH	POD-DISRUPTIVE	DESCRIPTION
annotations             	vela-system	*               	              	true          	Add annotations on K8s pod for your workload which follows
                        	           	                	              	              	the pod spec in path 'spec.template'.
configmap               	vela-system	*               	              	true          	Create/Attach configmaps on K8s pod for your workload which
                        	           	                	              	              	follows the pod spec in path 'spec.template'.
env                     	vela-system	*               	              	false         	add env on K8s pod for your workload which follows the pod
                        	           	                	              	              	spec in path 'spec.template.'
ingress                 	vela-system	                	              	false         	Enable public web traffic for the component.
ingress-1-20            	vela-system	                	              	false         	Enable public web traffic for the component, the ingress API
                        	           	                	              	              	matches K8s v1.20+.
labels                  	vela-system	*               	              	true          	Add labels on K8s pod for your workload which follows the
                        	           	                	              	              	pod spec in path 'spec.template'.
lifecycle               	vela-system	*               	              	true          	Add lifecycle hooks for the first container of K8s pod for
                        	           	                	              	              	your workload which follows the pod spec in path
                        	           	                	              	              	'spec.template'.
rollout                 	vela-system	                	              	false         	rollout the component
sidecar                 	vela-system	*               	              	true          	Inject a sidecar container to K8s pod for your workload
                        	           	                	              	              	which follows the pod spec in path 'spec.template'.
...
```


以其中比较常用的运维能力包括：


- `annotations` ：给工作负载添加注释。
- `labels`：给工作负载添加标签。
- `env`: 为工作负载添加环境变量。
- `configmap` ：添加键值对配置文件。
- `ingress` ：配置一个公共网关。
- `ingress-1-20` ：配置一个基于 Kubernetes v1.20+ 版本的公共网关。
- `lifecycle` ：给工作负载增加生命周期“钩子”。
- `rollout` ：组件的灰度发布策略。
- `sidecar`：给组件注入一个容器。



下面，我们将以几个典型的运维特征为例，介绍 KubeVela 运维特征的用法。


## 使用 Ingress 给组件配置网关


我们以给一个 Web Service 组件配置网关，来进行示例讲解。这个组件从 `crccheck/hello-world` 镜像中拉取过来，设置网关后，对外通过 `testsvc.example.com` 加上端口 8000 提供访问。


为了便于你快速学习，请直接复制下面的 Shell 执行，会部署到集群中：


```shell
cat <<EOF | kubectl apply -f -
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
        - type: ingress
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
# YAML 文件结束
EOF
```


你也可以自行将 YAML 文件保存为 ingerss-app.yaml，使用 `kubectl apply -f ingerss-app.yaml` 命令进行部署。


当我们通过 `vela ls` 看到应用的 status 为 running 并且服务为 healthy，表示应用部署计划完全生效。同时它的 TRAITS 类型也正确显示为 ingress。


```shell
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
ingerss-app         	express-server	webservice 	ingress	running	healthy	      	2021-08-28 21:49:44 +0800 CST
```


如果 status 显示为 rendering，则表示仍在渲染中，或者 HEALTHY 一直 false，则你需要使用 `kubectl get application ingress-app -o yaml` 查看报错信息进行对应的处理。


查看返回的信息：


```shell
$ kubectl get application ingress-app -o yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  ... # 省略非关键信息
spec:
  ... # 省略非关键信息
status:
  ... # 省略非关键信息
  services:
  - healthy: true
    name: express-server
    traits:
    - healthy: true
      message: |
        No loadBalancer found, visiting by using 'vela port-forward ingress-app'
      type: ingress
    workloadDefinition:
      apiVersion: apps/v1
      kind: Deployment
  status: running
```

最后通过 vela port-forward ingress-app 转发到本地处理请求：
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


## 给组件添加标签和注释


labels 和 annotations 运维特征，允许你将标签和注释附加到组件上，让我们在实现业务逻辑时，按需触发被标记的组件和获取注释信息。


首先，我们准备一个应用部署计划的示例，请直接复制执行：


```shell
cat <<EOF | kubectl apply -f -
# YAML 文件开始
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: labels-annotations
spec:
  components:
    - name: server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: labels
          properties:
            "release": "stable"
        - type: annotations
          properties:
            "description": "web application"
# YAML 文件结束
EOF
```


上述的业务中，我们定义了名称是 server 的这个组件，通过 labels 指定它供 stable 发布使用，并通过 annotations 注释它是一个针对网页应用程序的业务。


在运行时集群上，使用 `vela ls` 命令检查应用是否已成功创建：


```shell
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
labels-annotations  	server        	webservice 	labels,annotations	running	healthy	      	2021-08-29 20:55:28 +0800 CST
```

通过 Kubernetes 的命令我们可以看到，底层的资源已经打上的相应的标签：


```
$ kubectl get deployments server -o jsonpath='{.spec.template.metadata.labels}'
{"app.oam.dev/component":"server","release":"stable"}

$ kubectl get deployments server -o jsonpath='{.spec.template.metadata.annotations}'
{"app.oam.dev/component":"server","release":"stable"}
```




## 给组件注入容器（Sidecar）


Sidecar 容器作为与业务容器解耦的存在，可以帮助我们很多辅助性的重要工作，比如常见的日志代理、用来实现 Service Mesh 等等。


这一次，让我们来编写一个应用部署计划里的组件 log-gen-worker。 同时我们将 sidecar 所记录的日志数据目录，和组件指向同一个数据存储卷 varlog。


```shell
cat <<EOF | kubectl apply -f -
# YAML 文件开始
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app-with-sidecar
spec:
  components:
    - name: log-gen-worker
      type: worker
      properties:
        image: busybox
        cmd:
          - /bin/sh
          - -c
          - >
            i=0;
            while true;
            do
              echo "$i: $(date)" >> /var/log/date.log;
              i=$((i+1));
              sleep 1;
            done
        volumes:
          - name: varlog
            mountPath: /var/log
            type: emptyDir
      traits:
        - type: sidecar
          properties:
            name: count-log
            image: busybox
            cmd: [ /bin/sh, -c, 'tail -n+1 -f /var/log/date.log']
            volumes:
              - name: varlog
                path: /var/log
# YAML 文件结束
EOF
```


使用 `vela ls` 查看应用是否部署成功：


```shell
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
vela-app-with-sidecar	log-gen-worker	worker     	sidecar           	running	healthy	      	2021-08-29 22:07:07 +0800 CST
```


成功后，先检查应用生成的工作负载情况：


```
$ kubectl get pods -l app.oam.dev/component=log-gen-worker
NAME                              READY   STATUS    RESTARTS   AGE
log-gen-worker-7bb65dcdd6-tpbdh   2/2     Running   0          45s
```




最后查看 Sidecar 所输出的日志，可以看到读取日志的 sidecar 已经生效。


```
kubectl logs -f log-gen-worker-7bb65dcdd6-tpbdh count-log
```


以上，我们以几个常见的运维特征为例介绍了如何绑定运维特征，更多的运维特征功能和参数，请前往运维特征系统中的内置运维特征查看。

## 自定义运维特征

当已经内置的运维特征无法满足需求，你可以自由的自定义运维能力，请查看管理员手册里的[自定义运维特征](../platform-engineers/traits/customize-trait)进行实现。

## 下一步

- [集成云资源](./components/cloud-services/provider-and-consume-cloud-services.md)，了解如何集成各类云厂商的云资源
- [灰度发布和扩缩容](./rollout-scaler)