---
title:  快速开始
---

欢迎来到KubeVela! 在本向导中, 我们会向您介绍如何安装KubeVela并且部署您的第一个简单的应用。 

## Step 1: 安装

确定您在上一篇文档中已经完成并且验证了[安装](./install).

## Step 2: 部署您的第一个应用

```bash
$ kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/vela-app.yaml
application.core.oam.dev/first-vela-app created
```

检查状态：直到看到`status` 是 `running`，并且`services`是`healthy`

```bash
$  kubectl get application first-vela-app -o yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  generation: 1
  name: first-vela-app
  ...
  namespace: default
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
          /: 8000
status:
  ...
  services:
  - healthy: true
    name: express-server
    traits:
    - healthy: true
      message: 'Visiting URL: testsvc.example.com, IP: your ip address'
      type: ingress
  status: running
```

在底层, K8s资源被创建了出来:

```bash
$ kubectl get deployment
NAME                READY   UP-TO-DATE   AVAILABLE   AGE
express-server-v1   1/1     1            1           8m
$ kubectl get svc
NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
express-server   ClusterIP   172.21.11.152   <none>        8000/TCP   7m43s
kubernetes       ClusterIP   172.21.0.1      <none>        443/TCP    116d
$ kubectl get ingress
NAME             CLASS    HOSTS                 ADDRESS          PORTS   AGE
express-server   <none>   testsvc.example.com   <your ip address>   80      7m47s
```

如果你的集群有一个工作中的ingress，您可以查看这个service。

```
$ curl -H "Host:testsvc.example.com" http://<your ip address>/
<xmp>
Hello World


                                       ##         .
                                 ## ## ##        ==
                              ## ## ## ## ##    ===
                           /""""""""""""""""\___/ ===
                      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~ ~ /  ===- ~~~
                           \______ o          _,/
                            \      \       _,'
                             `'--.._\..--''
</xmp>
```
**耶耶!** 成功了。

## 接下来干什么？

以下是一些推荐的后续步骤:

- 从[核心概念](./concepts)开始学习KubeVela
- 了解更多 [`Application`](./application)的细节并且理解其是如何工作。
- 加入CNCF [Slack](https://cloud-native.slack.com) 中的`#kubevela` channel 和 [Gitter](https://gitter.im/oam-dev/community)

Welcome onboard and sail Vela!