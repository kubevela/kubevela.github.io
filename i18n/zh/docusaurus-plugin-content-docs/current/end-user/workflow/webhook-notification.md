---
title:  使用 Webhook 发送通知
---

在一些情况下，当我们使用工作流部署应用前后，希望能够得到部署的通知。KubeVela 提供了与 Webhook 集成的能力，支持用户在工作流中向钉钉或者 Slack 发送通知。

本节将介绍如何在工作流中通过 `webhook-notification` 发送 Webhook 通知。

## 参数说明

| 参数 | 类型 | 说明 |
| :---: | :--: | :-- |
| slack | Object | 可选值，如果需要发送 Slack 信息，则需填写其 url 及 message |
| slack.url | String | 必填值，Slack 的 Webhook 地址 |
| slack.message | Object | 必填值，需要发送的 Slack 信息，请符合 [Slack 信息规范](https://api.slack.com/reference/messaging/payload) |
| dingding | Object | 可选值，如果需要发送钉钉信息，则需填写其 url 及 message |
| dingding.url | String | 必填值，钉钉的 Webhook 地址 |
| dingding.message | Object | 必填值，需要发送的钉钉信息，请符合 [钉钉信息规范](https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw) |

## 如何使用

部署如下应用部署计划，在部署组件前后，都有一个 `webhook-notification` 步骤发送通知：

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
        # 指定步骤类型
        type: webhook-notification
        properties:
          dingding:
            # 钉钉 Webhook 地址，请查看：https://developers.dingtalk.com/document/robots/custom-robot-access
            url: <your dingding url>
            # 具体要发送的信息详情
            message:
              msgtype: text
              text:
                content: 开始运行工作流
      - name: application
        type: apply-component
        properties:
          component: express-server
        outputs:
          - from: app-status
            valueFrom: output.status.conditions[0].message + "工作流运行完成"
      - name: slack-message
        type: webhook-notification
        inputs:
          - name: app-status
            parameterKey: properties.slack.message.text
        properties:
          slack:
            # Slack Webhook 地址，请查看：https://api.slack.com/messaging/webhooks
            url: <your slack url>
            # 具体要发送的信息详情，会被 input 中的值覆盖
            # message:
            #   text: condition message + 工作流运行完成
```

## 期望结果

通过与 Webhook 的对接，可以看到，在工作流中的组件部署前后，都能在对应的群聊中看到相应的信息。

通过 `webhook-notification` ，可以使用户方便的与 Webhook 对接消息通知。