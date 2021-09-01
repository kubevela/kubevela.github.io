---
title:  工作流
---

## 总览

KubeVela 的工作流机制允许你自定义应用部署计划中的步骤，粘合额外的交付流程，指定任意的交付环境。简而言之，工作流提供了定制化的控制逻辑，在原有 Kubernetes 模式交付资源（Apply）的基础上，提供了面向过程的灵活性。比如说，使用工作流实现暂停、人工验证、状态等待、数据流传递、多环境灰度、A/B 测试等复杂操作。

工作流是 KubeVela 实践过程中基于 OAM 模型的进一步探索和最佳实践，充分遵守 OAM 的模块化理念和可复用特性。每一个工作流模块都是一个“超级粘合剂”，可以将你任意的工具和流程都组合起来。使得你在现代复杂云原生应用交付环境中，可以通过一份申明式的配置，完整的描述所有的交付流程，保证交付过程的稳定性和便利性。

## 使用工作流

工作流由步骤组成，你既可以使用 KubeVela 提供的 [内置工作流步骤] 来便利地完成操作，也可以自己来编写 `WorkflowStepDefinition` 来达到想要的效果。

我们可以使用 `vela def` 通过编写 `Cue template` 来定义工作流步骤。下面我们来完成这个场景：使用 Helm 部署一个 Tomcat，并在部署完成后自动向 Slack 发送消息通知。

### 编写工作流步骤

KubeVela 提供了一些 CUE 操作类型用于编写工作流步骤。这些操作均由 `vela/op` 包提供。

| 操作名 | 说明 | 参数 |
| :---: | :--: | :-- |
| ApplyApplication | 部署应用中的所有资源 | - |
| Read | 读取 Kubernetes 集群中的资源。 | value: 描述需要被读取资源的元数据，比如 kind、name 等，操作完成后，集群中资源的数据会被填充到 `value` 上。<br /> err: 如果读取操作发生错误，这里会以字符串的方式指示错误信息。 |
| ConditionalWait | 会让 Workflow Step 处于等待状态，直到条件被满足。 | continue: 当该字段为 true 时，Workflow Step 才会恢复继续执行。 |
| ... | ... | ... |

> 所有的操作类型可参考 [Cue Actions](./cue-actions)

为了完成这个场景，我们需要两个 `WorkflowStepDefinition`：

1. 部署 Tomcat，并且等待 Deployment 的状态变为 running，这一步需要自定义工作流步骤来实现。
2. 发送 Slack 通知，这一步可以使用 KubeVela 内置的 [webhook-notification] 步骤来实现。

#### 部署 Tomcat 步骤

首先，通过 `vela def init` 来生成一个 `WorkflowStepDefinition` 模板：

```shell
vela def init my-helm -t workflow-step --desc "Apply helm charts and wait till it's running." -o my-helm.cue
```

得到如下结果：
```shell
$ cat my-helm.cue

"my-helm": {
	annotations: {}
	attributes: {}
	description: "Apply helm charts and wait till it's running."
	labels: {}
	type: "workflow-step"
}

template: {
}
```

引用 `vela/op` 包，并将 Cue 代码补充到 `template` 中：

```
import (
  "vela/op"
)

"my-helm": {
	annotations: {}
	attributes: {}
	description: "Apply helm charts and wait till it's running."
	labels: {}
	type: "workflow-step"
}

template: {
  // 部署应用中的所有资源
  apply: op.#ApplyApplication & {}

  resource: op.#Read & {
     value: {
       kind: "Deployment"
       apiVersion: "apps/v1"
       metadata: {
         name: "tomcat"
         // 可以使用 context 来获取该 Application 的任意元信息
         namespace: context.namespace
       }
     }
  }

  workload: resource.value
  // 等待 helm 的 deployment 可用
  wait: op.#ConditionalWait & {
    continue: workload.status.readyReplicas == workload.status.replicas && workload.status.observedGeneration == workload.metadata.generation
  }
}
```

部署到集群中：

```shell
$ vela def apply my-helm.cue

WorkflowStepDefinition my-helm in namespace vela-system updated.
```

#### 发送 Slack 通知步骤

直接使用内置的 [webhook-notification] 步骤。

### 编写应用

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: tomcat
    type: helm
    properties:
      repoType: helm
      repoUrl: https://charts.bitnami.com/bitnami
      chart: tomcat
      version: "9.2.20"
  workflow:
    steps:
      - name: tomcat
        # 指定步骤类型
        type: my-helm
        outputs:
          - name: msg
            # 将 my-helm 中读取到的 deployment status 作为信息导出
            exportKey: resource.value.status.conditions[0].message
      - name: send-message
        type: webhook-notification
        inputs:
          - from: msg
            # 引用上一步中 outputs 中的值，并传入到 properties 的 slack.message.text 中作为输入
            parameterKey: slack.message.text 
        properties:
          slack:
            # 你的 slack webhook 地址，请参考：https://api.slack.com/messaging/webhooks
            url: slack url
```

将该应用部署到集群中，可以看到所有的资源都已被成功部署，且 Slack 中收到了对应的通知，通知内容为该 Deployment 的状态信息。