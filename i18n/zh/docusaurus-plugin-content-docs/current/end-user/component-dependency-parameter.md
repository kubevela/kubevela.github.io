---
title:  应用组件间的依赖和参数传递
---

本节将介绍如何在 KubeVela 中进行组件间的参数传递。

## 如何使用

假设我们希望在本地启动一个 WordPress，而这个 Wordpress 的数据存放在一个 MySQL 数据库中，我们需要将这个 MySQL 的地址传递给 WordPress。

部署如下应用部署计划：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: wordpress-with-mysql
  namespace: default
spec:
  components:
    - name: mysql
      type: helm
      outputs:
        # 将 service 地址作为 output
        - name: mysql-svc
          exportKey: output.metadata.name + ".default.svc.cluster.local"
      properties:
        repoType: helm
        url: https://charts.bitnami.com/bitnami
        chart: mysql
        version: "8.8.2"
        values:
          auth:
            rootPassword: mypassword
    - name: wordpress
      type: helm
      inputs:
        # 将 mysql 的 service 地址赋值到 host 中
        - from: mysql-svc
          parameterKey: properties.values.externalDatabase.host
      properties:
        repoType: helm
        url: https://charts.bitnami.com/bitnami
        chart: wordpress
        version: "12.0.3"
        values:
          mariadb:
            enabled: false
          externalDatabase:
            user: root
            password: mypassword
            database: mysql
            port: 3306
```

## 期望结果

WordPress 已被成功部署，且与 MySQL 正常连接。