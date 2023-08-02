---
title: 健康状态检查
---

本章节会介绍如何使用健康策略（health policy）为应用添加定期健康检查策略。


## 背景

当一个应用部署成功后，用户经常需要观测应用的健康状态，以及每一个组件的健康状态。
对于不健康的组件，及时让用户发现问题，并提供诊断信息供用户排查。
设定部署状态检查策略可以让健康检查的流程与应用执行流程解耦，设定独立的检查周期，如每30秒检查一次。

## 健康策略

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-healthscope-unhealthy
spec:
  components:
    - name: my-server
      type: webservice
      properties:
        cmd:
          - node
          - server.js
        image: oamdev/testapp:v1
        port: 8080
      traits:
        - type: ingress
          properties:
            domain: test.my.domain
            http:
              "/": 8080
    - name: my-server-unhealthy
      type: webservice
      properties:
        cmd:
          - node
          - server.js
        image: oamdev/testapp:boom # make it unhealthy
        port: 8080
  policies:
    - name: health-policy-demo
      type: health
      properties:
        probeInterval: 5
        probeTimeout: 10
```

示例中提供了一个包含有两个组件的应用，其中一个组件是健康的，另一个由于镜像版本错误，将会无法启动，从而被认为是不健康的。

示例中的健康策略配置如下，它提供两个选填参数：`probeInterval` 表示健康检查间隔，默认是30秒；`probeTimeout` 表示健康检查超时时间，默认是10秒。

```yaml
...
  policies:
    - name: health-policy-demo
      type: health
      properties:
        probeInterval: 5
        probeTimeout: 10
...
```

关于如何定义组件的健康检查规则，请参考 **[Status Write Back](../../platform-engineers/traits/status)**.

最后我们可以从应用状态中观测应用的健康状态。

```yaml
...
  services:
    - healthy: true
      message: 'Ready:1/1 '
      name: my-server
      scopes:
      - apiVersion: core.oam.dev/v1alpha2
        kind: HealthScope
        name: health-policy-demo
        namespace: default
        uid: 1d54b5a0-d951-4f20-9541-c2d76c412a94
      traits:
      - healthy: true
        message: |
          No loadBalancer found, visiting by using 'vela port-forward app-healthscope-unhealthy'
        type: ingress
      workloadDefinition:
        apiVersion: apps/v1
        kind: Deployment
    - healthy: false
      message: 'Ready:0/1 '
      name: my-server-unhealthy
      scopes:
      - apiVersion: core.oam.dev/v1alpha2
        kind: HealthScope
        name: health-policy-demo
        namespace: default
        uid: 1d54b5a0-d951-4f20-9541-c2d76c412a94
      workloadDefinition:
        apiVersion: apps/v1
        kind: Deployment
    status: running
...

```

## 参数说明

名称 | 描述 | 类型 | 是否必须 | 默认值
:---------- | :----------- | :----------- | :----------- | :-----------
probeInterval| 健康检查间隔时间（单位/秒） | int | 否 | 30
probeTimeout| 健康检查超时时间 （单位/秒）| int | 否 | 10