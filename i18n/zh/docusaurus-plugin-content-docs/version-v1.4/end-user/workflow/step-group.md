---
title:  子步骤
---

本节将介绍如何在 KubeVela 中使用子步骤。

KubeVela 工作流中有一个特殊的步骤类型 `step-group`，在使用步骤组类型的步骤时，你可以在其中声明子步骤。

> 注意：在当前版本（1.4）中，步骤组中的子步骤们是并发执行的。
> 
> 在未来的版本（1.5+）中，你将可以显示指定工作流步骤及子步骤的执行方式。

部署如下例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: sub-success
spec:
  components:
    - name: express-server1
      type: webservice
      properties:
        image: crccheck/hello-world
    - name: express-server2
      type: webservice
      properties:
        image: crccheck/hello-world
    - name: express-server3
      type: webservice
      properties:
        image: crccheck/hello-world

  workflow:
    steps:
      - name: step1
        type: apply-component
        properties:
          component: express-server1
      - name: step2
        type: step-group
        subSteps:
          - name: step2-sub1
            type: apply-component
            properties:
              component: express-server2
          - name: step2-sub2
            type: apply-component
            properties:
              component: express-server3
```

在默认情况下，步骤顺序执行，因此，step1 部署完成后才会执行 step2。而在步骤组中，默认子步骤将并发执行，因此 step2-sub1 和 step2-sub2 将同时部署。