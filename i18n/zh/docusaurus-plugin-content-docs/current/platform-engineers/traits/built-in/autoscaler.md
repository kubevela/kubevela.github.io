---
title: 自动扩缩容
---

本小节会介绍，如何为应用部署计划的一个待交付组件，配置自动扩缩容。我们使用运维特征里的 `cpuscaler` 来完成开发。

## 字段说明


```
$ vela show cpuscaler
# Properties
+---------+---------------------------------------------------------------------------------+------+----------+---------+
|  NAME   |                                   DESCRIPTION                                   | TYPE | REQUIRED | DEFAULT |
+---------+---------------------------------------------------------------------------------+------+----------+---------+
| min     | Specify the minimal number of replicas to which the autoscaler can scale down   | int  | true     |       1 |
| max     | Specify the maximum number of of replicas to which the autoscaler can scale up  | int  | true     |      10 |
| cpuUtil | Specify the average cpu utilization, for example, 50 means the CPU usage is 50% | int  | true     |      50 |
+---------+---------------------------------------------------------------------------------+------+----------+---------+
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
        - type: cpuscaler         # Automatically scale the component by CPU usage after deployed
          properties:
            min: 1
            max: 10
            cpuPercent: 60
```
