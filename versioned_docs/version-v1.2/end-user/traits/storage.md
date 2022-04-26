---
title: Storage
---

The `storage` trait allows you to manage storages for the component.

## How to use

`storage` can help us create and bind storages like `pvc`, `emptyDir`, `secret`, or `configMap` for our component. For `secret` and `configMap` type storage, we can also bind it to the `env`.

> If you don't want to create the storages automatically, you can set `mountOnly` to true.

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

## Specification


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
