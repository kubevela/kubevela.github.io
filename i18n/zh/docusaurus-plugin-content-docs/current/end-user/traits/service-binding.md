---
title:  云资源绑定
---

本节将介绍 `service-binding` 运维特征的用法，它能将数据从 Kubernetes `Secret` 绑定到应用程序所在容器的 `ENV` 上。

### 开始之前

> ⚠️ 请安装 [KubeVela CLI 命令行工具](../../getting-started/quick-install.mdx##3)

### 如何使用

先熟悉 `service-binding` 运维特征的相关信息：

```
$ vela show service-binding
# Properties
+-------------+------------------------------------------------+------------------+----------+---------+
|    NAME     |                  DESCRIPTION                   |       TYPE       | REQUIRED | DEFAULT |
+-------------+------------------------------------------------+------------------+----------+---------+
| envMappings | The mapping of environment variables to secret | map[string]{...} | true     |         |
+-------------+------------------------------------------------+------------------+----------+---------+
```

然后编写一个名为 `webapp` 的应用部署计划来讲解：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: express-server
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
                secret: db-conn
                key: password            # 1) 如果 ENV 和 Secret 不一致，则 Secret 必须被设置
              endpoint:
                secret: db-conn          # 2) 如果 ENV 和 Secret 一致，则 Secret 可以缺省不写
              username:
                secret: db-conn

    - name: sample-db
      type: alibaba-rds
      properties:
        name: sample-db
        engine: mysql
        engineVersion: "8.0"
        instanceClass: rds.mysql.c1.large
        username: oamtest
        secretName: db-conn
```
部署这个 YAML：

```
$ kubectl apply -f webapp.yaml 
application.core.oam.dev/webapp created
```

我们在 alibaba-rds 获取的 `secretName: db-conn` 将会由 `service-binding` 对象进行转发，并注入 express-server 的这个组件的环境变量 ENV 中。