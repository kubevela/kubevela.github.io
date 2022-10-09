---
title:  暂停和继续
---

本节将介绍如何在 KubeVela 中暂停和继续工作流。

## 暂停工作流

在 KubeVela 中，你可以选择使用 `vela` 命令来手动暂停工作流的执行，也可以使用一个内置的特殊步骤类型 `suspend` 使工作流自动进入暂停状态。

### 手动暂停

如果你有一个正在运行工作流的应用，并且你希望暂停它的执行，你可以使用 `vela workflow suspend` 来暂停该工作流，在未来可以通过 `vela workflow resume` 继续工作流。

* 暂停工作流

```bash
vela workflow suspend my-app
```

:::tip
如果工作流已经执行完毕，对应用使用 `vela workflow suspend` 命令不会产生任何效果。
:::

### 使用暂停步骤

部署如下例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: suspend-demo
  namespace: default
spec:
  components:
  - name: comp1
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  - name: comp2
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
    - name: apply1
      type: apply-component
      properties:
        component: comp1
    - name: suspend
      type: suspend
    - name: apply2
      type: apply-component
      properties:
        component: comp2
```

使用 vela status 命令查看应用状态：

```bash
vela status suspend-demo
```

<details>
  <summary>期望输出</summary>

```
About:

  Name:      	suspend-demo
  Namespace: 	default
  Created at:	2022-06-27 17:36:58 +0800 CST
  Status:    	workflowSuspending

Workflow:

  mode: StepByStep
  finished: false
  Suspend: true
  Terminated: false
  Steps
  - id:yj9h29uv6v
    name:apply1
    type:apply-component
    phase:succeeded
  - id:xvmda4he5e
    name:suspend
    type:suspend
    phase:running

Services:

  - Name: comp1
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```
</details>

可以看到，当第一个步骤执行完成之后，会开始执行 `suspend` 步骤。而这个步骤会让工作流进入暂停状态。

## 继续工作流

### 手动继续工作流

当工作流进入暂停状态后，你可以使用 `vela workflow resume` 命令来手动继续工作流。workflow resume 命令会把工作流从暂停状态恢复到执行状态。

以上面处于暂停状态的应用为例：

```bash
vela workflow resume suspend-demo
```

成功继续工作流后，查看应用的状态：

```bash
vela status suspend-demo
```

<details>
  <summary>期望输出</summary>

```
About:

  Name:      	suspend-demo
  Namespace: 	default
  Created at:	2022-06-27 17:36:58 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:yj9h29uv6v
    name:apply1
    type:apply-component
    phase:succeeded
    message:
  - id:xvmda4he5e
    name:suspend
    type:suspend
    phase:succeeded
    message:
  - id:66jonaxjef
    name:apply2
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: comp2
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied

  - Name: comp1
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```
</details>

可以看到，工作流已经继续执行完毕。

### 手动终止工作流

当工作流处于暂停状态时，如果你想终止它，你可以使用 `vela workflow terminate` 命令来终止工作流。

* 终止工作流

```bash
vela workflow terminate my-app
```

:::tip
区别于暂停，终止的工作流不能继续执行，只能重新运行工作流。重新运行意味着工作流会重新开始执行所有工作流步骤，而继续工作流则是从暂停的步骤后面继续执行。
:::

* 重新运行工作流

```bash
vela workflow restart my-app
```

:::caution
一旦应用被终止，KubeVela 控制器不会再对资源做状态维持，你可以对底层资源做手动修改但请注意防止配置漂移。
:::

工作流执行完毕进入正常运行状态的应用无法被终止或重新运行。

### 自动继续工作流

如果你希望经过了一段时间后，工作流能够自动被继续。那么，你可以在 `suspend` 步骤中加上 `duration` 参数。当 `duration` 时间超过后，工作流将自动继续执行。

部署如下例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: auto-resume
  namespace: default
spec:
  components:
  - name: comp1
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  - name: comp2
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
    - name: apply1
      type: apply-component
      properties:
        component: comp1
    - name: suspend
      type: suspend
      properties:
        duration: 5s
    - name: apply2
      type: apply-component
      properties:
        component: comp2
```

查看应用状态：

```bash
vela status auto-resume
```

<details>
<summary>期望输出</summary>

```
About:

  Name:      	auto-resume
  Namespace: 	default
  Created at:	2022-06-27 17:57:35 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:q5jhm6mgwv
    name:apply1
    type:apply-component
    phase:succeeded
    message:
  - id:3xgfcp3cuj
    name:suspend
    type:suspend
    phase:succeeded
    message:
  - id:zjux8ud876
    name:apply2
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: comp2
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied

  - Name: comp1
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

</details>

可以看到，`suspend` 步骤在五秒后自动执行成功，继续了工作流。
