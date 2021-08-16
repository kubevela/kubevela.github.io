---
title:  多环境交付
---

## 总览

本节将介绍如何在 `Workflow` 使用多环境功能。

在一些情况下，原本部署在测试环境的应用，需要迁移到生产环境上，并且其配置参数需要被更新。KubeVela 提供了一个 `multi-env` 类型的 `Workflow` 步骤，可以帮助用户方便的管理多环境配置。

本节将介绍如何在 `Workflow` 使用 `multi-env` 来管理多环境。

## 部署应用特征计划

部署如下应用特征计划，其 `Workflow` 中的步骤类型为 `multi-env`：

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
        // 指定步骤类型
        type: multi-env
        properties:
          // 指定组件名称
          component: nginx-server
          // 指定 policy 名称
          policy: patch
          // 指定 policy 中的 env 名称
          env: prod
```

## 期望结果

我们可以看到，使用最新配置的组件已经被成功地部署到了的集群中。

通过 `multi-env`，我们可以轻松地在多个环境中管理应用。
