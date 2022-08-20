---
title: 一次性交付（与其他控制器协同）
---

默认情况下，KubeVela 控制器会通过不断轮询应用下管控资源的方式来防止出现配置飘移。如果你希望声明应用中的资源状态为终态，这种处理方式可以让应用资源即使受到外部的变更操作也可以在一段时间后自动恢复回先前声明的状态。

然而，在一些场景下，你可能希望使用 KubeVela 应用只负责部署应用资源，而不负责维持应用资源，也就是允许通过外部修改的方式来改变应用资源的目标终态。这种情况下，你可以使用如下所示的 apply-once 策略来进行配置。在这种配置下，当应用资源被外部修改后，也不会被主动恢复回来。比如在以下用例中非常有用：

1. 与 HPA 控制器协同，HPA 控制器会修改副本数字段。
2. 与 Istio 协同，Istio 可能注入新的容器到 Deployment 中。
3. 其他会修改资源配置的控制器。

### 允许全部字段变更

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: apply-once-app
spec:
  components:
    - name: hello-world
      type: webservice
      properties:
        image: oamdev/hello-world
      traits:
        - type: scaler
          properties:
            replicas: 1
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
```

在这个样例中，如果你在应用进入运行中状态之后修改 hello-world 这个 Deployment 资源的副本数，即便该副本数与应用中声明的副本数不一致，应用也不会自动将副本数改回原本声明的状态，即接受手动变更。

### 允许指定字段变更

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: apply-once-app
spec:
  components:
    - name: hello-world
      type: webservice
      properties:
        image: oamdev/hello-world
      traits:
        - type: scaler
          properties:
            replicas: 3
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
        rules:
        - path:
          - spec.replicas
          selector:
            resourceTypes:
            - Deployment

```

在这个例子中，只支持副本数配置由其他控制器修改，比如 HPA。通过配置资源筛选和配置路径进行忽略规则的配置。支持的筛选方式包括：

* componentNames: 通过组件名称选择
* componentTypes: 通过组件类型选择
* oamTypes: 通过生成资源的配置类型选择，比如 COMPONENT 或 TRAIT
* resourceNames: 通过资源名称选择
* resourceTypes: 通过资源类型选择
* traitTypes: 通过 Trait 类型选择

配置漂移检查会在应用进入 running 状态或者是 suspending 状态（没有错误的情况下）每隔 5 分钟进行一次。你可以通过设置控制器启动参数中的 `application-re-sync-period` 来修改时间间隔。你可以在[启动参数](../../platform-engineers/system-operation/bootstrap-parameters)章节中了解更多。
