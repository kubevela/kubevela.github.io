---
title: Built-in Trait Type
---

This documentation will walk through the built-in traits.

## gateway

The `gateway` trait exposes a component to public Internet via a valid domain.

### 作用的 Component 类型

* 所有组件类型

### 参数说明

| NAME        | DESCRIPTION                                                                                        | TYPE           | REQUIRED | DEFAULT |
| ----------- | -------------------------------------------------------------------------------------------------- | -------------- | -------- | ------- |
| http        | Specify the mapping relationship between the http path and the workload port                       | map[string]int | true     |         |
| class       | Specify the class of ingress to use                                                                | string         | true     | nginx   |
| classInSpec | Set ingress class in '.spec.ingressClassName' instead of 'kubernetes.io/ingress.class' annotation. | bool           | false    | false   |
| domain      | Specify the domain you want to expose                                                              | string         | true     |         |

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


## rollout

Rollout Trait performs a rolling update on Component.

### 作用的 Component 类型

* [webservice](../components/cue/webservice)
* worker
* clonset

### 参数说明

灰度发布运维特征的所有配置项

| 名称           | 描述         | 类型             | 是否必须 | 默认值                                 |
| -------------- | ------------ | ---------------- | -------- | -------------------------------------- |
| targetRevision | 目标组件版本 | string           | 否       | 当该字段为空时，一直指向组件的最新版本 |
| targetSize     | 目标副本个数 | int              | 是       | 无                                     |
| rolloutBatches | 批次发布策略 | rolloutBatch数组 | 是       | 无                                     |
| batchPartition | 发布批次     | int              | 否       | 无，缺省为发布全部批次                 |

rolloutBatch的属性

| 名称     | 描述           | 类型 | 是否必须 | 默认值 |
| -------- | -------------- | ---- | -------- | ------ |
| replicas | 批次的副本个数 | int  | 是       | 无     |


### 样例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: rollout-trait-test
spec:
  components:
    - name: express-server
      type: webservice
      externalRevision: express-server-v1
      properties:
        image: stefanprodan/podinfo:4.0.3
      traits:
        - type: rollout
          properties:
            targetSize: 5
            rolloutBatches:
              - replicas: 2
              - replicas: 3
```

## Scaler

`scaler` 为组件配置副本数。

### 作用的 Component 类型

* webservice
* worker
* task

### 参数说明

```
$ vela show scaler
# Properties
+----------+--------------------------------+------+----------+---------+
|   NAME   |          DESCRIPTION           | TYPE | REQUIRED | DEFAULT |
+----------+--------------------------------+------+----------+---------+
| replicas | Specify the number of workload | int  | true     |       1 |
+----------+--------------------------------+------+----------+---------+
```

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
| data        |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | false    |         |
| stringData  |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | false    |         |
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
| data        |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | false    |         |
| readOnly    |             | bool                                                   | true     | false   |
+-------------+-------------+--------------------------------------------------------+----------+---------+


```

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

`labels` trait allow us to mark labels on Pod for workload.

> 注：这个运维特征默认在 `VelaUX` 处隐藏，你可以在 CLI 侧使用。

### 作用的 Component 类型

* 所有组件类型

### 参数说明

```shell
$ vela show labels
# Properties
+-----------+-------------+-------------------+----------+---------+
|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
+-----------+-------------+-------------------+----------+---------+
| -         |             | map[string]string | true     |         |
+-----------+-------------+-------------------+----------+---------+
```

They're all string Key-Value pairs.

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

`annotations` trait allow us to mark annotations on Pod for workload.

> 注：这个运维特征默认在 `VelaUX` 处隐藏，你可以在 CLI 侧使用。

### 作用的 Component 类型

* 所有组件类型

### 参数说明

```shell
$ vela show annotations
# Properties
+-----------+-------------+-------------------+----------+---------+
|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
+-----------+-------------+-------------------+----------+---------+
| -         |             | map[string]string | true     |         |
+-----------+-------------+-------------------+----------+---------+
```

They're all string Key-Value pairs.

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

```shell
vela show kustomize-patch
```

```shell
# Properties
+---------+---------------------------------------------------------------+-----------------------+----------+---------+
|  NAME   |                          DESCRIPTION                          |         TYPE          | REQUIRED | DEFAULT |
+---------+---------------------------------------------------------------+-----------------------+----------+---------+
| patches | a list of StrategicMerge or JSON6902 patch to selected target | [[]patches](#patches) | true     |         |
+---------+---------------------------------------------------------------+-----------------------+----------+---------+


## patches
+--------+---------------------------------------------------+-------------------+----------+---------+
|  NAME  |                    DESCRIPTION                    |       TYPE        | REQUIRED | DEFAULT |
+--------+---------------------------------------------------+-------------------+----------+---------+
| patch  | Inline patch string, in yaml style                | string            | true     |         |
| target | Specify the target the patch should be applied to | [target](#target) | true     |         |
+--------+---------------------------------------------------+-------------------+----------+---------+


### target
+--------------------+-------------+--------+----------+---------+
|        NAME        | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+--------------------+-------------+--------+----------+---------+
| name               |             | string | false    |         |
| group              |             | string | false    |         |
| version            |             | string | false    |         |
| kind               |             | string | false    |         |
| namespace          |             | string | false    |         |
| annotationSelector |             | string | false    |         |
| labelSelector      |             | string | false    |         |
+--------------------+-------------+--------+----------+---------+
```

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

In this example, the `kustomize-patch` will patch the content for all Pods with label `app=podinfo`.

## kustomize-json-patch 

支持以 [JSON6902](https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/patchesjson6902/) 格式对 kustomize 进行 patch。

### 作用的 Component 类型

* kustomize

### 参数说明

```shell
vela show kustomize-json-patch
```

```shell
# Properties
+-------------+---------------------------+-------------------------------+----------+---------+
|    NAME     |        DESCRIPTION        |             TYPE              | REQUIRED | DEFAULT |
+-------------+---------------------------+-------------------------------+----------+---------+
| patchesJson | A list of JSON6902 patch. | [[]patchesJson](#patchesJson) | true     |         |
+-------------+---------------------------+-------------------------------+----------+---------+


## patchesJson
+--------+-------------+-------------------+----------+---------+
|  NAME  | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
+--------+-------------+-------------------+----------+---------+
| patch  |             | [patch](#patch)   | true     |         |
| target |             | [target](#target) | true     |         |
+--------+-------------+-------------------+----------+---------+


#### target
+--------------------+-------------+--------+----------+---------+
|        NAME        | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+--------------------+-------------+--------+----------+---------+
| name               |             | string | false    |         |
| group              |             | string | false    |         |
| version            |             | string | false    |         |
| kind               |             | string | false    |         |
| namespace          |             | string | false    |         |
| annotationSelector |             | string | false    |         |
| labelSelector      |             | string | false    |         |
+--------------------+-------------+--------+----------+---------+


### patch
+-------+-------------+--------+----------+---------+
| NAME  | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-------+-------------+--------+----------+---------+
| path  |             | string | true     |         |
| op    |             | string | true     |         |
| value |             | string | false    |         |
+-------+-------------+--------+----------+---------+
```

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

```shell
vela show kustomize-json-patch
```

```shell
# Properties
+-----------------------+-----------------------------------------------------------+---------------------------------------------------+----------+---------+
|         NAME          |                        DESCRIPTION                        |                       TYPE                        | REQUIRED | DEFAULT |
+-----------------------+-----------------------------------------------------------+---------------------------------------------------+----------+---------+
| patchesStrategicMerge | a list of strategicmerge, defined as inline yaml objects. | [[]patchesStrategicMerge](#patchesStrategicMerge) | true     |         |
+-----------------------+-----------------------------------------------------------+---------------------------------------------------+----------+---------+


## patchesStrategicMerge
+-----------+-------------+--------------------------------------------------------+----------+---------+
|   NAME    | DESCRIPTION |                          TYPE                          | REQUIRED | DEFAULT |
+-----------+-------------+--------------------------------------------------------+----------+---------+
| undefined |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | true     |         |
```

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

Service binding trait will bind data from Kubernetes `Secret` to the application container's ENV.

### 作用的 Component 类型

* webservice
* worker
* task
* cron-task


### 参数说明

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | -------------
envMappings | The mapping of environment variables to secret | map[string]#KeySecret | true |

#### KeySecret
Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | -------------
| key  | if key is empty, we will use envMappings key instead              | string            | false     |         |
| secret | Kubernetes secret name | string | true     |         |

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

The `sidecar` trait allows you to attach a sidecar container to the component.

### 作用的 Component 类型

* webservice
* worker
* task
* cron-task

### 参数说明

```console
# Properties
+---------+-----------------------------------------+-----------------------+----------+---------+
|  NAME   |               DESCRIPTION               |         TYPE          | REQUIRED | DEFAULT |
+---------+-----------------------------------------+-----------------------+----------+---------+
| name    | Specify the name of sidecar container   | string                | true     |         |
| cmd     | Specify the commands run in the sidecar | []string              | false    |         |
| image   | Specify the image of sidecar container  | string                | true     |         |
| volumes | Specify the shared volume path          | [[]volumes](#volumes) | false    |         |
+---------+-----------------------------------------+-----------------------+----------+---------+


## volumes
+-----------+-------------+--------+----------+---------+
|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-----------+-------------+--------+----------+---------+
| name      |             | string | true     |         |
| path      |             | string | true     |         |
+-----------+-------------+--------+----------+---------+
```

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

## affinity

The `affinity` trait allows you to add affinity on k8s pod, properties include pod affinity/anti-affinity, as well as node affinity and tolerance.

> 注：这个运维特征默认在 `VelaUX` 处隐藏，你可以在 CLI 侧使用。

### 作用的 Component 类型

* webservice
* worker
* task
* cron-task

### 参数说明

```console
# Properties
+------------------+---------------------------------------------------------+------------------------------------+----------+---------+
|       NAME       |                     DESCRIPTION                         |                TYPE                | REQUIRED | DEFAULT |
+------------------+---------------------------------------------------------+------------------------------------+----------+---------+
| podAffinity      | Specify the pod affinity scheduling rules               | podAffinity(#podAffinity)          | false    |         |
| podAntiAffinity  | Specify the pod anti-affinity scheduling rules          | podAntiAffinity(#podAntiAffinity)  | false    |         |
| nodeAffinity     | Specify the node affinity scheduling rules for the pod  | nodeAffinity(#nodeAffinity)        | false    |         |
| tolerations      | Specify tolerant taint                                  | tolerations(#tolerations)          | false    |         |
+------------------+---------------------------------------------------------+------------------------------------+----------+---------+

## podAffinity
+----------+-----------------------------------------------------------------+----------------------------------------+----------+---------+
|   NAME   |                          DESCRIPTION                            |                  TYPE                  | REQUIRED | DEFAULT |
+----------+-----------------------------------------------------------------+----------------------------------------+----------+---------+
| required | Specify the required during scheduling ignored during execution | [podAffinityTerm](#podAffinityTerm)    | false    |         |
| preferred| Specify the preferred during scheduling ignored during execution| [podferredTerm](#podferredTerm)        | false    |         |
+----------+-----------------------------------------------------------------+----------------------------------------+----------+---------+

### podferredTerm
+-----------------+---------------------------------------------------------------------------+----------------------------------+----------+---------+
|       NAME      |                             DESCRIPTION                                   |              TYPE                | REQUIRED | DEFAULT |
+-----------------+---------------------------------------------------------------------------+----------------------------------+----------+---------+
| weight          | Specify weight associated with matching the corresponding podAffinityTerm | int(>=1, <=100)                  | true     |         |
| podAffinityTerm |                                                                           | podAffinityTerm(#podAffinityTerm)| true     |         |
+-----------------+---------------------------------------------------------------------------+----------------------------------+----------+---------+

### podAffinityTerm
+---------------------+-------------+----------------------------------+----------+---------+
|       NAME          | DESCRIPTION |              TYPE                | REQUIRED | DEFAULT |
+---------------------+-------------+----------------------------------+----------+---------+
| labelSelector       |             | labelSelector(#labelSelector)    | false    |         |
| namespaces          |             | [string]                         | false    |         |
| topologyKey         |             | string                           | true     |         |
| namespaceSelector   |             | labelSelector(#labelSelector)    | false    |         |
+---------------------+-------------+----------------------------------+----------+---------+

#### labelSelector
+---------------------+-------------+--------------------------------------+----------+---------+
|       NAME          | DESCRIPTION |                TYPE                  | REQUIRED | DEFAULT |
+---------------------+-------------+--------------------------------------+----------+---------+
| matchLabels         |             | map[string]string                    | false    |         |
| matchExpressions    |             | [matchExpressions]#matchExpressions  | false    |         |
+---------------------+-------------+--------------------------------------+----------+---------+

##### matchExpressions
+---------------------+-------------+-----------------------------------------+----------+---------+
|       NAME          | DESCRIPTION |                   TYPE                  | REQUIRED | DEFAULT |
+---------------------+-------------+-----------------------------------------+----------+---------+
| key                 |             | string                                  | true     |         |
| operator            |             | string(In/NotIn/Exists/DoesNotExist)    | false    | In      |
| values              |             | [string]                                | false    |         |
+---------------------+-------------+-----------------------------------------+----------+---------+

## podAntiAffinity
+----------+-----------------------------------------------------------------+----------------------------------------+----------+---------+
|   NAME   |                          DESCRIPTION                            |                  TYPE                  | REQUIRED | DEFAULT |
+----------+-----------------------------------------------------------------+----------------------------------------+----------+---------+
| required | Specify the required during scheduling ignored during execution | [[]podAffinityTerm](#podAffinityTerm)  | false    |         |
| preferred| Specify the preferred during scheduling ignored during execution| [[]podferredTerm](#podferredTerm)      | false    |         |
+----------+-----------------------------------------------------------------+----------------------------------------+----------+---------+

## nodeAffinity
+----------+-----------------------------------------------------------------+----------------------------------------+----------+---------+
|   NAME   |                          DESCRIPTION                            |                  TYPE                  | REQUIRED | DEFAULT |
+----------+-----------------------------------------------------------------+----------------------------------------+----------+---------+
| required | Specify the required during scheduling ignored during execution | nodeSelectorTerms(#nodeSelectorTerms)  | false    |         |
| preferred| Specify the preferred during scheduling ignored during execution| [nodeferredTerm](#nodeferredTerm)      | false    |         |
+----------+-----------------------------------------------------------------+----------------------------------------+----------+---------+

### nodeSelectorTerms
+---------------------+-------------+-----------------------------------------+----------+---------+
|       NAME          | DESCRIPTION |                   TYPE                  | REQUIRED | DEFAULT |
+---------------------+-------------+-----------------------------------------+----------+---------+
| nodeSelectorTerms   |             | [nodeSelectorTerm](#nodeSelectorTerm)   | true     |         |
+---------------------+-------------+-----------------------------------------+----------+---------+

#### nodeSelectorTerm
+---------------------+-------------+-----------------------------------------+----------+---------+
|       NAME          | DESCRIPTION |                   TYPE                  | REQUIRED | DEFAULT |
+---------------------+-------------+-----------------------------------------+----------+---------+
| matchExpressions    |             | [nodeSelecor](#nodeSelecor)             | false    |         |
| matchFields         |             | [nodeSelecor](#nodeSelecor)             | false    |         |
+---------------------+-------------+-----------------------------------------+----------+---------+

##### nodeSelecor
+------------+-------------+--------------------------------------------+----------+---------+
|    NAME    | DESCRIPTION |                      TYPE                  | REQUIRED | DEFAULT |
+------------+-------------+--------------------------------------------+----------+---------+
| key        |             | string                                     | true     |         |
| operator   |             | string(In/NotIn/Exists/DoesNotExist/Gt/Lt) | false    | In      |
| values     |             | [string]                                   | false    |         |
+------------+-------------+--------------------------------------------+----------+---------+

### nodeferredTerm
+------------+-------------+--------------------------------------+----------+---------+
|    NAME    | DESCRIPTION |                 TYPE                 | REQUIRED | DEFAULT |
+------------+-------------+--------------------------------------+----------+---------+
| weight     |             | int(>=1, <=100)                      | true     |         |
| preferenc  |             | nodeSelectorTerm(#nodeSelectorTerm)  | true     |         |
+------------+-------------+--------------------------------------+----------+---------+

## tolerations
+--------------------+--------------------------------------------+-----------------------------------------------+----------+---------+
|        NAME        |                DESCRIPTION                 |                     TYPE                      | REQUIRED | DEFAULT |
+--------------------+--------------------------------------------+-----------------------------------------------+----------+---------+
| key                |                                            | string                                        | false    |         |
| operator           |                                            | string(Equal/Exists)                          | false    | Equal   |
| value              |                                            | string                                        | false    |         |
| effect             |                                            | string(NoSchedule/PreferNoSchedule/NoExecute) | false    |         |
| tolerationSeconds  | Specify the period of time the toleration  | int                                           | false    |         |
+--------------------+--------------------------------------------+-----------------------------------------------+----------+---------+

```

### 样例

```yaml
# app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
        labels:
          label-key: label-value
          to-delete-label-key: to-delete-label-value
      traits:
        - type: affinity
          properties:
            podAffinity:
              preferred:
                - weight: 1
                  podAffinityTerm:
                    labelSelector:
                      matchExpressions:
                        - key: "security"
                          values: ["S1"]
                    namespaces: ["default"]
                    topologyKey: "kubernetes.io/hostname"
```






