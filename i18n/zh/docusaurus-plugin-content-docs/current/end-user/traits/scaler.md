---
title: 副本数设定
---

本小节会介绍，如何为应用部署计划的一个待交付组件，配置副本数。我们使用运维特征里的 `scaler` 来完成开发。

## 字段说明


```
$ vela show scaler
# Properties
+----------+--------------------------------+------+----------+---------+
|   NAME   |          DESCRIPTION           | TYPE | REQUIRED | DEFAULT |
+----------+--------------------------------+------+----------+---------+
| replicas | Specify the number of workload | int  | true     |       1 |
+----------+--------------------------------+------+----------+---------+
```

## 如何使用

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
        - type: scaler         # Set the replica to the specified value
          properties:
            replicas: 5
```
