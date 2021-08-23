---
title: 修改 Kustomize 配置
---
本小节将介绍如何使用 trait patch 交付的 Kustomize 组件。

### 开始之前

> ⚠️ 请已安装 [KubeVela CLI 命令行工具](../../getting-started/quick-install.mdx##3)

> 🔧 开启 [fluxcd](../addons/fluxcd) 插件即可使用 kustomize 类型组件，并按照本文档进行修改。

### 如何使用

本部分将介绍 3 个可以 patch `kustomize` 类型组件的 trait，下面是一个简单介绍

kustomize-patch / kustomize-json-patch / kustomize-strategy-merge

| Trait                    | 简介                                                         |
| ------------------------ | ------------------------------------------------------------ |
| kustomize-patch          | 支持以 inline YAML 字符串形式支持 strategy Merge 和 JSON6902 格式的 patch。 |
| kustomize-json-patch     | 支持以 JSON6902 格式对 kustomize 进行 patch                  |
| kustomize-strategy-merge | 支持以 YAML 格式对 kustomize 进行 patch                      |

#### kustomize-patch

kustomize-patch 类型的 trait 只能以字符串形式描述 patch 内容。查看其相关信息：

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

只能以字符串形式指 patch 字段为字符串，使用示例如下

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

 上面的例子给原本的 kustomize 添加了一个 patch ： 筛选出带有 app=podinfo 标签的 Pod 打了 patch。

#### kustomize-json-patch

可以以 [JSON6902 格式](https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/patchesjson6902/)进行 patch。先来了解其信息：

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

使用示例如下：

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
上面这个例子中给所有 Deployment 对象的 annotations 添加了一条：`key: value`

#### kustomize-strategy-merge

可以以  格式进行 patch。先来了解其信息：

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
| undefined |             | map[string](null|bool|string|bytes|{...}|[...]|number) | true     |         |
```

使用示例如下：

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
            patchesJson:
              - apiVersion: apps/v1
                kind: Deployment
                metadata:
                  name: podinfo
                spec:
                  template:
                    spec:
                      serviceAccount: custom-service-account
```

上面这个例子中用 YAML 原生格式（即非内嵌字符串格式）对原本 kustomize 进行了patch。

