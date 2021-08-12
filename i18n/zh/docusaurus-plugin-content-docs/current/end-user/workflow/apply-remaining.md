---
title:  部署剩余资源
---

## 总览

在一些情况下，我们并不需要部署所有的资源，但跳过不想部署的，再一个个指定部署又太过繁琐。KubeVela 提供了一个 `ApplyRemaining` 操作符，可以使用户方便的一键过滤不想要的资源，并部署剩余组件。
本节将介绍如何在 `WorkflowStepDefinition` 通过 `ApplyRemaining` 部署剩余资源。

## 部署基础定义

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
        type: apply-remaining
        properties:
          exceptions:
            express-server:
              skipApplyWorkload: false
              skipAllTraits: false
              skipApplyTraits:
                - ingress

---
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: apply-remaining
spec:
  schematic:
    cue:
      template: |
        import ("vela/op")
        parameter: {
            exceptions?: [componentName=string]: {
              // skipApplyWorkload 表明是否需要跳过组件的部署
              skipApplyWorkload: *true | bool

              // skipAllTraits 表明是否需要跳过所有运维特征的部署
              // 如果这个参数值为 True，将会忽略 skipApplyTraits
              skipAllTraits: *true| bool

              // skipApplyTraits 指定了需要跳过部署的运维特征
              skipApplyTraits: [...string]
           }
        }

        apply: op.#ApplyRemaining & {
          parameter
        }
```

可以看到，在 `properties` 中，我们指定了一个 `exceptions` 参数，其键名为对应的组件名 `express-server`，值为一个对象，对象中有一些用于 `ApplyRemaining` 的内置参数。参数的详细说明详见下面的例子：

## 期望结果

可以看到，组件已经被成功部署到了集群中，但是名为 ingress 的运维特征被跳过了部署。

通过填写 `ApplyRemaining` 中提供的参数，可以使用户方便的过滤部署资源。