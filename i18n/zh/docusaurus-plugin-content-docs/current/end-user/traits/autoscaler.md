---
title: 自动扩缩容
---

本小节会介绍，如何为应用部署计划的一个待交付组件，配置自动扩缩容。我们使用运维特征里的 `cpuscaler` 来完成开发。

### 开始之前

> ⚠️ 请已安装 [KubeVela CLI 命令行工具](../../getting-started/quick-install.mdx##3)

### 如何使用

先熟悉 `cpuscaler` 运维特征的相关信息：

```
vela show cpuscaler

# Properties
+---------+---------------------------------------------------------------------------------+------+----------+---------+
|  NAME   |                                   DESCRIPTION                                   | TYPE | REQUIRED | DEFAULT |
+---------+---------------------------------------------------------------------------------+------+----------+---------+
| min     | Specify the minimal number of replicas to which the autoscaler can scale down   | int  | true     |       1 |
| max     | Specify the maximum number of of replicas to which the autoscaler can scale up  | int  | true     |      10 |
| cpuUtil | Specify the average cpu utilization, for example, 50 means the CPU usage is 50% | int  | true     |      50 |
+---------+---------------------------------------------------------------------------------+------+----------+---------+

```

然后我们准备一个应用部署计划，并将 `cpuscaler` 运维特征，按业务需要设置好：

```yaml
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend              # This is the component I want to deploy
      type: webservice
      properties:
        image: nginx
      traits:
        - type: cpuscaler         # Automatically scale the component by CPU usage after deployed
          properties:
            min: 1
            max: 10
            cpuPercent: 60
```

编写完毕，在 YAML 所在路径，部署该文件：

```shell
$ kubectl apply -f sample.yaml

application.core.oam.dev/website created
```

看看应用是否启动起来：

```shell
$ vela ls
NAME        COMPONENT   TYPE         PHASE     HEALTHY   STATUS   AGE
website     frontend    webservice   running   true               4m54s
```

最后查看应用相关信息，`cpuscaler` 在正常工作：

```shell
$ kubectl get app website -o yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  generation: 1
  name: website
  namespace: default
spec:
  components:
  - name: frontend
    properties:
      image: nginx
    traits:
    - properties:
        cpuPercent: 60
        max: 10
        min: 1
      type: cpuscaler
    - properties:
        image: fluentd
        name: sidecar-test
      type: sidecar
    type: webservice
  - name: backend
    properties:
      cmd:
      - sleep
      - "1000"
      image: busybox
    type: worker
status:
  ...
  latestRevision:
    name: website-v1
    revision: 1
    revisionHash: e9e062e2cddfe5fb
   services:
  - healthy: true
    name: frontend
    traits:
    - healthy: true
      type: cpuscaler
    workloadDefinition:
      apiVersion: apps/v1
      kind: Deployment
  status: running

```
