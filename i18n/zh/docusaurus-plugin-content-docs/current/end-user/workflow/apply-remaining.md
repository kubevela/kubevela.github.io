---
title:  部署剩余资源
---

在一些情况下，我们希望一键部署一组资源，但跳过不想部署的，再一个个指定部署又太过繁琐。KubeVela 提供了一个 `apply-remaining` 类型的工作流步骤，可以使用户方便的一键过滤不想要的资源，并部署剩余组件。
本节将介绍如何在工作流中通过 `apply-remaining` 部署剩余资源。

## 如何使用

部署如下应用部署计划，其工作流中的步骤类型为 `apply-remaining`：

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
  - name: express-server2
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  - name: express-server3
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  - name: express-server4
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
      - name: remaining-server
        # 指定步骤类型
        type: apply-remaining
        properties:
          # 指定需要被跳过的组件
          exceptions:
            # 配置组件参数
            express-server:
              # skipApplyWorkload 表明是否需要跳过组件的部署
              skipApplyWorkload: true
              # skipAllTraits 表明是否需要跳过所有运维特征的部署
              skipAllTraits: true
```

## 期望结果

查看集群中组件的状态：

```shell
$ kubectl get deployment

NAME              READY   UP-TO-DATE   AVAILABLE   AGE
express-server2   1/1     1            1           5s
express-server3   1/1     1            1           5s
express-server4   1/1     1            1           4s

$ kubectl get ingress

No resources found in default namespace.
```

可以看到，第一个组件 `express-server` 及其运维特征 `ingress` 都被跳过了部署，而其他三个组件都被部署到了集群中。

通过填写 `apply-remaining` 中提供的参数，可以使用户方便的过滤部署资源。