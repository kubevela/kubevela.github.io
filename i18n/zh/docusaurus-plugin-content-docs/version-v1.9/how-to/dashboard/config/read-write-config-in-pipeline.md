---
title: 在工作流中读写配置
---

当我们阅读完 [集成 Helm 仓库](./helm-repo.md) 和 [集成私有镜像仓库](./image-registry.md) 两篇文章以后，你已经学会了通过 CLI 和 UI 创建和分发使用配置的方式。在本文中，我们将介绍通过流水线或工作流的方式来读写配置。

## 为什么我们需要在流水线中读写配置？

这里有一些常见的场景可以供大家参考：

* 部署了一个数据库中间件应用，它生成了链接信息（例如通信地址，账号，密码等），这些信息需要共享给其他应用使用。
* 部署应用的工作流执行过程中需要读取必要的配置信息。
* 基于配置信息编排流水线或工作流的运行方式。

总之，如果我们希望可以共享一些配置数据，结合着流水线运行时获取动态数据的能力，可以将结构化的数据写入到配置系统中。

## 相关步骤类型参考

* [Create Config](../../../end-user/workflow/built-in-workflow-defs.md#create-config)

* [List Configs](../../../end-user/workflow/built-in-workflow-defs.md#list-config)

* [Read Config](../../../end-user/workflow/built-in-workflow-defs.md#read-config)

* [Delete Config](../../../end-user/workflow/built-in-workflow-defs.md#delete-config)

如上所有步骤类型同时适用于应用工作流和独立流水线。

## 读写一个无模版配置

在工作流中，如果我们只是希望共享一些数据，同时也不需要对这些输入数据进行合法性校验。那么我们不需要提前创建配置模版，可以以任意数据结构创建配置，通过配置名次即可读取。例如以下用例，一个应用工作流负责写入配置，另外一个应用可以读取配置，实现两个应用间的数据传递。

```yaml
kind: Application
apiVersion: core.oam.dev/v1beta1
metadata:
  name: create-config
  namespace: "config-e2e-test"
spec:
  components: []
  workflow:
    steps:
    - name: write-config
      type: create-config
      properties:
        name: test
        config: 
          key1: value1
          key2: 2
          key3: true
          key4: 
            key5: value5
---

kind: Application
apiVersion: core.oam.dev/v1beta1
metadata:
  name: read-config
  namespace: "config-e2e-test"
spec:
  components: []
  workflow:
    steps:
    - name: read-config
      type: read-config
      properties:
        name: test
      outputs:
      - fromKey: config
        name: read-config
```
