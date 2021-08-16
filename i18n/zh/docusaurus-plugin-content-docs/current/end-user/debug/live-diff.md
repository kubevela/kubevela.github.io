---
title: 版本对比
---

另一个更进一步的验证需求是，升级部署版本所带来的表现是否符合期望。但我们同样希望，这个验证在本地试运行时就可以完成。

KubeVela 提供版本对比（Live-diff）这个功能来满足你的需求。它可以让你不用真的对运行时集群进行操作，在本地就为你提供应用升级时的预览来进行确认。

预览所提供的信息，会包括应用部署计划的新增、修改和移除等信息，同时也包括其中的组件和运维特征的相关信息。

### 如何使用

我们同样使用如下的 YMAL 文件进行讲解：

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app
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

先将其直接部署到运行时集群：

```shell
kubectl apply -f app.yaml
```

然后我们看看这个应用部署计划的历史：

```shell
kubectl get apprev -l app.oam.dev/name=vela-app
```
```console
NAME          AGE
vela-app-v1   17m
```

接下来我们看看应用升级时，具体如何使用 `版本对比` 功能。

首先假设你的新应用部署计划如下，包含变更端口号、新增组件等更新：

```yaml
# new-app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8080 # 变更端口号
        cpu: "0.5" # 增加 CPU 数
    - name: my-task # 增加一个组件
      type: task
      properties:
        image: busybox
        cmd: ["sleep", "1000"]
      traits:
        - type: ingress
          properties:
            domain: testsvc.example.com
            http:
              "/": 8080 # 变更端口号
```

然后运行 `版本对比` 功能，使用如下命令：

```shell
vela system live-diff -f new-app.yaml -r vela-app-v1
```

通过 `-r` or `--revision` 这个字段，你可以指定去比较任意过去的应用版本。

同时通过 `vela system live-diff live-diff -h` 查看更多你需要指定去比较的信息，比如 `-c, --context` 告诉你，有哪些部分进行了变更等等：

```
Usage:
  vela system live-diff

Examples:
vela live-diff -f app-v2.yaml -r app-v1 --context 10

Flags:
  -r, --Revision string     specify an application Revision name, by default, it will compare with the latest Revision
  -c, --context int         output number lines of context around changes, by default show all unchanged lines (default -1)
  -d, --definition string   specify a file or directory containing capability definitions, they will only be used in dry-run rather than applied to K8s cluster
  -f, --file string         application file name (default "./app.yaml")
  -h, --help                help for live-diff

Global Flags:
  -e, --env string   specify environment name for application
```

