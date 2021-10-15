---
title: Built-in Steps
---

This documentation will walk through the built-in workflow steps that you can use to design an application deployment process.

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

## webhook-notification

### Overview

Send messages to the webhook address.

### Parameters

|       Name       |  Type  | Description                                                                                                                                                                 |
| :--------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|      slack       | Object | Optional, please fulfill its url and message if you want to send Slack messages                                                                                             |
|    slack.url     | String | Required, the webhook address of Slack                                                                                                                                      |
|  slack.message   | Object | Required, the Slack messages you want to send, please follow [Slack messaging](https://api.slack.com/reference/messaging/payload)                                           |
|     dingding     | Object | Optional, please fulfill its url and message if you want to send DingTalk messages                                                                                          |
|   dingding.url   | String | Required, the webhook address of DingTalk                                                                                                                                   |
| dingding.message | Object | Required, the DingTalk messages you want to send, please follow [DingTalk messaging](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw) |  |

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
        type: webhook-notification
        properties:
          dingding:
            # the DingTalk webhook address, please refer to: https://developers.dingtalk.com/document/robots/custom-robot-access
            url: xxx
            message:
              msgtype: text
              text:
                context: Workflow starting...
      - name: application
        type: apply-application
      - name: slack-message
        type: webhook-notification
        properties:
          slack:
            # the Slack webhook address, please refer to: https://api.slack.com/messaging/webhooks
            url: xxx
            message:
              text: Workflow ended.
```

## apply-object

### Overview

Apply Kubernetes native resources, you need to upgrade to KubeVela v1.1.4 or higher to enable `apply-object`.

### Parameters

|  Name   |  Type  |                 Description                  |
| :-------: | :----: | :-----------------------------------: |
|    ...    | ... |      Kubernetes native resources fields      |

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