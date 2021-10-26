---
title:  获取更多
---

KubeVela 中的模块完全都是可定制和可插拔的，所以除了内置的运维能力之外，你还可以通过如下的方式添加更多你自己的运维能力。

## 1. 从官方或第三方能力中心获取模块化能力

### 查看能力中心的模块列表

默认情况下，命令会从 KubeVela 官方维护的[能力中心](https://registry.kubevela.net)中获取模块化功能。

例如，让我们尝试列出能力中心中所有可用的 trait：

```shell
$ vela trait --discover
Showing trait definition from registry: default
I1025 19:18:59.276330   80303 request.go:665] Waited for 1.042612105s due to client-side throttling, not priority and fairness, request: GET:https://127.0.0.1:63926/apis/standard.oam.dev/v1alpha1?timeout=32s
NAME                    REGISTRY        DEFINITION                      APPLIES-TO                      STATUS
autoscale               default         autoscalers.standard.oam.dev    [deployments.apps]              uninstalled
crd-manual-scaler       default         manualscalertraits.core.oam.dev [deployments.apps]              uninstalled
dynamic-sa              default                                         [deployments.apps]              uninstalled
env                     default                                         [deployments.apps]              installed
expose                  default                                         []                              installed
hpa                     default                                         [deployments.apps]              uninstalled
init-container          default                                         [deployments.apps]              installed
kautoscale              default                                         [deployments.apps]              uninstalled
metrics                 default         metricstraits.standard.oam.dev  [deployments.apps jobs.batch]   uninstalled
node-affinity           default                                         [deployments.apps]              installed
rollout                 default         canaries.flagger.app            [deployments.apps]              installed
route                   default         routes.standard.oam.dev         [deployments.apps]              uninstalled
virtualgroup            default                                         [deployments.apps]              uninstalled
```

`--discover` 表明将从能力中心发现能力并列出

### 从能力中心安装模块

然后你可以安装一个 trait，如：

```shell
$ vela trait get init-container
Getting component definition from registry: default
Installing component: init-container
Successfully install trait: init-container
```

## 2. 自定义模块化能力

* 阅读[管理模块化功能](../../platform-engineers/cue/definition-edit)，学习对已有的模块化能力进行修改和编辑。
* 从头开始[自定义模块化能力](../../platform-engineers/cue/advanced)，并了解自定义运维能力的[更多用法和功能](../../platform-engineers/traits/customize-trait)。