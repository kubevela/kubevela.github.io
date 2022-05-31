---
title: Notification
---

If we want to be notified before or after deploying an application, KubeVela provides integration with notification webhooks, allowing users to send notifications to Email, DingTalk, Slack, Lark.

In this guide, you will learn how to send notifications via `notification` in workflow.

## How to use

Apply the following `Application` with workflow step type of `notification`:

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
      image: oamdev/hello-world
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
        # specify the workflow step type
        type: notification
        properties:
          dingding:
            # the DingTalk webhook address, please refer to: https://developers.dingtalk.com/document/robots/custom-robot-access
            url:
              address: <your dingding url>
            # specify the message details
            message:
              msgtype: text
              text:
                content: Workflow starting...
      - name: application
        type: apply-component
        properties:
          component: express-server
        outputs:
          - name: app-status
            valueFrom: output.status.conditions[0].message + "工作流运行完成"
      - name: slack-message
        type: notification
        inputs:
          - from: app-status
            parameterKey: slack.message.text
        properties:
          slack:
            # the Slack webhook address, please refer to: https://api.slack.com/messaging/webhooks
            url:
              fromSecret:
                name: <the secret name that stores your slack url>
                key: <the secret key that stores your slack url>
            # specify the message details, will be filled by the input value
            # message:
            #   text: condition message + Workflow ended.
```

## Expected outcome

we can see that before and after the deployment of the application, the messages can be seen in the corresponding group chat.

With `notification`, we can integrate with webhook notifier easily.

## Parameters

For details, please checkout [notification parameters](./built-in-workflow-defs##notification)
