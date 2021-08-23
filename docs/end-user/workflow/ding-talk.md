---
title:  DingTalk
---

If we want to be notified before and after we deploy a component, KubeVela provides the ability to integrate with DingTalk Robot notifications, allowing users to send notifications to DingTalk in their workflow.

In this guide, you will learn how to send notifications via 'dingTalk' in workflow.

> Before reading this section, please make sure you have learned about [How to integrate with DingTalk robot](https://developers.dingtalk.com/document/robots/custom-robot-access/)

## How to use

Apply the following `Application` with workflow step type of `dingtalk`:

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
        type: dingtalk
        properties:
          # copy the token in webhook url of your DingTalk robot
          token: xxx
          # specify the message detail, for more information, please refer: https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw
          message:
            msgtype: text
            text:
              context: Workflow starting...
      - name: first-server
        type: apply-component
        properties:
          component: express-server
      - name: dingtalk-message
        type: dingtalk
        properties:
          token: xxx
          message:
            msgtype: text
            text:
              context: Workflow ended.
```

## Expected outcome

we can see that before and after the deployment of the component, the messages can be seen in the corresponding group chat.

With `dingtalk`, we can integrate with DingTalk notifier easily.
