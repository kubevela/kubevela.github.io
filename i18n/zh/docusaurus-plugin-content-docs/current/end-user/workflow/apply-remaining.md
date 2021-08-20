---
title:  部署剩余资源
---

在一些情况下，我们希望先部署一个组件，等待其成功运行后，再一键部署剩余组件。KubeVela 提供了一个 `apply-remaining` 类型的工作流步骤，可以使用户方便的一键过滤不想要的资源，并部署剩余组件。
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
      - name: first-server
        type: apply-component
        properties:
          component: express-server
      - name: manual-approval
        # 工作流内置 suspend 类型的任务，用于暂停工作流
        type: suspend
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

查看此时应用的状态：

```shell
kubectl get application first-vela-workflow -o yaml
```

可以看到执行到了 `manual-approval` 步骤时，工作流被暂停执行了：

```yaml
...
  status:
    workflow:
      ...
      stepIndex: 2
      steps:
      - name: first-server
        phase: succeeded
        resourceRef: {}
        type: apply-component
      - name: manual-approval
        phase: succeeded
        resourceRef: {}
        type: suspend
      suspend: true
      terminated: false
```

查看集群中组件的状态，当组件运行成功后，再继续工作流：

```shell
$ kubectl get deployment

NAME             READY   UP-TO-DATE   AVAILABLE   AGE
express-server   1/1     1            1           5s

$ kubectl get ingress

NAME             CLASS    HOSTS                 ADDRESS   PORTS   AGE
express-server   <none>   testsvc.example.com             80      47s
```

继续该工作流：

```
vela workflow resume first-vela-workflow
```

重新查看应用的状态：

```shell
kubectl get application first-vela-workflow -o yaml
```

可以看到所有步骤的状态均已成功：

```yaml
...
  status:
    workflow:
      ...
      stepIndex: 3
      steps:
      - name: first-server
        phase: succeeded
        resourceRef: {}
        type: apply-component
      - name: manual-approval
        phase: succeeded
        resourceRef: {}
        type: suspend
      - name: remaining-server
        phase: succeeded
        resourceRef: {}
        type: apply-remaining
      suspend: false
      terminated: true
```

重新查看集群中组件的状态：

```shell
$ kubectl get deployment

NAME              READY   UP-TO-DATE   AVAILABLE   AGE
express-server    1/1     1            1           110s
express-server2   1/1     1            1           6s
express-server3   1/1     1            1           6s
express-server4   1/1     1            1           6s
```

可以看到，所有的组件都被部署到了集群中，且没有被重复部署。

通过填写 `apply-remaining` 中提供的参数，可以使用户方便的过滤部署资源。