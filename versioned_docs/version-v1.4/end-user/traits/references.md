---
title: Built-in Trait Type
---

This documentation will walk through the built-in traits.

## gateway

The `gateway` trait exposes a component to public Internet via a valid domain.

### Apply To Component Types

* all component types

### Parameters

| NAME        | DESCRIPTION                                                                                        | TYPE           | REQUIRED | DEFAULT |
| ----------- | -------------------------------------------------------------------------------------------------- | -------------- | -------- | ------- |
| http        | Specify the mapping relationship between the http path and the workload port                       | map[string]int | true     |         |
| class       | Specify the class of ingress to use                                                                | string         | true     | nginx   |
| classInSpec | Set ingress class in '.spec.ingressClassName' instead of 'kubernetes.io/ingress.class' annotation. | bool           | false    | false   |
| domain      | Specify the domain you want to expose                                                              | string         | true     |         |


### Examples
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

The `scaler` trait allows you to change the replicas for the component.

### Apply To Component Types

* webservice
* worker
* task

### Parameters

|   NAME   |          DESCRIPTION           | TYPE | REQUIRED | DEFAULT |
| -------- | ------------------------------- | ---- | -------- | ------- |
| replicas | Specify the number of workload | int  | true     |       1 |

### Examples

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

`autoscaler` trait use K8s HPA to control the replica of component.

> Note: `autoscaler` trait is hidden by default in `VelaUX`, you can use it in CLI.

### Apply To Component Types

* All component based on `deployments.apps`

### Parameters


| NAME    | DESCRIPTION                                                                     | TYPE | REQUIRED | DEFAULT |
| ------- | ------------------------------------------------------------------------------- | ---- | -------- | ------- |
| min     | Specify the minimal number of replicas to which the autoscaler can scale down   | int  | true     | 1       |
| max     | Specify the maximum number of of replicas to which the autoscaler can scale up  | int  | true     | 10      |
| cpuUtil | Specify the average cpu utilization, for example, 50 means the CPU usage is 50% | int  | true     | 50      |

### Examples

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

The `storage` trait allows you to manage storages for the component.

`storage` can help us create and bind storages like `pvc`, `emptyDir`, `secret`, or `configMap` for our component. For `secret` and `configMap` type storage, we can also bind it to the `env`.

> If you don't want to create the storages automatically, you can set `mountOnly` to true.

### Apply To Component Types

* All component based on `deployments.apps`

### Parameters

|       NAME       | DESCRIPTION |              TYPE               | REQUIRED |  DEFAULT   |
| -------- | ------------------------------- | ---- | -------- | ------- |
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

#### emptyDir

|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
| -------- | ------------------------------- | ---- | -------- | ------- |
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
| mountToEnv  |             | [mountToEnv](#mountToEnv)                              | false    |         |
| mountOnly   |             | bool                                                   | true     | false   |
| data        |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | false    |         |
| stringData  |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | false    |         |
| readOnly    |             | bool                                                   | true     | false   |

#### configMap

|    NAME     | DESCRIPTION |                          TYPE                          | REQUIRED | DEFAULT |
| --------    | ----------- | ------------------------------------------------------ | -------- | ------- |
| name        |             | string                                                 | true     |         |
| defaultMode |             | int                                                    | true     |     420 |
| items       |             | [[]items](#items)                                      | false    |         |
| mountPath   |             | string                                                 | true     |         |
| mountToEnv  |             | [mountToEnv](#mountToEnv)                              | false    |         |
| mountOnly   |             | bool                                                   | true     | false   |
| data        |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | false    |         |
| readOnly    |             | bool                                                   | true     | false   |

### Examples

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

> Note: `labels` trait are hidden by default in `VelaUX`, you can use them in CLI.

### Apply To Component Types

* all component types

### Parameters

|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
| --------- | ----------- | ----------------- | -------- | ------- |
| -         |             | map[string]string | true     |         |

They're all string Key-Value pairs.

### Examples

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

> Note: `annotations` trait are hidden by default in `VelaUX`, you can use them in CLI.

### Apply To Component Types

* all component types

### Parameters

|   NAME    | DESCRIPTION |       TYPE        | REQUIRED | DEFAULT |
| -------- | ------------ | ----------------- | -------- | ------- |
| -         |             | map[string]string | true     |         |

They're all string Key-Value pairs.

### Examples

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

Trait `kustomize-patch` will patch on the Kustomize component.

> Note: To use `kustomize` trait, you must enable `fluxcd` addon first. 

### Apply To Component Types

* kustomize

### Parameters


|  NAME   |                          DESCRIPTION                          |         TYPE          | REQUIRED | DEFAULT |
| ------- | ------------------------------------------------------------- | --------------------- | -------- | ------- |
| patches | a list of StrategicMerge or JSON6902 patch to selected target | [[]patches](#patches) | true     |         |



#### patches

|  NAME  |                    DESCRIPTION                    |       TYPE        | REQUIRED | DEFAULT |
| ------ | ------------------------------------------------- | ----------------- | -------- | ------- |
| patch  | Inline patch string, in yaml style                | string            | true     |         |
| target | Specify the target the patch should be applied to | [target](#target) | true     |         |



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


### Examples

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

You could use this trait in [JSON6902 format](https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/patchesjson6902/) to patch for the kustomize component.

### Apply To Component Types

* kustomize

### Parameters


|    NAME     |        DESCRIPTION        |             TYPE              | REQUIRED | DEFAULT |
| ----------- | ------------------------- | ----------------------------- | -------- | ------- |
| patchesJson | A list of JSON6902 patch. | [[]patchesJson](#patchesJson) | true     |         |

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

### Examples

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

kustomize-strategy-merge trait provide strategy merge patch for kustomize component.

### Apply To Component Types

* kustomize

### Parameters

|         NAME          |                        DESCRIPTION                        |                       TYPE                        | REQUIRED | DEFAULT |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------- | -------- | ------- |
| patchesStrategicMerge | a list of strategicmerge, defined as inline yaml objects. | [[]patchesStrategicMerge](#patchesStrategicMerge) | true     |         |


#### patchesStrategicMerge
+-----------+-------------+--------------------------------------------------------+----------+---------+
|   NAME    | DESCRIPTION |                          TYPE                          | REQUIRED | DEFAULT |
+-----------+-------------+--------------------------------------------------------+----------+---------+
| undefined |             | map[string]{null|bool|string|bytes|{...}|[...]|number} | true     |         |

### Examples

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

### Apply To Component Types

* webservice
* worker
* task
* cron-task

### Parameters

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | -------------
envMappings | The mapping of environment variables to secret | map[string]#KeySecret | true |

#### KeySecret
Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | -------------
| key  | if key is empty, we will use envMappings key instead              | string            | false     |         |
| secret | Kubernetes secret name | string | true     |         |

### Examples

1. Prepare a Kubernetes Secret

The secret can be manually created, or generated by other component or external system.

For example, we have a secret `db-conn-example` whose data is as below:

```yaml
endpoint: https://xxx.com
password: 123
username: myname
```

2. Bind the Secret into your component by `service-binding` trait

For example, we have a webservice component who needs to consume a database. The database connection string should be set
to Pod environments: `endpoint`, `username` and `DB_PASSWORD`.

We can set the properties for envMappings as below. For each environment, `secret` represents the secret name, and `key`
represents the key of the secret.

Here is the complete properties for the trait.

```yaml
traits:
- type: service-binding
  properties:
    envMappings:
      DB_PASSWORD:
        secret: db-conn-example
        key: password            
      endpoint:
        secret: db-conn-example
        key: endpoint
      username:
        secret: db-conn-example
        key: username
```

In particular, if the environment name, like `endpoint`, is same to the `key` of the secret, we can omit the `key`.
So we can simplify the properties as below.

```yaml
traits:
- type: service-binding
  properties:
    envMappings:
      DB_PASSWORD:
        secret: db-conn-example
        key: password            
      endpoint:
        secret: db-conn-example
      username:
        secret: db-conn-example
```

We can finally prepare an Application for the business component `binding-test-comp` to consume the secret, which is a
representative of a database cloud resource.

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
                key: password            
              endpoint:
                secret: db-conn-example
              username:
                secret: db-conn-example
```

Deploy this YAML and the Secret `db-conn-example` will be binding into environment of workload.

## sidecar

The `sidecar` trait allows you to attach a sidecar container to the component.

### Apply To Component Types

* webservice
* worker
* task
* cron-task

### Parameters

+---------+-----------------------------------------+-----------------------+----------+---------+
|  NAME   |               DESCRIPTION               |         TYPE          | REQUIRED | DEFAULT |
+---------+-----------------------------------------+-----------------------+----------+---------+
| name    | Specify the name of sidecar container   | string                | true     |         |
| cmd     | Specify the commands run in the sidecar | []string              | false    |         |
| image   | Specify the image of sidecar container  | string                | true     |         |
| volumes | Specify the shared volume path          | [[]volumes](#volumes) | false    |         |
+---------+-----------------------------------------+-----------------------+----------+---------+

## volumes

|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
| --------- | ----------- | ------ | -------- | ------- |
| name      |             | string | true     |         |
| path      |             | string | true     |         |

### Examples

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







