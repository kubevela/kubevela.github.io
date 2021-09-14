---
title:  应用组件间的依赖和参数传递
---

本节将介绍如何在 KubeVela 中进行组件间的参数传递。

## 参数传递

在 KubeVela 中，可以在组件中通过 outputs 和 inputs 来指定要传输的数据。

### Outputs

outputs 由 `name` 和 `valueFrom` 组成。`name` 声明了这个 output 的名称，在 input 中将通过 `name` 引用 output。

`valueFrom` 有以下几种写法：
1. 直接通过字符串表示值，如：`valueFrom: testString`。
2. 通过表达式来指定值，如：`valueFrom: output.metadata.name`。注意，`output` 为固定内置字段，指向组件中被部署在集群里的资源。
3. 通过 `+` 来任意连接以上两种写法，最终值是计算后的字符串拼接结果，如：`valueFrom: output.metadata.name + "testString"`。

### Inputs

inputs 由 `name` 和 `parameterKey` 组成。`name` 声明了这个 input 从哪个 output 中取值，`parameterKey` 为一个表达式，将会把 input 取得的值赋给对应的字段。

如：
1. 指定 inputs:

```yaml
...
- name: wordpress
  type: helm
  inputs:
    - from: mysql-svc
      parameterKey: properties.values.externalDatabase.host
```

2. 经过渲染后，该组件的 `properties.values.externalDatabase.host` 字段中会被赋上值，效果如下所示：

```yaml
...
- name: wordpress
  type: helm
  properties:
    values:
      externalDatabase:
        host: <input value>
```

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
          valueFrom: output.metadata.name + ".default.svc.cluster.local"
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