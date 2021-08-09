---
title: 配置网关
---
本小节会介绍，如何为应用部署计划的一个组件，进行网关配置。我们使用运维特征里的 `ingress`，将组件暴露出去，可供公网访问。

### 开始之前

> ⚠️ 需要你的集群已安装 [Ingress 控制器](https://kubernetes.github.io/ingress-nginx/deploy/)。

> ⚠️ 请已安装 [KubeVela CLI 命令行工具](../../getting-started/quick-install.mdx##3)

### 如何使用

先熟悉 `ingress` 运维特征的相关信息：

```shell
vela show ingress
```
```console
# Properties
+--------+------------------------------------------------------------------------------+----------------+----------+---------+
|  NAME  |                                 DESCRIPTION                                  |      TYPE      | REQUIRED | DEFAULT |
+--------+------------------------------------------------------------------------------+----------------+----------+---------+
| http   | Specify the mapping relationship between the http path and the workload port | map[string]int | true     |         |
| domain | Specify the domain you want to expose                                        | string         | true     |         |
+--------+------------------------------------------------------------------------------+----------------+----------+---------+
```

使用时，我们将 `ingress` 运维特征，添加到待交付的组件中去：

```yaml
# vela-app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
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
```

修改完毕，在 YAML 文件所在路径下，使用命令进行部署：

```bash
kubectl apply -f vela-app.yaml
```
```console
application.core.oam.dev/first-vela-app created
```

当我们看到 `status` 为 `running` 并且服务为 `healthy`，表示应用部署计划完全生效：

```bash
kubectl get application first-vela-app -w
```
```console
NAME             COMPONENT        TYPE         PHASE            HEALTHY   STATUS   AGE
first-vela-app   express-server   webservice   healthChecking                      14s
first-vela-app   express-server   webservice   running          true               42s
```

这时候，让我们查看网关提供的公网 IP：

```shell
kubectl get application first-vela-app -o yaml
```
```console
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
  namespace: default
spec:
...
  services:
  - healthy: true
    name: express-server
    traits:
    - healthy: true
      message: 'Visiting URL: testsvc.example.com, IP: 47.111.233.220'
      type: ingress
  status: running
...
```

然后你的用户就能够通过这个 IP，来访问该应用程序了。

```
curl -H "Host:testsvc.example.com" http://<your ip address>/
```
```console
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
