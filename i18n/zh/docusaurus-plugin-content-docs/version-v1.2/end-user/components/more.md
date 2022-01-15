---
title:  获取更多
---

KubeVela 中的模块完全都是可定制和可插拔的，所以除了内置的组件之外，你还可以通过如下的方式添加更多你自己的组件类型。

## 1. 从官方或第三方能力中心获取模块化能力

### 查看能力中心的模块列表

默认情况下，命令会从 KubeVela 官方维护的[能力中心](https://registry.kubevela.net)中获取模块化功能。

例如，让我们尝试列出能力中心中所有可用的组件，使用 `--discover` 这个标志位：

```shell
$ vela comp --discover
Listing component definition from registry: default
NAME            REGISTRY        DEFINITION                      STATUS     
kustomize       default         autodetects.core.oam.dev        installed  
webserver       default         deployments.apps                uninstalled
```

`--discover` 表明将从能力中心发现能力并列出


### 从能力中心安装模块

然后你可以安装一个组件，如：

```shell
$ vela comp get webserver
Getting component definition from registry: default
Installing component: webserver
Successfully install component: webserver
```

## 2. 自定义模块化能力

* 阅读[管理模块化功能](../../platform-engineers/cue/definition-edit)，学习对已有的模块化能力进行修改和编辑。
* 从头开始[自定义模块化能力](../../platform-engineers/cue/advanced)，并了解自定义组件的[更多用法和功能](../../platform-engineers/components/custom-component)。