---
title: 调试工作流
slug: /platform-engineers/debug/debug
---

:::caution
调试工作流依赖真实的运行环境，并且会实际执行，请确保你在测试环境中执行调试。

调试的过程也依赖对 Kubernetes 基础设施的了解，请确保你有相应知识或寻找平台团队协助。
:::

当你在测试环境中部署应用，并发现应用出现问题时，你可能会想要在环境中调试应用。KubeVela 提供了 `vela debug` 命令，来帮助你在环境中调试应用。

## 使用工作流的应用

如果你的应用使用了工作流，那么在使用 `vela debug` 命令前，请确保你的应用中使用了 `debug` 策略：

```yaml
polices:
  - name: debug
    type: debug
```

你也可以使用 `vela up -f <application yaml> --debug` 来为你的应用自动加上 debug 策略。

对于使用了工作流的应用，`vela debug` 会首先列出工作流中的所有步骤，你可以选择指定的步骤进行调试。选择完步骤后，你可以分别查看该步骤中的所有 CUE 变量内容。其中：黄色标明的 `do` 和 `provider` 是本次使用的 CUE action，错误的内容将以红色标志。

![](https://static.kubevela.net/images/1.4/debug-workflow.gif)

你也可以使用 `vela debug <application-name> -s <step-name> -f <variable>` 来查看单个 步骤中的指定变量的内容。

![](https://static.kubevela.net/images/1.4/debug-workflow-focus.gif)

## 仅使用组件的应用

如果你的应用只使用了组件，没有使用工作流。那么，你可以直接使用 `vela debug <application-name>` 命令来进行调试你的应用。

部署如下应用，该应用的第一个组件会使用 `k8s-objects` 创建一个 Namespace，第二个组件则会使用 `webservice` 组件以及 `gateway` 运维特征，从而创建一个 Deployment 及其对应的 Service 和 Ingress。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: gateway-app
spec:
  components:
    - name: comp-namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: test-ns1
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

部署完应用后，你可以使用 `vela debug <application-name>` 命令分组件来查看该应用渲染出来的所有资源。

![](https://static.kubevela.net/images/1.4/debug-application.gif)

你也可以使用 `vela debug <application-name> -s <component-name>` 来查看单个组件中被渲染出来的所有资源。

![](https://static.kubevela.net/images/1.4/debug-application-comp.gif)
