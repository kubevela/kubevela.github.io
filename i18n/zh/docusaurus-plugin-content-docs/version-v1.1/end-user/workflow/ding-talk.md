---
title:  使用钉钉发送通知
---

在一些情况下，当我们使用工作流部署组件前后，希望能够得到部署的通知。KubeVela 提供了与钉钉机器人通知集成的能力，能让用户在工作流中向钉钉发送通知。
本节将介绍如何在工作流中通过 `dingtalk` 发送钉钉通知。

> 在学习本节前，请确保你已经了解了 [如何接入钉钉机器人](https://developers.dingtalk.com/document/robots/custom-robot-access/)

## 如何使用

部署如下应用部署计划，在部署组件前后，都有一个 `dingtalk` 步骤发送通知：

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
        type: dingtalk
        properties:
          # 复制出机器人的 Webhook 地址中的 token
          token: xxx
          # 具体要发送的信息详情，更多的格式详见：https://developers.dingtalk.com/document/robots/custom-robot-access/title-72m-8ag-pqw
          message:
            msgtype: text
            text:
              context: 开始运行工作流
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
              context: 工作流运行完成
```

## 期望结果

通过与钉钉的对接，可以看到，在工作流中的组件部署前后，都能在对应的群聊中看到相应的信息。

通过 `dingtalk` ，可以使用户方便的与钉钉对接消息通知。