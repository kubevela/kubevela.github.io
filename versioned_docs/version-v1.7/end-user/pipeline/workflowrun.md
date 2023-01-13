---
title: K8S API for Pipeline
---

Compared with the Application Workflow, the standalone pipeline has the following characteristics:

1. It can manage multiple KubeVela Applications across multiple environments.
2. It is **not bound** to Applications and can be used **independently**. For example, it can expand or shrink a set of resources, perform process-oriented canary publishing for an Application, and perform a set of operation and maintenance operations in batches.
3. It is **one-time** and does not manage resources. Even if the pipeline is deleted, the created resources will not be deleted.
4. It uses the same execution engine as the Application Workflow, which completely inherits the features of KubeVela's lightweight workflow. Compared with the traditional container-based CI pipeline, KubeVela's pipeline does not depend on containers, No additional computing resources are required.

:::tip
In order to better reuse the existing capabilities and ensure technical consistency, we split the workflow engine part of the original application workflow. Both in-application workflow and pipeline use this [workflow engine](https://github.com/kubevela/workflow) as the underlying technology implementation. The application workflow is represented by the `Workflow` field in the application, and the pipeline is represented by the [WorkflowRun](https://github.com/kubevela/workflow) resource.

This means that most of the workflow steps are common between the two, such as: suspend, notification, send HTTP request, read configuration, etc.

However, in WorkflowRun, there is only the configuration of steps, and **no configuration of components, traits, and policies**. Therefore, steps related to components/traits/policy can only be used in in-app workflows, such as: deploying/updating components, traits, etc.
:::

## WorkflowRun

WorkflowRun is the K8S API for pipeline. You can choose to execute an external Workflow template in the WorkflowRun or execute the steps in the WorkflowRun spec (if you declare both, the step in the WorkflowRun spec will override the content in the template). A WorkflowRun consists of the following:

```
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: <name>
  namespace: <namespace>
spec:
  mode: <optional execute mode for the workflowRun, default execute mode is StepByStep for steps, DAG for subSteps>
    steps: <DAG or StepByStep>
    subSteps: <DAG or StepByStep>
  context:
    <optional custom contest values>
  workflowRef: <optional external workflow template to run>
  workflowSpec: <optional workflow spec to run>
    steps:
    - name: <name>
      type: <type>
      dependsOn:
        <optional array of step names, specify the dependency for the step>
      meta: <optional meta data for the step>
        alias: <optional alias of the step>  
      properties:
        <parameter values>
      if: <optional if condition to decide whether this step should be executed>
      timeout: <optional timeout for the step>
      outputs: <optional outputs value>
        - name: <name>
          valueFrom: <value source of the output>
      inputs: <optional inputs value>
        - name: <name>
          parameterKey: <optional set the inputs data to the steps'parameter>
      subSteps:
        <optional sub steps if the type of this step is step-group>
```

## Status

### WorkflowRun Status

WorkflowRun has the following status:

|  WorkflowRun State  |                 Description                  |
| :-------:  |  :-----------------------------------: |
| executing  |   When a step in a WorkflowRun is executing, its status is executing                        |
| suspending |  When a step in a WorkflowRun is suspended, its status is suspending                                |
| terminated |  When a WorkflowRun is terminated, its status is terminated                               |
| failed     |      When the WorkflowRun is executed completely and a step fails, its status is failed                   |
| succeeded  |   When the WorkflowRun is executed completely and the status of all steps is successful or skipped, its status is succeeded  |

### WorkflowRun Step Status

WorkflowRun steps have the following status:

|  Step Status   |                 Description                 |
| :-------:  |  :-----------------------------------: |
| running    |   This step is being executed                       |
| succeeded  |   The step is executed successfully                              |
| failed     |   The step failed                              |
| skipped    |   The step is skipped and not executed                   |
| pending    |   The step is wait for certain conditions to execute, such as: waiting for the inputs  |

#### The Failed Reason of WorkflowRun Step

For steps that fail to execute, the `message` of the step status will display the failed message, and the `reason` will display the failed reason, which is divided into the following types:

|  Step Failed Reason  |                 Description                  |
| :-------:  |  :-----------------------------------: |
| Execute    |   The step fails in execution                       |
| Terminate  |   The step is terminated                               |
| Output     |   The step has an error when outputting the Output                              |
| FailedAfterRetries    |   The Step fails in execution and the retry limit is reached                   |
| Timeout   |   The step is timeout  |
| Action    |   [op.#Fail](../../platform-engineers/workflow/cue-actions#fail) is used in the step's definition  |

## Execution Mode

You can define execution mode in WorkflowRun or Workflow templates:

```
mode:
  steps: <DAG or StepByStep>
  subSteps: <DAG or StepByStep>
```

If not explicitly specified, the WorkflowRun will execute the steps sequentially (StepByStep) and execute sub-steps in parallel (DAG) by default.

:::caution
If you specify the execution mode in both WorkflowRun and Workflow, the mode in WorkflowRun will override the mode in the Workflow template.
:::

## Built-in Steps

You can use KubeVela [built-in steps](../workflow/built-in-workflow-defs) that without label: `custom.definition.oam.dev/scope: Application` in WorkflowRun.

## Custom Steps

You can refer to the [custom steps documentation](../../platform-engineers/workflow/workflow) to customize your steps.

:::caution
You cannot use [application operations](../../platform-engineers/workflow/cue-actions#application-operations).
:::

## Core Features

### Operate WorkflowRun

:::tip
The vela workflow command can operate both Application Workflow and WorkflowRun.
By default, it will look for the application with the same name first, and if it is not found, it will look for WorkflowRun.
You can also use `--type=workflow` to indicate that the operation object is WorkflowRun.
:::

#### Suspend

If you have an executing WorkflowRun, you can use `vela workflow suspend` to suspend the workflow.

```bash
vela workflow suspend <name>
```

:::tip
If the workflow has executed completely, using the `vela workflow suspend` command has no effect.
:::

#### Resume

When the WorkflowRun is suspended, you can use `vela workflow resume` command to manually resume the workflow.

```bash
vela workflow resume <name>
```

#### Terminate

If you have an executing WorkflowRun, you can use `vela workflow terminate` to terminate the workflow.

```bash
vela workflow terminate <name>
```

#### Check the Logs

If you want to view the WorkflowRun logs, you can use `vela workflow logs` command to view the logs.

:::tip
Only steps configured with [op.#Log](../../platform-engineers/workflow/cue-actions#log) in its definition will have log output.
:::

```bash
vela workflow logs <name>
```

### Suspend and Resume

#### Suspend Manually

Please refer to [Operate WorkflowRun](#suspend).

#### Suspend Automatically（using suspend step）

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

The WorkflowRun will automatically suspend when the first step is completed, and the third step will not be executed until you continue the WorkflowRun.

#### Resume Manually

Please refer to [Operate WorkflowRun](#resume).

#### Resume Automatically

Configure `duration: <duration>` in the `suspend` type of step, when the `duration` time expires, WorkflowRun will automatically continue to execute.

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

When the first step is completed, the WorkflowRun will suspend, and after ten seconds, the WorkflowRun will automatically continue to execute the third step.

### Sub Steps

There is a special step type called `step-group`. When using a `step-group` type of step, you can declare sub steps in it.

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

### Dependency

You can specify dependencies between steps with `dependsOn`.

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

step1 will be executed after step2 and step3 are completed.

### Data Passing

Data passing between steps can be done through `inputs` and `outputs`. For details, please refer to [Input and output between steps](../workflow/inputs-outputs#outputs).

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

In this WorkflowRun, the first step will request the GitHub API to get the number of stars in the workflow repository as Output, and then use this Output as Input in the next step to send the star number as the message to Slack.

### Timeout

You can specify `timeout` for a step to indicate the timeout for that step.

`timeout` follows the `duration` format, e.g. `30s`, `1m`, etc. You can refer to Golang's [parseDuration](https://pkg.go.dev/time#ParseDuration).

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

If the above WorkflowRun is not resumed within three seconds, the suspend step will fail with timeout.

### If Conditions

You can use `if` in a step to determine whether to execute the step.

#### No If specified

If the step does not specify `if`, if the step before the step fails to execute, then the step will be skipped and will not be executed.

#### if: always

With `if: always` specified in a step, the step will be executed no matter what.

#### Custom If

You can also write your own judgment logic to determine whether the step should be executed. Note: The value in `if` will be executed as CUE code. WorkflowRun provides some built-in variables in `if`, these are:

* `status`：`status` contains status information for all workflow steps. You can use `status.<step-name>.phase == "succeeded"` to determine the status of a step, or you can use the simplified `status.<step-name>.succeeded` to determine.
* `inputs`：`inputs` contains all the inputs parameters of the step. You can use `inputs.<input-name> == "value"` to get input for the step.
* `context`: `context` contains all the context data of WorkflowRun. You can use `context.<context-name> == "value"` to get the context of the WorkflowRun.

:::tip
Note that if your step name or inputs name is not a valid CUE variable name (eg: contains `-`, or starts with a number, etc.), you can refer to it as follows: `status["invalid-name"].failed`.
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

In the above WorkflowRun, if the suspend step fails due to a timeout, then the my-step step will be executed, otherwise the my-step2 step will be executed.

### Custom Context Data

Steps in WorkflowRun have some built-in context data, and you can also declare your custom context parameters in `context`.

:::tip
If your custom context data has the same name as a built-in context data, the built-in context parameter will be overridden by the custom parameter.
:::

You can control the execution of WorkflowRun in different situations through the combination of conditional if and custom data.

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

The above WorkflowRun will refer to the `deploy-template` Workflow as the execution template. If the `env` in the context is `dev`, then the apply step will be executed, otherwise the apply-test step will be executed.

### Built-in Context Data

The built-in context data in WorkflowRun are as follows:

|         Context Variable         |                                                                                  Description                                                                                  |    Type    |
| :------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------: |
|          `context.name`          |            The name of the WorkflowRun                                                 |   string   |
|       `context.namespace`        |          The namespace of the WorkflowRun          |   string   |
|       `context.stepName`        |          The name of the current step          |   string   |
|       `context.stepSessionID`        |          The ID of the current step          |   string   |
|       `context.spanID`        |         The trace ID of current step in this reconcile         |   string   |
