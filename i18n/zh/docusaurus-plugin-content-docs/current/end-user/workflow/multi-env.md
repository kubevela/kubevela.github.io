---
title:  多环境交付
---

## 总览

本节将介绍如何在 `WorkflowStepDefinition` 使用多环境功能。

在一些情况下，原本部署在测试环境的应用，需要迁移到生产环境上，并且其配置参数需要被更新。KubeVela 提供了一个 `ApplyEnvBindComponent` 操作符，可以帮助用户方便的管理多环境配置。

本节将介绍如何在 `WorkflowStepDefinition` 使用 `ApplyEnvBindComponent` 来管理多环境。

## 部署基础定义

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
    - name: patch
      type: env-binding
      properties:
        envs:
          - name: prod
            patch:
              components:
                - name: nginx-server
                  type: webservice
                  properties:
                    image: nginx:1.20
                    port: 80
            placement:
              clusterSelector:
                labels:
                  purpose: test

  workflow:
    steps:
      - name: deploy-server
        type: deploy2cluster
        properties:
          component: nginx-server
          policy:    patch
          env:       prod

---
apiVersion: core.oam.dev/v1beta1
kind: WorkflowStepDefinition
metadata:
  name: deploy2cluster
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        import ("vela/op")

        parameter: {
        	env:       string
        	policy:    string
        	component: string
        }

        component: op.#ApplyEnvBindComponent & {
        	env:       parameter.env
        	policy:    parameter.policy
        	component: parameter.component
          // context.namespace 表示当前 app 所在的 namespace
        	namespace: context.namespace
        }
```

## 期望结果

我们可以看到，使用最新配置的组件已经被成功地部署到了的集群中。

通过 `ApplyEnvBindComponent`，我们可以轻松地在多个环境中管理应用。
