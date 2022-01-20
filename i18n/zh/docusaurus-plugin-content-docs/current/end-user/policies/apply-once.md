---
title: 单次部署
---

本章节会介绍如何使用单次部署（apply-once）来允许应用管控资源的配置飘移。如果你想要通过 KubeVela 应用来部署资源，并在之后手动修改这些资源，你可以参考使用该策略。

## 背景

默认情况下，KubeVela 控制器会通过不断轮询应用下管控资源的方式来防止出现配置飘移。如果你希望声明应用中的资源状态为终态，这种处理方式可以让应用资源即使受到外部的变更操作也可以在一段时间后自动恢复回先前声明的状态。

然而，在一些场景下，你可能希望使用 KubeVela 应用只负责部署应用资源，而不负责维持应用资源，也就是允许通过外部修改的方式来改变应用资源的目标终态。这种情况下，你可以使用如下所示的单次部署策略来进行配置。在这种配置下，当应用资源被外部修改后，也不会被主动恢复回来。

### 如何使用
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
        image: crccheck/hello-world
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
