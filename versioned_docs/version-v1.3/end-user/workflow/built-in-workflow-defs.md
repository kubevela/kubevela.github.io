---
title: Built-in Workflow Steps
---

This documentation will walk through the built-in workflow steps that you can use to design an application deployment process.

## deploy

### Overview

### Parameter

### Example

## apply-application

### Overview

Apply all components and traits in Application.

### Parameter

No arguments, used for custom steps before or after application applied.

### Example

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

### Overview

Wait for the specified Application to complete.

> `depends-on-app` will check if the cluster has the application with `name` and `namespace` defines in `properties`.
> If the application exists, the next step will be executed after the application is running.
> If the application do not exists, KubeVela will check the ConfigMap with the same name, and read the config of the Application and apply to cluster.
> The ConfigMap is like below: the `name` and `namespace` of the ConfigMap is the same in properties. In data, the key is `name`, and the value is the yaml of the deployed application yaml.
> ```yaml
> apiVersion: v1
> kind: ConfigMap
> metadata:
>   name: myapp
>   namespace: vela-system
> data:
>   myapp: ...
> ``` 

### Parameter

|   Name    |  Type  |           Description            |
| :-------: | :----: | :------------------------------: |
|   name    | string |   The name of the Application    |
| namespace | string | The namespace of the Application |

### Example

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

### Overview

Apply Application in different policies and envs.

### Parameter

|  Name  |  Type  |      Description       |
| :----: | :----: | :--------------------: |
| policy | string | The name of the policy |
|  env   | string |  The name of the env   |

### Example

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

## notification

### Overview

Send notifications. You can use the notification to send email, slack, ding talk and lark.

### Parameters

|       Name       |  Type  | Description                                                                                                                                                                 |
| :--------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|      email       | Object | Optional, please fulfill its from, to and content if you want to send email                                                                                             |
|    email.from.address     | String | Required, the email address that you want to send from                                                                                                                                      |
|  email.from.alias   | String | Optional, the email alias to show after sending the email                                           |
|  email.from.password   | ValueOrSecret | Required, the password of the email, you can either specify it in value or use secretRef                                           |
|  email.from.host   | String | Required, the host of your email                                           |
|  email.from.port   | Int | Optional, the port of the email host, default to 587                                           |
|  email.to   | []String | Required, the email address that you want to send to                                           |
|  email.content.subject   | String | Required, the subject of the email                                           |
|  email.content.body   | String | Required, the context body of the email                                           |
|      slack       | Object | Optional, please fulfill its url and message if you want to send Slack messages                                                                                             |
|    slack.url     | ValueOrSecret | Required, the webhook address of Slack, you can choose to fill it directly in value or specify it in secret                                                                                                                                      |
|  slack.message   | Object | Required, the Slack messages you want to send, please follow [Slack messaging](https://api.slack.com/reference/messaging/payload)                                           |
|     dingding     | Object | Optional, please fulfill its url and message if you want to send DingTalk messages                                                                                          |
|   dingding.url   | ValueOrSecret | Required, the webhook address of DingTalk, you can choose to fill it directly in value or specify it in secret                                                                                                                                  |
| dingding.message | Object | Required, the DingTalk messages you want to send, please follow [DingTalk messaging](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw) |  |
|     lark     | Object | Optional, please fulfill its url and message if you want to send Lark messages                                                                                          |
|   lark.url   | ValueOrSecret | Required, the webhook address of Lark, you can choose to fill it directly in value or specify it in secret                                                                                                                                  |
| lark.message | Object | Required, the Lark messages you want to send, please follow [Lark messaging](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#8b0f2a1b) |  |

The `ValueOrSecret` format is:

|       Name       |  Type  | Description                                                                                                                                                                 |
| :--------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value | String | Optional, directly get the data from value |
| secretRef.name | String | Optional, get data from secret, the name of the secret |
| secretRef.key | String | Optional, get data from secret, the key of the secret |

### Example

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
        type: notification
        properties:
          dingding:
            # the DingTalk webhook address, please refer to: https://developers.dingtalk.com/document/robots/custom-robot-access
            url: 
              value: <url>
            message:
              msgtype: text
              text:
                context: Workflow starting...
      - name: application
        type: apply-application
      - name: slack-message
        type: notification
        properties:
          slack:
            # the Slack webhook address, please refer to: https://api.slack.com/messaging/webhooks
            url:
              secretRef:
                name: <secret-key>
                key: <secret-value>
            message:
              text: Workflow ended.
          lark:
            url:
              value: <lark-url>
            message:
              msg_type: "text"
              content: "{\"text\":\" Hello KubeVela\"}"
          email:
            from:
              address: <sender-email-address>
              alias: <sender-alias>
              password:
                # secretRef:
                #   name: <secret-name>
                #   key: <secret-key>
                value: <sender-password>
              host: <email host like smtp.gmail.com>
              port: <email port, optional, default to 587>
            to:
              - kubevela1@gmail.com
              - kubevela2@gmail.com
            content:
              subject: test-subject
              body: test-body
```

## apply-object

### Overview

Apply Kubernetes native resources, you need to upgrade to KubeVela v1.1.4 or higher to enable `apply-object`.

### Parameters

|  Name   |  Type  |                 Description                  |
| :-------: | :----: | :-----------------------------------: |
|    value    | Object |      Required, Kubernetes native resources fields      |
|    cluster    | String |      Optional, The cluster you want to apply the resource to, default is the current cluster. If you want to apply resource in different cluster, use `vela cluster join` to join the cluster first, and then specify the cluster      |

### Example

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
          # Kubernetes native resources fields
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
            # the cluster you want to apply the resource to, default is the current cluster
            cluster: <your cluster name>  
      - name: apply-server
        type: apply-component
        properties:
          component: express-serve
```

## read-object

### Overview

Read Kubernetes native resources, you need to upgrade to KubeVela v1.1.6 or higher to enable `read-object`.

### Parameters

|  Name   |  Type  |                 Description                  |
| :-------: | :----: | :-----------------------------------: |
| apiVersion | String |     Required, The apiVersion of the resource you want to read     |
| kind | String |     Required, The kind of the resource you want to read     |
| name | String |     Required, The apiVersion of the resource you want to read     |
| namespace | String |     Optional, The namespace of the resource you want to read, defaults to `default`     |
| cluster | String |     Optional, The cluster you want to read the resource from, default is the current cluster. If you want to read resource in different cluster, use `vela cluster join` to join the cluster first, and then specify the cluster     |

### Example

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
        cluster: <your cluster name
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

### Overview

Export data to ConfigMap, you need to upgrade to KubeVela v1.1.6 or higher to enable `export2config`.

### Parameters

|  Name   |  Type  |                 Description                  |
| :-------: | :----: | :-----------------------------------: |
| configName | String |     Required, The name of the ConfigMap     |
| namespace | String |     Optional, The namespace of the ConfigMap, defaults to `context.namespace`     |
| data | Map |     Required, The data that you want to export to ConfigMap     |

### Example

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

### Overview

Export data to Secret, you need to upgrade to KubeVela v1.1.6 or higher to enable `export2secret`.

### Parameters

|  Name   |  Type  |                 Description                  |
| :-------: | :----: | :-----------------------------------: |
| secretName | String |     Required, The name of the Secret     |
| namespace | String |     Optional, The namespace of the Secret, defaults to `context.namespace`     |
| data | Map |     Required, The data that you want to export to Secret     |

### Example

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

### Overview

Suspend the current workflow, we can use `vela workflow resume appname` to resume the suspended workflow.

> For more information of `vela workflow`, please refer to [vela cli](../../cli/vela_workflow)。

### Parameter

| Name  | Type  | Description |
| :---: | :---: | :---------: |
|   -   |   -   |      -      |

### Example

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
            # the Slack webhook address, please refer to: https://api.slack.com/messaging/webhooks
            message:
              text: Ready to apply the application, ask the administrator to approve and resume the workflow.
      - name: manual-approval
        type: suspend
      - name: express-server
        type: apply-application
```