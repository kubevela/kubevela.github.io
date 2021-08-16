---
title:  部署组件和运维特征
---

## 总览

本节将介绍如何在 `Workflow` 部署组件和运维特征。

## 部署应用特征计划

部署如下应用特征计划，其 `Workflow` 中的步骤类型为 `apply-component`：

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
        // 指定步骤类型
        type: apply-express
        properties:
          // 指定组件名称
          component: express-server
```

## 预期结果

所有的组件及运维特征都被成功地部署到了集群中。