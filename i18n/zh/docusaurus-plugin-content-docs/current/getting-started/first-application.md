---
title:  交付第一个应用
---

欢迎来到 KubeVela! 在本小节中，我们会向你介绍如何完成第一个 Demo。

先来实际感受 KubeVela 到底是如何工作的。

## 部署你的第一个应用

首先，在你的集群上，我们使用一个提前准备好的 YMAL 文件。

```bash
$ kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/vela-app.yaml
application.core.oam.dev/first-vela-app created
```

检查状态：直到看到 `status` 是 `running`，并且 `services` 是 `healthy`。

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
可以看到，这个 YAML 的类型是一个 `Application`，由 `core.oam.dev/v1beta1` 来定义，即 KubeVela 的 API Specification。

在 `Sepc` 字段里，我们也看到比如 `components` 和 `traits` 这样陌生的字段。

在下一章节中，我们将带你进一步深入它们背后 KubeVela 的核心概念：应用程序、组件系统和运维特征系统。

同时，在底层的 K8s 资源也被创建了出来:

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

如果你的集群有一个工作中的 ingress，你可以查看这个 service。

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
**太棒了!** 你已经全都部署成功了。

也就是说 KubeVlea 的应用交付，围绕应用程序、组件系统和运维特征系统这一整套应用部署计划的核心概念展开，同时通过 Workflow 工作流、CUE 粘合开源生态等进行场景和能力的按需扩展，达成跨云、标准和统一的交付目标。

## 下一步

后续步骤:

- 加入 KubeVela 中文社区钉钉群，群号：23310022。
- 查看 KubeVela 的[`核心概念`](../core-concepts/application.md)，进一步理解其是如何工作的。
<!-- - 直接使用 [`用户手册`](../core-concepts/application.md) 或者 [`管理员手册`](../core-concepts/application.md) 开始实际开发。 -->