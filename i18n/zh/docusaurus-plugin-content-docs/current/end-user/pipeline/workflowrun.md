---
title: 流水线的 K8S API
---

独立运行的流水线功能相较于 KubeVela 本身具备的应用级工作流，具有以下特性：

1. 它可以管理多个 KubeVela 应用，跨多个环境创建。
2. 它**不绑定应用**，可以**独立使用**，如针对一组资源做扩缩容，针对一个应用做面向流程的灰度发布，批量执行一组运维操作。
3. 它是**一次性**的，不对资源做管理，即使删除流水线也不会删除创建出来的资源。
4. 它与应用流水线的执行引擎是同源的，这也完全继承了 KubeVela 轻量级工作流的特性，相较于传统的基于容器的 CI 流水线，KubeVela 的流水线在执行各类资源操作时不依赖容器、无需额外的计算资源。

:::tip
为了更好地复用已有的能力及保证技术一致性，我们将原本应用工作流中的工作流引擎部分进行了拆分。
应用内工作流和应用间流水线都使用了这个 [工作流引擎](https://github.com/kubevela/workflow) 作为底层的技术实现。应用工作流体现为应用中的 `Workflow` 字段，而流水线则体现为 [WorkflowRun](https://github.com/kubevela/workflow) 资源。

这意味着绝大部分工作流步骤在二者间都是通用的，如：暂停，通知，发送 HTTP 请求，读取配置等。

但 WorkflowRun 中只有步骤的配置，**没有**组件、运维特征、策略的配置。因此，与组件等相关的步骤只能在应用内工作流中使用，如：部署/更新组件、运维特征等。
:::

## WorkflowRun

WorkflowRun 为流水线执行的 K8S API。你可以选择在 WorkflowRun 里执行一个外部的 Workflow 模板或者执行直接在里面配置要执行的步骤（如果你同时声明了二者，WorkflowRun 里的步骤配置会覆盖模板中的内容）。一个 WorkflowRun 的组成如下：

```
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: <名称>
  namespace: <命名空间>
spec:
  mode: <可选项，WorkflowRun 的执行模式，默认步骤的执行模式是 StepByStep，子步骤为 DAG>
    steps: <DAG 或者 StepByStep>
    subSteps: <DAG 或者 StepByStep>
  context:
    <可选项，自定义上下文参数>
  workflowRef: <可选项，用于运行的外部 Workflow 模板>
  workflowSpec: <可选项，用于运行的配置>
    steps:
    - name: <名称>
      type: <类型>
      dependsOn:
        <可选项，该步骤需要依赖的步骤名称数组>
      meta: <可选项，该步骤的额外信息>
        alias: <可选项，该步骤的别名>  
      properties:
        <步骤参数值>
      if: <可选项，用于判断该步骤是否要被执行>
      timeout: <可选项，该步骤的超时时间>
      outputs: <可选项，该步骤的输出>
        - name: <输出名>
          valueFrom: <输出来源>
      inputs: <可选项，该步骤的输入>
        - name: <输入来源名>
          parameterKey: <可选项，该输入要被设置为步骤的某个参数名>
      subSteps:
        <可选项，如果步骤类型为 step-group，可在这里声明子步骤>
```

## 状态

### WorkflowRun 状态

WorkflowRun 拥有以下几种状态：

|  WorkflowRun 状态  |                 说明                  |
| :-------:  |  :-----------------------------------: |
| executing  |   当 WorkflowRun 中的步骤正在执行时，其状态为 executing                        |
| suspending |  当 WorkflowRun 被暂停时，其状态为 suspending                                |
| terminated |  当 WorkflowRun 被终止时，其状态为 terminated                                |
| failed     |      当 WorkflowRun 执行完成，且有步骤失败时，其状态为 failed                   |
| succeeded  |   当 WorkflowRun 执行完成，且所有步骤的状态均为成功或者跳过时，其状态为 succeeded  |

### WorkflowRun 步骤状态

WorkflowRun 步骤拥有以下几种状态：

|  步骤状态   |                 说明                  |
| :-------:  |  :-----------------------------------: |
| running    |   该步骤正在执行                       |
| succeeded  |   该步骤执行完成，且状态为成功                               |
| failed     |   该步骤执行失败                              |
| skipped    |   该步骤被跳过，没有被执行                   |
| pending    |   步骤等待某些条件来执行，如：等待 inputs 的输入  |

#### WorkflowRun 步骤失败原因

对于执行失败的步骤，步骤状态的 Message 中会显示报错信息，步骤状态的 Reason 会显示失败原因，分为以下几种：

|  步骤失败原因   |                 说明                  |
| :-------:  |  :-----------------------------------: |
| Execute    |   步骤执行出错                       |
| Terminate  |   步骤被终止                               |
| Output     |   步骤在输出 Output 时出错                              |
| FailedAfterRetries    |   步骤执行失败达到重试上限                   |
| Timeout   |   步骤因超时出错  |
| Action    |   步骤定义中执行了 [op.#Fail](../../platform-engineers/workflow/cue-actions#fail)  |

## 执行模式

你可以在 WorkflowRun 或者 Workflow 模板中定义执行模式：

```
mode:
  steps: <DAG or StepByStep>
  subSteps: <DAG or StepByStep>
```

如果没有显示指定，默认 WorkflowRun 会以顺序（StepByStep）执行步骤，并行（DAG）执行子步骤的模式来执行。

:::caution
如果你同时在 WorkflowRun 和 Workflow 中指定了执行模式，那么 WorkflowRun 中的模式会覆盖 Workflow 模板中的执行模式。
:::

## 内置步骤

你可以在 WorkflowRun 中使用**不带有**label: `custom.definition.oam.dev/scope: Application` 的 KubeVela [内置步骤](../workflow/built-in-workflow-defs)。

## 自定义步骤

你可以参考 [自定义步骤文档](../../platform-engineers/workflow/workflow) 来自定义你的步骤。

:::caution
在自定义 WorkflowRun 的步骤过程中，你无法使用[对当前应用的操作](../../platform-engineers/workflow/cue-actions#对当前应用的操作)
:::

## 核心功能

### 操作 WorkflowRun

:::tip
vela workflow 命令可以操作应用内的工作流，也可以操作 WorkflowRun。
它默认会先去找同名的应用，如果找不到则会去找 WorkflowRun。
你也可以在使用时通过 `--type=workflow` 来表明操作对象为 WorkflowRun。
:::

#### 暂停

如果你有一个正在执行中的 WorkflowRun，那么，你可以用 `suspend` 命令来暂停这个工作流。

```bash
vela workflow suspend <name>
```

:::tip
如果工作流已经执行完毕，使用 `vela workflow suspend` 命令不会产生任何效果。
:::

#### 继续

当 WorkflowRun 进入暂停状态后，你可以使用 `vela workflow resume` 命令来手动继续工作流。workflow resume 命令会把 WorkflowRun 从暂停状态恢复到执行状态。

```bash
vela workflow resume <name>
```

#### 终止

当 WorkflowRun 正在执行时，如果你想终止它，你可以使用 `vela workflow terminate` 命令来终止 WorkflowRun。

```bash
vela workflow terminate <name>
```

#### 查看日志

如果你想查看 WorkflowRun 的日志，你可以使用 `vela workflow logs` 命令来查看日志。

:::tip
只有配置了 [op.#Log](../../platform-engineers/workflow/cue-actions#log) 的步骤才会有日志输出。
:::

```bash
vela workflow logs <name>
```

### 暂停和继续

#### 手动暂停

参考 [操作 WorkflowRun](#暂停)。

#### 自动暂停（使用暂停步骤）

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: suspend
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: step1
        type: apply-deployment
        properties:
          image: nginx
      - name: step2-suspend
        type: suspend
      - name: step2
        type: apply-deployment
        properties:
          image: nginx
```

WorkflowRun 将在执行完第一个步骤后自动暂停，直至你继续了这个 WorkflowRun，第三个步骤才会被执行。

#### 手动继续

参考 [操作 WorkflowRun](#继续)。

#### 自动继续

在 `suspend` 类型的步骤中配置 `duration: <duration>`，当 `duration` 时间超过后，WorkflowRun 将自动继续执行。

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: suspend
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: step1
        type: apply-deployment
        properties:
          image: nginx
      - name: step2-suspend
        type: suspend
        properties:
          duration: 10s
      - name: step2
        type: apply-deployment
        properties:
          image: nginx
```

当第一个步骤执行完成后，WorkflowRun 将进入暂停状态，十秒过后，WorkflowRun 将自动继续执行第三个步骤。

### 子步骤

步骤中有一个特殊的步骤类型：`step-group`。在使用步骤组类型的步骤时，你可以在其中声明子步骤。

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: group
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: my-group
        type: step-group
        subSteps:
          - name: sub1
            type: apply-deployment
            properties:
              image: nginx
          - name: sub2
            type: apply-deployment
            properties:
              image: nginx
```

### 依赖关系

你可以通过 `dependsOn` 来指定步骤之间的依赖关系。

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: dependency
  namespace: default
spec:
  mode:
    steps: DAG
  workflowSpec:
    steps:
      - name: step1
        type: apply-deployment
        dependsOn:
          - step2
          - step3
        properties:
          image: nginx
      - name: step2
        type: apply-deployment
        properties:
          image: nginx
      - name: step3
        type: apply-deployment
        properties:
          image: nginx
```

step1 将在 step2 和 step3 执行完成后执行。

### 数据传递

你可以通过 `inputs` 和 `outputs` 完成步骤间的数据传递，具体介绍请参考 [步骤间的输入输出](../workflow/inputs-outputs#outputs)。

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: request-http
  namespace: default
spec:
  workflowSpec:
    steps:
    - name: request
      type: request
      properties:
        url: https://api.github.com/repos/kubevela/workflow
      outputs:
        - name: stars
          valueFrom: |
            import "strconv"
            "Current star count: " + strconv.FormatInt(response["stargazers_count"], 10)
    - name: notification
      type: notification
      inputs:
        - from: stars
          parameterKey: slack.message.text
      properties:
        slack:
          url:
            value: <your slack url>
```

该 WorkflowRun 中，第一步会去请求 GitHub API，拿到 workflow 仓库的 star 数作为 Output，再在下一步中使用这个 Output 作为 Input，从而将 star 数的信息发送到 Slack。

### 超时

你可以为步骤指定 `timeout` 来表示该步骤的超时时间。

`timeout` 遵循 `duration` 格式，例如 `30s`, `1m` 等。你可以参考 Golang 的 [parseDuration](https://pkg.go.dev/time#ParseDuration)。

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: timeout
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: suspend
        type: suspend
        timeout: 3s
```

如果上述 WorkflowRun 没有在三秒内被继续执行，那么 suspend 步骤将因超时而失败。

### 条件判断

你可以在步骤中使用 `if` 来判断是否执行该步骤。

#### 不使用 if

在步骤不指定 if 的情况下，如果步骤之前的步骤执行失败，那么该步骤将被跳过，不会被执行。

#### if: always

在步骤中指定 if: always 的情况下，无论步骤之前的步骤是否执行成功，该步骤都会被执行。

#### 自定义 if

你也可以编写自己的判断逻辑来确定是否应该执行该步骤。注意： `if` 里的值将作为 CUE 代码执行。WorkflowRun 在 `if` 中提供了一些内置变量，它们是：

* `status`：status 中包含了所有 WorkflowRun 步骤的状态信息。你可以使用 `status.<step-name>.phase == "succeeded"` 来判断步骤的状态，也可以使用简化方式`status.<step-name>.succeeded` 来进行判断。
* `inputs`：inputs 中包含了该步骤的所有 inputs 参数。你可以使用 `inputs.<input-name> == "value"` 来获取判断步骤的输入。
* `context`：context 中包含了 WorkflowRun 的所有 context 参数。你可以使用 `context.<context-name> == "value"` 来获取判断 WorkflowRun 的 context。

:::tip
注意，如果你的步骤名、inputs 名或者 context 名并不是一个有效的 CUE 变量名（如：包含 `-`，或者以数字开头等），你可以用如下方式引用：`status["invalid-name"].failed`。
:::

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: if-condition
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: suspend
        type: suspend
        timeout: 3s
      - name: my-step
        type: apply-deployment
        if: status.suspend.failed
        properties:
          image: nginx
      - name: my-step2
        type: apply-deployment
        if: status.suspend.succecceed
        properties:
          image: busybox
```

上述 WorkflowRun 中，如果 suspend 步骤因超时而失败，那么 my-step 步骤将会被执行，否则 my-step2 步骤将会被执行。

### 自定义上下文参数

WorkflowRun 中的步骤拥有一些内置的上下文参数，你也可以在 `context` 中声明你自己的上下文参数。

:::tip
如果你的自定义上下文参数与内置上下文参数重名，那么内置上下文参数将会被自定义参数覆盖。
:::

你可以通过条件判断和自定义参数的结合，来控制 WorkflowRun 在不同情况下的执行。

```
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: deploy-run
  namespace: default
spec:
  context:
    env: test
  workflowRef: deploy-template

---
apiVersion: core.oam.dev/v1alpha1
kind: Workflow
metadata:
  name: deploy-template
  namespace: default
steps:
  - name: apply
    type: apply-deployment
    if: context.env == "dev"
    properties:
      image: nginx
  - name: apply-test
    type: apply-deployment
    if: context.env == "test"
    properties:
      image: crccheck/hello-world
```

上述 WorkflowRun 将引用 deploy-template Workflow 作为执行模板，如果 context 中的 env 参数为 dev，那么 apply 步骤将会被执行，否则 apply-test 步骤将会被执行。

### 内置上下文参数

WorkflowRun 中的内置上下文参数如下：

|         Context Variable         |                                                                                  Description                                                                                  |    Type    |
| :------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------: |
|          `context.name`          |                                                 WorkflowRun 的名称                                                  |   string   |
|       `context.namespace`        |          WorkflowRun 的命名空间          |   string   |
|       `context.stepName`        |          当前步骤的名称          |   string   |
|       `context.stepSessionID`        |          当前步骤的 ID          |   string   |
|       `context.spanID`        |          当前步骤此次执行的 Trace ID          |   string   |
