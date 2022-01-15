---
title:  数据绑定
---

本节将介绍 `service-binding` 运维特征的用法，它能将数据从 Kubernetes `Secret` 绑定到应用程序所在容器的 `ENV` 上。

## 字段说明

```
$ vela show service-binding
# Properties
+-------------+------------------------------------------------+------------------+----------+---------+
|    NAME     |                  DESCRIPTION                   |       TYPE       | REQUIRED | DEFAULT |
+-------------+------------------------------------------------+------------------+----------+---------+
| envMappings | The mapping of environment variables to secret | map[string]{...} | true     |         |
+-------------+------------------------------------------------+------------------+----------+---------+

```

## 如何使用

1. 创建一个 Secret

```shell
$ kubectl create secret generic db-conn-example --from-literal=password=123  --from-literal=endpoint=https://xxx.com --from-literal=username=myname
secret/db-conn-example created
```

2. 将 Secret 绑定到工作负载的环境变量中

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: binding-test-comp
      type: webservice
      properties:
        image: zzxwill/flask-web-application:v0.3.1-crossplane
        ports: 80
      traits:
        - type: service-binding
          properties:
            envMappings:
              # environments refer to db-conn secret
              DB_PASSWORD:
                secret: db-conn-example
                key: password            # 1) 如果 ENV 和 Secret 不一致，则 Secret 必须被设置
              endpoint:
                secret: db-conn-example          # 2) 如果 ENV 和 Secret 一致，则 Secret 可以缺省不写
              username:
                secret: db-conn-example
```

部署这个 YAML，数据绑定的运维特征会读取名为 `db-conn-example` 的 Kubernetes Secret 对象，
并注入 `binding-test-comp` 的这个组件的环境变量 ENV 中。