---
title:  Webhook Notification
---

If we want to be notified before or after deploying an application, KubeVela provides integration with notification webhooks, allowing users to send notifications to DingTalk or Slack.

In this guide, you will learn how to send notifications via `webhook-notification` in workflow.

## Parameters

| Parameter | Type | Description |
| :---: | :--: | :-- |
| slack | Object | Optional, please fulfill its url and message if you want to send Slack messages |
| slack.url | String | Required, the webhook address of Slack |
| slack.message | Object | Required, the Slack messages you want to send, please follow [Slack messaging](https://api.slack.com/reference/messaging/payload) |
| dingding | Object | Optional, please fulfill its url and message if you want to send DingTalk messages |
| dingding.url | String | Required, the webhook address of DingTalk |
| dingding.message | Object | Required, the DingTalk messages you want to send, please follow [DingTalk messaging](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw) |

## How to use

Apply the following `Application` with workflow step type of `webhook-notification`:

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
        # specify the workflow step type
        type: webhook-notification
        properties:
          dingding:
            # the DingTalk webhook address, please refer to: https://developers.dingtalk.com/document/robots/custom-robot-access
            url: <your dingding url>
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
          - from: app-status
            exportKey: output.status.conditions[0].message + "工作流运行完成"
      - name: slack-message
        type: webhook-notification
        inputs:
          - name: app-status
            parameterKey: properties.slack.message.text
        properties:
          slack:
            # the Slack webhook address, please refer to: https://api.slack.com/messaging/webhooks
            url: <your slack url>
            # specify the message details, will be filled by the input value
            # message:
            #   text: condition message + Workflow ended.
```

## Expected outcome

we can see that before and after the deployment of the application, the messages can be seen in the corresponding group chat.

With `webhook-notification`, we can integrate with webhook notifier easily.
