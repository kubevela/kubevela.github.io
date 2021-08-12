---
title:  多环境交付
---

本节将介绍如何在 `WorkflowStepDefinition` 使用多环境功能。

假设我们原本部署在测试环境的应用，需要迁移到生产环境上，并且需要更新镜像版本，此时我们可以先编写这样一个应用部署计划：

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
```

可以看到，在 `policies` 中，是一些需要被更新的配置信息。而在 `workflow` 的 `properties` 中，分别指定了 `component`、`policy` 以及 `env` 名。
接下来，可以在 `ApplyEnvBindComponent` 中使用这几个参数。

```yaml
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

通过 `ApplyEnvBindComponent`，可以便捷地多环境管理应用。
