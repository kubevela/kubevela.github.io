---
title: 标签管理
---
`labels` 和 `annotations` 运维特征，允许你将标签和注释附加到组件。通过标签和注释，我们在实现业务逻辑时，能十分灵活的根据它们来对应地调用组件。

## 字段说明

给 Pod 打注解：

```shell
$ vela show annotations
# Properties
+-----------+-------------+-------------------+----------+---------+
|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
+-----------+-------------+-------------------+----------+---------+
| -         |             | map[string]string | true     |         |
+-----------+-------------+-------------------+----------+---------+
```

给 Pod 打标签：

```shell
$ vela show labels
# Properties
+-----------+-------------+-------------------+----------+---------+
|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
+-----------+-------------+-------------------+----------+---------+
| -         |             | map[string]string | true     |         |
+-----------+-------------+-------------------+----------+---------+
```

字段类型均是字符串键值对。

## 如何使用

首先，我们准备一个应用部署计划 YAML 如下：

```shell
# myapp.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: labels
          properties:
            "release": "stable"
        - type: annotations
          properties:
            "description": "web application"
```

最终标签和注解为打到工作负载底层的 Pod 资源上。