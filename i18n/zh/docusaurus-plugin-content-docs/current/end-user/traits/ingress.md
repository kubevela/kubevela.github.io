---
title: Expose Application
---

> ⚠️ 本章节要求当前集群已经安装 ingress 。

如果我们需要将 application 中的服务暴露对外，只需要在该 application 中添加 `ingress` 的 trait。

我们使用 kubectl 查看 ingress 数据结构。

```shell
$ kubectl vela show ingress
# Properties
+--------+------------------------------------------------------------------------------+----------------+----------+---------+
|  NAME  |                                 DESCRIPTION                                  |      TYPE      | REQUIRED | DEFAULT |
+--------+------------------------------------------------------------------------------+----------------+----------+---------+
| http   | Specify the mapping relationship between the http path and the workload port | map[string]int | true     |         |
| domain | Specify the domain you want to expose                                        | string         | true     |         |
+--------+------------------------------------------------------------------------------+----------------+----------+---------+
```

随后，修改且部署下面 application ：

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

```bash
$ kubectl apply -f https://raw.githubusercontent.com/oam-dev/kubevela/master/docs/examples/vela-app.yaml
application.core.oam.dev/first-vela-app created
```

当状态 `PHASE` 为 `running` 且 `HEALTHY` 为 `true`，说明 application 已经被正确部署：

```bash
$ kubectl get application first-vela-app -w
NAME             COMPONENT        TYPE         PHASE            HEALTHY   STATUS   AGE
first-vela-app   express-server   webservice   healthChecking                      14s
first-vela-app   express-server   webservice   running          true               42s
```

同时，我们可以通过下面命令行查看 trait 的详情：

```shell
$ kubectl get application first-vela-app -o yaml
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

最后，我们可以通过以下方式访问部署的服务。

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
