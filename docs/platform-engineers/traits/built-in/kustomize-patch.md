---
title: Patch for Kustomize Component
---

## kustomize-patch Specification

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

### How to use

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

## kustomize-json-patch Specification

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

### How to use

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

### kustomize-strategy-merge Specification

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

### How to use

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
