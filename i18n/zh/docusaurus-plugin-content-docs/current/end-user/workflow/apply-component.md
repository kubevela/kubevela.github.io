---
title:  部署组件和运维特征
---

本节将介绍如何在工作流中部署组件和运维特征。

## 如何使用

部署如下应用部署计划`：

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
  - name: nginx-server
    type: webservice
    properties:
      image: nginx:1.21
      port: 80
  workflow:
    steps:
      - name: express-server
        # 指定步骤类型
        type: apply-component
        properties:
          # 指定组件名称
          component: express-server
      - name: manual-approval
        # 工作流内置 suspend 类型的任务，用于暂停工作流
        type: suspend
      - name: nginx-server
        type: apply-component
        properties:
          component: nginx-server
```

在一些情况下，我们在部署某些组件前，需要暂停整个工作流，以等待人工审批。

在本例中，部署完第一个组件后，工作流会暂停。直到继续的命令被发起后，才开始部署第二个组件。

部署应用特征计划后，查看工作流状态：

```shell
$ kubectl get app first-vela-workflow

NAME                  COMPONENT        TYPE         PHASE                HEALTHY   STATUS   AGE
first-vela-workflow   express-server   webservice   workflowSuspending                      2s
```

可以通过 `vela workflow resume` 命令来使工作流继续执行。

```shell
$ vela workflow resume first-vela-workflow

Successfully resume workflow: first-vela-workflow
```

查看应用部署计划，可以看到状态已经变为执行中：

```shell
$ kubectl get app first-vela-workflow

NAME                  COMPONENT        TYPE         PHASE     HEALTHY   STATUS   AGE
first-vela-workflow   express-server   webservice   running   true               10s
```

## 期望结果

查看集群中组件的状态：

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
express-server   1/1     1            1           3m28s
nginx-server     1/1     1            1           3s

$ kubectl get ingress

NAME             CLASS    HOSTS                 ADDRESS   PORTS   AGE
express-server   <none>   testsvc.example.com             80      4m7s
```

可以看到，所有的组件及运维特征都被成功地部署到了集群中。