---
title: 内置运维特征类型
---

本文档将展示所有内置运维特征的参数列表。

## gateway

`gateway` 运维特征通过一个可用的域名在公网暴露一个组件的服务。

### 作用的 Component 类型

* 所有组件类型

### 参数说明

| NAME        | DESCRIPTION                                        | TYPE           | REQUIRED | DEFAULT |
| ----------- | -------------------------------------------------- | -------------- | -------- | ------- |
| http        | 定义一组网关路径到 Pod 服务端口的映射关系                 | map[string]int | true     |         |
| class       | 所使用的 kubernetes ingress class                    | string         | true     | nginx   |
| classInSpec | 在 kubernetes ingress 的 '.spec.ingressClassName' 定义 ingress class 而不是在 'kubernetes.io/ingress.class' 注解中定义 | bool           | false    | false   |
| domain      | 暴露服务所绑定的域名                                   | string         | true     |         |

### 样例
```yaml
# vela-app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

## Scaler

`scaler` 为组件配置副本数。

### 作用的 Component 类型

* webservice
* worker
* task

### 参数说明

| NAME   |          DESCRIPTION           | TYPE | REQUIRED | DEFAULT |
| -------- | -------------- | ---- | -------- | ------ |
| replicas | 工作负载的 Pod 个数 | int  | true     |       1 |

### 样例

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

## AutoScaler

`autoscaler` 运维特征用于配置自动扩缩容，背后基于 Kubernetes 的 HPA 实现。

> 注：这个运维特征默认在 `VelaUX` 处隐藏，你可以在 CLI 侧使用。

### 作用的 Component 类型

* 所有基于 `deployments.apps` 类型的组件


### 参数说明

|  NAME   |                                   DESCRIPTION                                   | TYPE | REQUIRED | DEFAULT |
| -------- | -------------- | ---- | -------- | ------ |
| min     | 能够将工作负载缩容到的最小副本个数    | int  | true     |       1 |
| max     | 能够将工作负载扩容到的最大副本个数  | int  | true     |      10 |
| cpuUtil | 每个容器的平均 CPU 利用率 例如, 50 意味者 CPU 利用率为 50% | int  | true     |      50 |

### 样例

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

## Storage

我们使用运维特征里的 `storage` 来管理存储。

`storage` 可以帮助我们创建并管理 `pvc`、`emptyDir`、`secret`、`configMap` 等类型的存储。对于 `secret` 及 `configMap` 类的存储，还支持绑定到 `env` 当中。

> 如果你不希望自动创建这些资源，可以将 `mountOnly` 字段设置为 true。


### 作用的 Component 类型

* 所有基于 `deployments.apps` 类型的组件

### 参数说明

|       NAME       | DESCRIPTION |              TYPE               | REQUIRED |  DEFAULT   |
| ---------------- | ----------- | ------------------------------- | -------- | ---------- |
| name             |             | string                          | true     |            |
| volumeMode       |             | string                          | true     | Filesystem |
| mountPath        |             | string                          | true     |            |
| mountOnly        |             | bool                            | true     | false      |
| accessModes      |             | [...]                           | true     |            |
| volumeName       |             | string                          | false    |            |
| storageClassName |             | string                          | false    |            |
| resources        |             | [resources](#resources)         | false    |            |
| dataSourceRef    |             | [dataSourceRef](#datasourceref) | false    |            |
| dataSource       |             | [dataSource](#datasource)       | false    |            |
| selector         |             | [selector](#selector)           | false    |            |

#### emptyDir

|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
| --------- | ----------- | ------ | -------- | ------- |
| name      |             | string | true     |         |
| medium    |             | string | true     | empty   |
| mountPath |             | string | true     |         |


#### secret

|    NAME     | DESCRIPTION |                          TYPE                          | REQUIRED | DEFAULT |
| ----------- | ----------- | ------------------------------------------------------ | -------- | ------- |
| name        |             | string                                                 | true     |         |
| defaultMode |             | int                                                    | true     |     420 |
| items       |             | [[]items](#items)                                      | false    |         |
| mountPath   |             | string                                                 | true     |         |
| mountToEnv  |             | [mountToEnv](#mounttoenv)                              | false    |         |
| mountOnly   |             | bool                                                   | true     | false   |
| data        |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | false    |         |
| stringData  |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | false    |         |
| readOnly    |             | bool                                                   | true     | false   |


## configMap

|    NAME     | DESCRIPTION |                          TYPE                          | REQUIRED | DEFAULT |
| ----------- | ----------- | ------------------------------------------------------ | -------- | ------- |
| name        |             | string                                                 | true     |         |
| defaultMode |             | int                                                    | true     |     420 |
| items       |             | [[]items](#items)                                      | false    |         |
| mountPath   |             | string                                                 | true     |         |
| mountToEnv  |             | [mountToEnv](#mounttoenv)                              | false    |         |
| mountOnly   |             | bool                                                   | true     | false   |
| data        |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | false    |         |
| readOnly    |             | bool                                                   | true     | false   |

### 样例

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
        image: oamdev/hello-world
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

## Labels 

`labels` 运维特征可以用来为工作负载上的 Pod 打特殊的标签。

> 注：这个运维特征默认在 `VelaUX` 处隐藏，你可以在 CLI 侧使用。

### 作用的 Component 类型

* 所有组件类型

### 参数说明

|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
| --------- | ----------- | ----------------- | -------- | ------- |
| -         |             | map[string]string | true     |         |

### 样例

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
        image: oamdev/hello-world
        port: 8000
      traits:
        - type: labels
          properties:
            "release": "stable"
```


## Annotations

`annotations` 运维特征允许用户在工作负载的 Pod 上加入注解。

> 注：这个运维特征默认在 `VelaUX` 处隐藏，你可以在 CLI 侧使用。

### 作用的 Component 类型

* 所有组件类型

### 参数说明

|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
| --------- | ----------- | ----------------- | -------- | ------- |
| -         |             | map[string]string | true     |         |

### 样例

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
        image: oamdev/hello-world
        port: 8000
      traits:
        - type: annotations
          properties:
            "description": "web application"
```

## kustomize-patch

`kustomize-patch` 支持以 inline YAML 字符串形式支持 strategy Merge 和 JSON6902 格式的 patch。

> Note: To use `kustomize` trait, you must enable `fluxcd` addon first. 

### 作用的 Component 类型

* kustomize

### 参数说明


|  NAME   |                          DESCRIPTION                          |         TYPE          | REQUIRED | DEFAULT |
| ------- | ------------------------------------------------------------- | --------------------- | -------- | ------ |
| patches | 在目标上进行 StrategicMerge 或者 JSON6902 patch 的列表 | [[]patches](#patches) | true     |         |


#### patches

|  NAME  |                    DESCRIPTION                    |       TYPE        | REQUIRED | DEFAULT |
| ------ | ------------------------------------------------- | ----------------- | -------- | ------ |
| patch  | Inline yaml 格式的 patch                | string            | true     |         |
| target | patch 需要作用在的目标 | [target](#target) | true     |         |



##### target

|        NAME        | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
| ------------------ | ----------- | ------ | -------- | ------- |
| name               |             | string | false    |         |
| group              |             | string | false    |         |
| version            |             | string | false    |         |
| kind               |             | string | false    |         |
| namespace          |             | string | false    |         |
| annotationSelector |             | string | false    |         |
| labelSelector      |             | string | false    |         |

### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      # ... omitted for brevity
      traits:
        - type: kustomize-patch
          properties:
            patches:
              - patch: |-
                  apiVersion: v1
                  kind: Pod
                  metadata:
                    name: not-used
                    labels:
                      app.kubernetes.io/part-of: test-app
                target:
                  labelSelector: "app=podinfo"
```

在这个例子中，`kustomize-patch` 会在所有标记了 `app=podinfo` 上的 Pod 上做 patch 。

## kustomize-json-patch 

支持以 [JSON6902](https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/patchesjson6902/) 格式对 kustomize 进行 patch。

### 作用的 Component 类型

* kustomize

### 参数说明


# Properties

|    NAME     |        DESCRIPTION        |             TYPE              | REQUIRED | DEFAULT |
| ----------- | ------------------------- | ----------------------------- | -------- | ------- |
| patchesJson |  JSON6902 patch 的列表 | [[]patchesJson](#patchesJson) | true     |         |



#### patchesJson

|  NAME  | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
| ------ | ----------- | ----------------- | -------- | ------- |
| patch  |             | [patch](#patch)   | true     |         |
| target |             | [target](#target) | true     |         |



##### target

|        NAME        | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
| ------------------ | ----------- | ------ | -------- | ------- |
| name               |             | string | false    |         |
| group              |             | string | false    |         |
| version            |             | string | false    |         |
| kind               |             | string | false    |         |
| namespace          |             | string | false    |         |
| annotationSelector |             | string | false    |         |
| labelSelector      |             | string | false    |         |



##### patch
| NAME  | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
| ----- | ----------- | ------ | -------- | ------- |
| path  |             | string | true     |         |
| op    |             | string | true     |         |
| value |             | string | false    |         |


### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      # ... omitted for brevity
      traits:
        - type: kustomize-json-patch
          properties:
            patchesJson:
              - target:
                  version: v1
                  kind: Deployment
                  name: podinfo
                patch:
                - op: add
                  path: /metadata/annotations/key
                  value: value
```

## kustomize-strategy-merge 

支持以 YAML 格式对 kustomize 进行 patch。

### 作用的 Component 类型

* kustomize

### 参数说明

|         NAME          |                        DESCRIPTION                        |                       TYPE                        | REQUIRED | DEFAULT |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------- | -------- | ------- |
| patchesStrategicMerge |           patchesStrategicMerge 列表                       | [[]patchesStrategicMerge](#patchesStrategicMerge) | true     |         |



#### patchesStrategicMerge

|   NAME    | DESCRIPTION |                          TYPE                          | REQUIRED | DEFAULT |
| -------- | -------------- | ---- | -------- | ------ |
|  |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | true     |         |


### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      # ... omitted for brevity
      traits:
        - type: kustomize-strategy-merge
          properties:
            patchesStrategicMerge:
              - apiVersion: apps/v1
                kind: Deployment
                metadata:
                  name: podinfo
                spec:
                  template:
                    spec:
                      serviceAccount: custom-service-account
```

## service-binding

`service-binding` 运维特征会将一个 Kubernetes 的 secret 资源映射到容器中作为容器的环境变量。

### 作用的 Component 类型

* webservice
* worker
* task
* cron-task


### 参数说明

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | -------------
envMappings | 主键和 secret 名称的键值对 | map[string][KeySecret](#keysecret) | true |

#### KeySecret
|  Name | Description | Type | Required | Default |
|------ | ----------- | ---- | -------- | --------|
| key  | 主键名称      | string | false  |         |
| secret | secret 名称 | string | true  |         |

### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: init-secret-with-http
  namespace: default
spec:
  components:
  - name: my-server
    type: webservice
    properties:
      image: oamdev/hello-world
      port: 8000
    traits:
    - type: service-binding
      properties:
        envMappings:
          MY_ENV:
            secret: secret1
          MY_ENV2:
            secret: secret2
            key: test
```

## sidecar

`sidecar` 能够为你的组件容器添加一个边车容器。

### 作用的 Component 类型

* webservice
* worker
* task
* cron-task

### 参数说明

|  NAME   |               DESCRIPTION               |         TYPE          | REQUIRED | DEFAULT |
| ------- | --------------------------------------- | --------------------- | -------- | ------- |
| name    |   容器名称   | string                | true     |         |
| cmd     | 容器的执行命令 | []string              | false    |         |
| image   | 容器镜像  | string                | true     |         |
| volumes | 挂载卷    | [[]volumes](#volumes) | false    |         |

#### volumes

|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
| --------- | ----------- | ------ | -------- | ------- |
| name      |             | string | true     |         |
| path      |             | string | true     |         |

### 样例

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app-with-sidecar
spec:
  components:
    - name: log-gen-worker
      type: worker
      properties:
        image: busybox
        cmd:
          - /bin/sh
          - -c
          - >
            i=0;
            while true;
            do
              echo "$i: $(date)" >> /var/log/date.log;
              i=$((i+1));
              sleep 1;
            done
        volumes:
          - name: varlog
            mountPath: /var/log
            type: emptyDir
      traits:
        - type: sidecar
          properties:
            name: count-log
            image: busybox
            cmd: [ /bin/sh, -c, 'tail -n+1 -f /var/log/date.log']
            volumes:
              - name: varlog
                path: /var/log
```







