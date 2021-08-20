---
title: 手动扩缩容
---
本小节会介绍，如何为应用部署计划的一个待交付组件，配置手动扩缩容。我们使用运维特征里的 `scaler` 来完成开发。

### 开始之前

> ⚠️ 请已安装 [KubeVela CLI 命令行工具](../../getting-started/quick-install.mdx##3)

### 如何使用

先熟悉 `scaler` 运维特征的相关信息：

```shell
vela show scaler 
```
```console
# Properties
+----------+--------------------------------+------+----------+---------+
|   NAME   |          DESCRIPTION           | TYPE | REQUIRED | DEFAULT |
+----------+--------------------------------+------+----------+---------+
| replicas | Specify replicas of workload   | int  | true     |       1 |
+----------+--------------------------------+------+----------+---------+
```

使用时，我们将 `salcer` 运维特征，添加到待交付的组件中去：

```yaml
# sample-manual.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: nginx
      traits:
        - type: scaler
          properties:
            replicas: 2
        - type: sidecar
          properties:
            name: "sidecar-test"
            image: "fluentd"
    - name: backend
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
```

修改完毕，在 YAML 文件所在路径下，使用命令进行部署：

```shell
kubectl apply -f sample-manual.yaml
```
```console
application.core.oam.dev/website configured
```

应用部署计划完全生效后，当我们查看运行时集群，会看到 `frontend` 组件的底层部署现在有 2 个副本。

```shell
kubectl get deploy -l app.oam.dev/name=website
```
```console
NAME       READY   UP-TO-DATE   AVAILABLE   AGE
backend    1/1     1            1           19h
frontend   2/2     2            2           19h
```

如果要扩容或缩容，你只需要修改 `scaler` 运维特征的 `replicas` 字段，并重新应用 YAML 文件即可。