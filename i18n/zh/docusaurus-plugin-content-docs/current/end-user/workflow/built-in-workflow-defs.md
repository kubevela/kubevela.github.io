---
title: 工作流步骤
---

本文档将详细介绍 KubeVela 内置的各个工作流步骤。您可以通过自由的组合它们来设计完整的交付工作流。

## apply-application

### 简介

部署当前 Application 中的所有组件和运维特征。

### 参数

无需指定参数，主要用于应用部署前后增加自定义步骤。

### 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: express-server
        type: apply-application
```

## depends-on-app

### 简介

等待指定的 Application 完成。

`depends-on-app` 会根据 `properties` 中的 `name` 及 `namespace`，去查询集群中是否存在对应的应用。

如果应用存在，则当该应用的状态可用时，才会进行下一个步骤；
若该应用不存在，则会去查询同名的 configMap，从中读取出应用的配置并部署到集群中。
> 若应用不存在，则需要形如下的 configMap：`name` 与 `namespace` 和 `properties` 中声明的保持一致，在 `data` 中，以 `name` 为 key，实际的 value 为需要部署的 KubeVela Application yaml。
> ```yaml
> apiVersion: v1
> kind: ConfigMap
> metadata:
>   name: myapp
>   namespace: vela-system
> data:
>   myapp: ...
> ``` 

### 参数

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
|   name    | string |      需要等待的 Application 名称      |
| namespace | string | 需要等待的 Application 所在的命名空间 |

### 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: express-server
        type: depends-on-app
        properties:
          name: another-app
          namespace: default
```

## deploy2env

### 简介

将 Application 在不同的环境和策略中部署。

### 参数

| 参数名 |  类型  |       说明       |
| :----: | :----: | :--------------: |
| policy | string | 需要关联的策略名 |
|  env   | string | 需要关联的环境名 |

### 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: multi-env-demo
  namespace: default
spec:
  components:
    - name: nginx-server
      type: webservice
      properties:
        image: nginx:1.21
        port: 80

  policies:
    - name: env
      type: env-binding
      properties:
        created: false
        envs:
          - name: test
            patch:
              components:
                - name: nginx-server
                  type: webservice
                  properties:
                    image: nginx:1.20
                    port: 80
            placement:
              namespaceSelector:
                name: test
          - name: prod
            patch:
              components:
                - name: nginx-server
                  type: webservice
                  properties:
                    image: nginx:1.20
                    port: 80
            placement:
              namespaceSelector:
                name: prod

  workflow:
    steps:
      - name: deploy-test-server
        type: deploy2env
        properties:
          policy: env
          env: test
      - name: deploy-prod-server
        type: deploy2env
        properties:
          policy: env
          env: prod
```

## webhook-notification

### 简介

向指定的 Webhook 发送信息，该功能在 KubeVela v1.1.6 及以上版本可使用。

### 参数

|      参数名      |  类型  | 说明                                                                                                                                     |
| :--------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------------------- |
|      slack       | Object | 可选值，如果需要发送 Slack 信息，则需填写其 url 及 message                                                                               |
|    slack.url     | Object | 必填值，Slack 的 Webhook 地址，可以选择直接填写或从 secret 中获取                                                                                                            |
|    slack.url.address     | String | 可选值，直接填写 Slack 的 Webhook 地址                                                                                                            |
|    slack.url.fromSecret.name     | String | 可选值， 从 secret 中获取 Webhook 地址，secret 的名字                                                                                                            |
|    slack.url.fromSecret.key     | String | 可选值， 从 secret 中获取 Webhook 地址，从 secret 中获取的 key                                                                                                            |
|  slack.message   | Object | 必填值，需要发送的 Slack 信息，请符合 [Slack 信息规范](https://api.slack.com/reference/messaging/payload)                                |
|     dingding     | Object | 可选值，如果需要发送钉钉信息，则需填写其 url 及 message                                                                                  |
|   dingding.url   | Object | 必填值，钉钉的 Webhook 地址，可以选择直接填写或从 secret 中获取                                                                                                              |
|   dingding.url.address   | String | 可选值，直接填写钉钉的 Webhook 地址                                                                                                              |
|   dingding.url.fromSecret.name   | String | 可选值， 从 secret 中获取 Webhook 地址，secret 的名字                                                                                                              |
|   dingding.url.fromSecret.key   | String | 可选值， 从 secret 中获取 Webhook 地址，从 secret 中获取的 key                                                                                                              |
| dingding.message | Object | 必填值，需要发送的钉钉信息，请符合 [钉钉信息规范](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw) |

### 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: dingtalk-message
        type: webhook-notification
        properties:
          dingding:
            # 钉钉 Webhook 地址，请查看：https://developers.dingtalk.com/document/robots/custom-robot-access
            url:
              address: <your dingtalk url>
            message:
              msgtype: text
              text:
                context: 开始运行工作流
      - name: application
        type: apply-application
      - name: slack-message
        type: webhook-notification
        properties:
          slack:
            # Slack Webhook 地址，请查看：https://api.slack.com/messaging/webhooks
            url:
              fromSecret:
                name: <the secret name that stores your slack url>
                key: <the secret key that stores your slack url>
            message:
              text: 工作流运行完成
```

## apply-object

### 简介

部署 Kubernetes 原生资源，该功能在 KubeVela v1.1.4 及以上版本可使用。

### 参数

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
|    ...    | ... |      Kubernetes 原生资源字段      |

### 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: server-with-pvc
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
      volumes:
        - name: "my-pvc"
          type: "pvc"
          mountPath: "/test"
          claimName: "myclaim"

  workflow:
    steps:
      - name: apply-pvc
        type: apply-object
        properties:
          apiVersion: v1
          kind: PersistentVolumeClaim
          metadata:
            name: myclaim
            namespace: default
          spec:
            accessModes:
            - ReadWriteOnce
            resources:
              requests:
                storage: 8Gi
            storageClassName: standard
      - name: apply-server
        type: apply-component
        properties:
          component: express-server
```

## read-object

### 简介

读取 Kubernetes 原生资源，该功能在 KubeVela v1.1.6 及以上版本可使用。

### 参数

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
| apiVersion | String |     必填值，资源的 apiVersion     |
| kind | String |     必填值，资源的 kind     |
| name | String |     必填值，资源的 name     |
| namespace | String |     选填值，资源的 namespace，默认为 `default`     |

### 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: read-object
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
    - name: read-object
      type: read-object
      outputs:
        - name: cpu
          valueFrom: output.value.data["cpu"]
        - name: memory
          valueFrom: output.value.data["memory"]
      properties:
        apiVersion: v1
        kind: ConfigMap
        name: my-cm-name
    - name: apply
      type: apply-component
      inputs:
        - from: cpu
          parameterKey: cpu
        - from: memory
          parameterKey: memory
      properties:
        component: express-server
```

## export2config

### 简介

导出数据到 ConfigMap，该功能在 KubeVela v1.1.6 及以上版本可使用。

### 参数

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
| configName | String |     必填值，ConfigMap 的名称     |
| namespace | String |     选填值，ConfigMap 的 namespace，默认为 `context.namespace`     |
| data | Map |     必填值，需要导出到 ConfigMap 中的数据     |

### 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: export-config
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
      - name: apply-server
        type: apply-component
        outputs: 
          - name: status
            valueFrom: output.status.conditions[0].message
        properties:
          component: express-server
      - name: export-config
        type: export-config
        inputs:
          - from: status
            parameterKey: data.serverstatus
        properties:
          configName: my-configmap
          data:
            testkey: testvalue
```

## export2secret

### 简介

导出数据到 Secret，该功能在 KubeVela v1.1.6 及以上版本可使用。

### 参数

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
| secretName | String |     必填值，Secret 的名称     |
| namespace | String |    选填值，Secret 的 namespace，默认为 `context.namespace`      |
| data | Map |    必填值，需要导出到 Secret 中的数据     |

### 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: export-secret
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
      - name: apply-server
        type: apply-component
        outputs: 
          - name: status
            valueFrom: output.status.conditions[0].message
        properties:
          component: express-server
      - name: export-secret
        type: export-secret
        inputs:
          - from: status
            parameterKey: data.serverstatus
        properties:
          secretName: my-secret
          data:
            testkey: testvalue
```


## suspend

### 简介

暂停当前工作流，可以通过 `vela workflow resume appname` 继续已暂停的工作流。

> 有关于 `vela workflow` 命令的介绍，可以详见 [vela cli](../../cli/vela_workflow)。

### 参数

| 参数名 | 类型  | 说明  |
| :----: | :---: | :---: |
|   -    |   -   |   -   |

### 示例

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 8000
  workflow:
    steps:
      - name: slack-message
        type: webhook-notification
        properties:
          slack:
            # Slack Webhook 地址，请查看：https://api.slack.com/messaging/webhooks
            url: xxx
            message:
              text: 准备开始部署应用，请管理员审批并继续工作流
      - name: manual-approval
        type: suspend
      - name: express-server
        type: apply-application
```