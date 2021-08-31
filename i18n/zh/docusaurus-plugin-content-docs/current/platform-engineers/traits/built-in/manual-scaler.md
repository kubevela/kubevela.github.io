---
title: 手动扩缩容
---
本小节会介绍，如何为应用部署计划的一个待交付组件，配置手动扩缩容。我们使用运维特征里的 `scaler` 来完成开发。

## 字段说明

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

## 如何使用

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

如果要扩容或缩容，你只需要修改 `scaler` 运维特征的 `replicas` 字段，并重新应用 YAML 文件即可。