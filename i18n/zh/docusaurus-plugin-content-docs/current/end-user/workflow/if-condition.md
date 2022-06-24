---
title:  条件判断
---

本节将介绍如何在 KubeVela 中为工作流步骤添加条件判断。

在 KubeVela 工作流中，每个步骤都可以指定一个 `if`，你可以使用 `if` 来确定是否应该执行该步骤。

## 不指定 If

在步骤没有指定 If 的情况下，KubeVela 会根据先前步骤的状态来判断是否应该执行该步骤。默认步骤的执行条件是：在该步骤前的所有步骤状态均为成功。

这也意味着，如果步骤 A 执行失败，那么步骤 A 之后的步骤 B 会被跳过，不会被执行。

部署如下例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: err-with-no-if
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      ports:
        - port: 8000
  workflow:
    steps:
      - name: apply-err
        type: apply-object
        properties:
          value:
            test: err
      - name: apply-comp
        type: apply-component
        properties:
          component: express-server
```

使用 vela status 命令查看应用状态：

```bash
$ vela status err-with-no-if
About:

  Name:      	err-with-no-if
  Namespace: 	default
  Created at:	2022-06-24 18:14:46 +0800 CST
  Status:    	workflowTerminated

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: true
  Steps
  - id:bztlmifsjl
    name:apply-err
    type:apply-object
    phase:failed
    message:step apply: run step(provider=kube,do=apply): Object 'Kind' is missing in '{"test":"err"}'
  - id:el8quwh8jh
    name:apply-comp
    type:apply-component
    phase:skipped
    message:

Services:
```

可以看到，步骤 `apply-err` 会因为尝试部署一个非法的资源而导致失败，同时，因为之前的步骤失败了，步骤 `apply-comp` 将被跳过。

## Always

如果你希望一个步骤无论如何都应该被执行，那么，你可以为这个步骤指定 `if` 为 `always`。

部署如下例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: err-with-always
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      ports:
        - port: 8000
  workflow:
    steps:
      - name: apply-err
        type: apply-object
        properties:
          value:
            test: err
      - name: apply-comp
        if: always
        type: apply-component
        properties:
          component: express-server
```

使用 vela status 命令查看应用状态：

```bash
About:

  Name:      	err-with-always
  Namespace: 	default
  Created at:	2022-06-24 18:20:50 +0800 CST
  Status:    	workflowTerminated

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: true
  Steps
  - id:ocqbzsg5ma
    name:apply-err
    type:apply-object
    phase:failed
    message:step apply: run step(provider=kube,do=apply): Object 'Kind' is missing in '{"test":"err"}'
  - id:vzei1r7tb7
    name:apply-comp
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: express-server
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

可以看到，步骤 `apply-err` 会因为尝试部署一个非法的资源而导致失败，而步骤 `apply-comp` 因为指定了 `if: always`，所以一定会被执行。

## 自定义 If 条件判断

> 注意：你需要升级到 1.5 及以上版本来使用自定义 If 条件判断。

你也可以编写自己的判断逻辑来确定是否应该执行该步骤。注意： `if` 里的值将作为 Cue 代码执行。KubeVela 在 `if` 中提供了一些内置变量，它们是：

* `status`：status 中包含了所有工作流步骤的状态信息。你可以使用 `status.<step-name>.phase == "succeeded"` 来判断步骤的状态，也可以使用简化方式`status.<step-name>.succeeded` 来进行判断。
* `inputs`：inputs 中包含了该步骤的所有 inputs 参数。你可以使用 `inputs.<input-name> == "value"` 来获取判断步骤的输入。

> 注意，如果你的步骤名或者 inputs 名并不是一个有效的 Cue 变量名（如：包含 `-`，或者以数字开头等），你可以用如下方式引用：`status["invalid-name"].failed`

部署如下例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: custom-if
  namespace: default
spec:
  components:
  - name: comp-custom-if
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
    traits:
  workflow:
    steps:
    - name: apply
      type: apply-component
      properties:
        component: comp-custom-if
      outputs:
        - name: comp-output
          valueFrom: context.name
    - name: notification
      type: notification
      inputs:
        - from: comp-output
          parameterKey: slack.message.text
      if: inputs["comp-output"] == "custom-if"
      properties:
        slack:
          url:
            value: <your slack url>
    - name: notification-skip
      type: notification
      if: status.notification.failed
      properties:
        slack:
          url:
            value: <your slack url>
          message:
            text: skip
    - name: notification-succeeded
      type: notification
      if: status.notification.succeeded
      properties:
        slack:
          url:
            value: <your slack url>
          message:
            text: succeeded
```

使用 vela status 命令查看应用状态：

```bash
$ vela status custom-if
About:

  Name:      	custom-if
  Namespace: 	default
  Created at:	2022-06-25 00:37:14 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:un1zd8qc6h
    name:apply
    type:apply-component
    phase:succeeded
    message:
  - id:n5xbtgsi68
    name:notification
    type:notification
    phase:succeeded
    message:
  - id:2ufd3v6n78
    name:notification-skip
    type:notification
    phase:skipped
    message:
  - id:h644x6o8mb
    name:notification-succeeded
    type:notification
    phase:succeeded
    message:

Services:

  - Name: comp-custom-if
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

可以看到，第一个步骤 `apply` 成功后，会输出一个 outputs。第二个步骤 `notification` 中引用第一个步骤的 outputs 作为 inputs 并且进行判断，满足条件后成功发送通知。第三个步骤 `notification-skip` 判断第二个步骤是否为失败状态，条件不满足，这个步骤跳过。第四个步骤 `notification-succeeded` 判断第二个步骤是否成功，条件满足，该步骤成功执行。