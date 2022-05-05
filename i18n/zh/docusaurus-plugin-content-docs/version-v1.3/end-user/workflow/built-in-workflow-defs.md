---
title: 内置工作流步骤
---

本文档将详细介绍 KubeVela 内置的各个工作流步骤。你可以通过自由的组合它们来设计完整的交付工作流。

## deploy

**简介**

使用对应的策略部署组件。

**参数**


|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
|   auto    | bool |      可选参数，默认为 true。如果为 false，工作流将在执行该步骤前自动暂停。      |
|   policies    | []string |      可选参数。指定本次部署要使用的策略。如果不指定策略，将自动部署到管控集群。      |
|   parallelism    | int |      可选参数。指定本次部署的并发度，默认为 5。      |

**示例**

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: deploy-workflowstep
  namespace: examples
spec:
  components:
    - name: nginx-deploy-workflowstep
      type: webservice
      properties:
        image: nginx
  policies:
    - name: topology-hangzhou-clusters
      type: topology
      properties:
        clusterLabelSelector:
          region: hangzhou
    - name: topology-local
      type: topology
      properties:
        clusters: ["local"]
        namespace: examples-alternative
  workflow:
    steps:
      - type: deploy
        name: deploy-local
        properties:
          policies: ["topology-local"]
      - type: deploy
        name: deploy-hangzhou
        properties:
          # 在执行该步骤前自动暂停
          auto: false
          policies: ["topology-hangzhou-clusters"]
```

## suspend

**简介**

暂停当前工作流，可以通过 `vela workflow resume appname` 继续已暂停的工作流。

> 有关于 `vela workflow` 命令的介绍，可以详见 [vela cli](../../cli/vela_workflow)。

**参数**

> 注意，duration 参数需要在 KubeVela v1.4 版本以上可用。

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
|   duration    | string |      可选参数，指定工作流暂停的时长，超过该时间后工作流将自动继续，如："30s"， "1min"， "2m15s"      |

**示例**

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
        # properties:
        #   duration: "30s"
      - name: express-server
        type: apply-application
```

## notification

**简介**

向指定的 Webhook 发送信息，支持邮件、钉钉、Slack 和飞书。

**参数**

|      参数名      |  类型  | 说明                                                                                                                                     |
| :--------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------------------- |
|      email       | Object | 可选值，如果需要发送邮件，则需填写其 from、to 以及 content                                                                                             |
|    email.from.address     | String | 必填值，发送的邮件地址                                                                                                                                      |
|  email.from.alias   | String | 可选值，发送的邮件别名                                           |
|  email.from.password   | ValueOrSecret | 必填值，发送的邮件密码，可以选择直接在 value 填写或从 secretRef 中获取                                           |
|  email.from.host   | String | 必填值，邮件的 Host                                           |
|  email.from.port   | Int | 可选值，邮件发送的端口号，默认为 587                                           |
|  email.to   | []String | 必填值，邮件发送的地址列表                                          |
|  email.content.subject   | String | 必填值，邮件的标题                                           |
|  email.content.body   | String | 必填值，邮件的内容                                           |
|      slack       | Object | 可选值，如果需要发送 Slack 信息，则需填写其 url 及 message                                                                               |
|    slack.url     |  ValueOrSecret | 必填值，Slack 的 Webhook 地址，可以选择直接在 value 填写或从 secretRef 中获取                                                                                                            |
|  slack.message   | Object | 必填值，需要发送的 Slack 信息，请符合 [Slack 信息规范](https://api.slack.com/reference/messaging/payload)                                |
|     dingding     | Object | 可选值，如果需要发送钉钉信息，则需填写其 url 及 message                                                                                  |
|   dingding.url   | ValueOrSecret | 必填值，钉钉的 Webhook 地址，可以选择直接在 value 填写或从 secretRef 中获取                                                                                                              |
| dingding.message | Object | 必填值，需要发送的钉钉信息，请符合 [钉钉信息规范](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw) |
|     lark     | Object | 可选值，如果需要发送飞书信息，则需填写其 url 及 message                                                                                  |
|   lark.url   | ValueOrSecret | 必填值，飞书的 Webhook 地址，可以选择直接在 value 填写或从 secretRef 中获取                                                                                                              |
| lark.message | Object | 必填值，需要发送的飞书信息，请符合 [飞书信息规范](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#8b0f2a1b) |

`ValueOrSecret` 的格式为：

|       参数名       |  类型  | 说明                                                                                                                                                                 |
| :--------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value | String | 可选值，直接填写值 |
| secretRef.name | String | 可选值，从 secret 中获取值，secret 的名称 |
| secretRef.key | String | 可选值，从 secret 中获取值，secret 的 key |

**示例**

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
  workflow:
    steps:
      - name: dingtalk-message
        type: notification
        properties:
          dingding:
            # 钉钉 Webhook 地址，请查看：https://developers.dingtalk.com/document/robots/custom-robot-access
            url:
              value: <your dingtalk url>
            message:
              msgtype: text
              text:
                context: 开始运行工作流
      - name: application
        type: apply-application
      - name: slack-message
        type: notification
        properties:
          slack:
            # Slack Webhook 地址，请查看：https://api.slack.com/messaging/webhooks
            url:
              secretRef:
                name: <the secret name that stores your slack url>
                key: <the secret key that stores your slack url>
            message:
              text: 工作流运行完成
```

## webhook

**简介**

向指定 Webhook URL 发送请求，若不指定请求体，则默认发送当前 Application。

**参数**

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
|   url    | ValueOrSecret |        必填值，需要发送的 Webhook URL，可以选择直接在 value 填写或从 secretRef 中获取      |
| data | object | 可选值，需要发送的内容 |

**示例**

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
  workflow:
    steps:
      - name: express-server
        type: apply-application
      - name: webhook
        type: webhook
        properties:
          url:
            value: <your webhook url>
```

## apply-application

**简介**

部署当前 Application 中的所有组件和运维特征。

> 该步骤默认在 VelaUX 中隐藏。

**参数**

无需指定参数，主要用于应用部署前后增加自定义步骤。

**示例**

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
  workflow:
    steps:
      - name: express-server
        type: apply-application
```

## apply-component

**简介**

部署当前 Application 中的某个组件及其运维特征

> 该步骤默认在 VelaUX 中隐藏。

**参数**


|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
|   component    | string |      需要部署的 component 名称      |

**示例**

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
  workflow:
    steps:
      - name: express-server
        type: apply-component
        properties:
          component: express-server
```

## depends-on-app

**简介**

等待指定的 Application 完成。

> 该步骤默认在 VelaUX 中隐藏。

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

**参数**

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
|   name    | string |      需要等待的 Application 名称      |
| namespace | string | 需要等待的 Application 所在的命名空间 |

**示例**

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
  workflow:
    steps:
      - name: express-server
        type: depends-on-app
        properties:
          name: another-app
          namespace: default
```

## apply-object

**简介**

部署 Kubernetes 原生资源，该功能在 KubeVela v1.1.4 及以上版本可使用。

> 该步骤默认在 VelaUX 中隐藏。

**参数**

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
|    value    | object |       必填值，Kubernetes 原生资源字段      |
|    cluster    | object |      可选值，需要部署的集群名称。如果不指定，则为当前集群。在使用该字段前，请确保你已经使用 `vela cluster join` 纳管了你的集群     |

**示例**

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
          # Kubernetes 原生字段
          value:
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
            # 需要部署的集群名称，如果不指定，则默认为当前集群
            cluster: <your cluster name>  
      - name: apply-server
        type: apply-component
        properties:
          component: express-server
```

## read-object

**简介**

读取 Kubernetes 原生资源，该功能在 KubeVela v1.1.6 及以上版本可使用。

> 该步骤默认在 VelaUX 中隐藏。

**参数**

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
| apiVersion | String |     必填值，资源的 apiVersion     |
| kind | String |     必填值，资源的 kind     |
| name | String |     必填值，资源的 name     |
| namespace | String |     选填值，资源的 namespace，默认为 `default`     |
| cluster | String |     选填值，资源的集群名，默认为当前集群，在使用该字段前，请确保你已经使用 `vela cluster join` 纳管了你的集群     |

**示例**

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
        cluster: <your cluster name>
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

**简介**

导出数据到 ConfigMap，该功能在 KubeVela v1.1.6 及以上版本可使用。

> 该步骤默认在 VelaUX 中隐藏。

**参数**

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
| configName | String |     必填值，ConfigMap 的名称     |
| namespace | String |     选填值，ConfigMap 的 namespace，默认为 `context.namespace`     |
| data | Map |     必填值，需要导出到 ConfigMap 中的数据     |

**示例**

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

**简介**

导出数据到 Secret，该功能在 KubeVela v1.1.6 及以上版本可使用。

> 该步骤默认在 VelaUX 中隐藏。

**参数**

|  参数名   |  类型  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
| secretName | String |     必填值，Secret 的名称     |
| namespace | String |    选填值，Secret 的 namespace，默认为 `context.namespace`      |
| data | Map |    必填值，需要导出到 Secret 中的数据     |

**示例**

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
