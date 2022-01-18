---
title: 存储管理
---

本小节会介绍，如何为应用部署计划的一个待交付组件，管理存储。我们使用运维特征里的 `storage` 来完成开发。

## 如何使用

`storage` 可以帮助我们创建并管理 `pvc`、`emptyDir`、`secret`、`configMap` 等类型的存储。对于 `secret` 及 `configMap` 类的存储，还支持绑定到 `env` 当中。

> 如果你不希望自动创建这些资源，可以将 `mountOnly` 字段设置为 true。

```yaml
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: storage-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        ports:
          - port: 8000
      traits:
        - type: storage
          properties:
            # PVC type storage
            pvc:
              - name: test1
                mountPath: /test/mount/pvc
            # EmptyDir type storage
            emptyDir:
              - name: test1
                mountPath: /test/mount/emptydir
            # ConfigMap type storage
            configMap:
              - name: test1
                mountPath: /test/mount/cm
                # Mount ConfigMap to Env
                mountToEnv:
                  envName: TEST_ENV
                  configMapKey: key1
                data:
                  key1: value1
                  key2: value2
            # Secret type storage
            secret:
              - name: test1
                mountPath: /test/mount/secret
                # Mount Secret to Env
                mountToEnv:
                  envName: TEST_SECRET
                  secretKey: key1
                data:
                  key1: dmFsdWUx
                  key2: dmFsdWUy

```

## 字段说明


```
$ vela show storage
# Properties

## pvc
+------------------+-------------+---------------------------------+----------+------------+
|       NAME       | DESCRIPTION |              TYPE               | REQUIRED |  DEFAULT   |
+------------------+-------------+---------------------------------+----------+------------+
| name             |             | string                          | true     |            |
| volumeMode       |             | string                          | true     | Filesystem |
| mountPath        |             | string                          | true     |            |
| mountOnly        |             | bool                            | true     | false      |
| accessModes      |             | [...]                           | true     |            |
| volumeName       |             | string                          | false    |            |
| storageClassName |             | string                          | false    |            |
| resources        |             | [resources](#resources)         | false    |            |
| dataSourceRef    |             | [dataSourceRef](#dataSourceRef) | false    |            |
| dataSource       |             | [dataSource](#dataSource)       | false    |            |
| selector         |             | [selector](#selector)           | false    |            |
+------------------+-------------+---------------------------------+----------+------------+

...

## emptyDir
+-----------+-------------+--------+----------+---------+
|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-----------+-------------+--------+----------+---------+
| name      |             | string | true     |         |
| medium    |             | string | true     | empty   |
| mountPath |             | string | true     |         |
+-----------+-------------+--------+----------+---------+

## secret
+-------------+-------------+--------------------------------------------------------+----------+---------+
|    NAME     | DESCRIPTION |                          TYPE                          | REQUIRED | DEFAULT |
+-------------+-------------+--------------------------------------------------------+----------+---------+
| name        |             | string                                                 | true     |         |
| defaultMode |             | int                                                    | true     |     420 |
| items       |             | [[]items](#items)                                      | false    |         |
| mountPath   |             | string                                                 | true     |         |
| mountToEnv  |             | [mountToEnv](#mountToEnv)                              | false    |         |
| mountOnly   |             | bool                                                   | true     | false   |
| data        |             | map[string](null|bool|string|bytes|{...}|[...]|number) | false    |         |
| stringData  |             | map[string](null|bool|string|bytes|{...}|[...]|number) | false    |         |
| readOnly    |             | bool                                                   | true     | false   |
+-------------+-------------+--------------------------------------------------------+----------+---------+

...

## configMap
+-------------+-------------+--------------------------------------------------------+----------+---------+
|    NAME     | DESCRIPTION |                          TYPE                          | REQUIRED | DEFAULT |
+-------------+-------------+--------------------------------------------------------+----------+---------+
| name        |             | string                                                 | true     |         |
| defaultMode |             | int                                                    | true     |     420 |
| items       |             | [[]items](#items)                                      | false    |         |
| mountPath   |             | string                                                 | true     |         |
| mountToEnv  |             | [mountToEnv](#mountToEnv)                              | false    |         |
| mountOnly   |             | bool                                                   | true     | false   |
| data        |             | map[string](null|bool|string|bytes|{...}|[...]|number) | false    |         |
| readOnly    |             | bool                                                   | true     | false   |
+-------------+-------------+--------------------------------------------------------+----------+---------+

...

```
