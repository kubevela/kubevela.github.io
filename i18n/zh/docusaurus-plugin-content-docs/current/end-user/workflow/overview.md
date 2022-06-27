---
title: 工作流总览
---

## 总览

工作流作为一个应用部署计划的一部分，可以帮助你自定义应用部署计划中的步骤，粘合额外的交付流程，指定任意的交付环境。简而言之，工作流提供了定制化的控制逻辑，在原有 Kubernetes 模式交付资源（Apply）的基础上，提供了面向过程的灵活性。比如说，使用工作流实现条件判断、暂停、状态等待、数据流传递、多环境灰度、A/B 测试等复杂操作。

工作流由多个步骤组成，典型的工作流步骤包括步骤组（包含一系列子步骤）、人工审核、多集群发布、通知等。你可以在 [内置工作流步骤](./built-in-workflow-defs) 中查看 KubeVela 默认提供的所有内置工作流步骤。如果内置的工作流步骤无法满足你的需求，你也可以 [自定义工作流步骤](../../platform-engineers/workflow/workflow)。

实际上，如果你在应用部署计划中只使用了组件，并没有声明工作流时，KubeVela 会在运行这个应用时自动创建一个默认的工作流，用于部署应用中的组件。

在 [VelaUX](../../how-to/dashboard/workflow/overview) 中，你可以更加直观地感受工作流。如图：下面是一个控制应用先部署到测试环境，暂停在人工审核步骤，然后再部署到生产环境的工作流：

![continue-workflow](../../resources/continue-workflow.png)

## 执行顺序

在工作流中，所有的步骤将顺序执行，下一个步骤将在上一个步骤成功后执行。如果一个步骤的类型为步骤组，那么它可以包含一系列子步骤，在执行这个步骤组时，所有子步骤都会一起执行。

> 在 KubeVela 未来的版本（1.5+）中，你可以显示地指定步骤的执行方式来控制并发或者单步执行，如：
> ```yaml
> workflow:
>   mode:
>     steps: StepByStep
>     subSteps: DAG
> ```
> 执行方式有两种：StepByStep 顺序执行以及 DAG 并行执行。
> 
> steps 中可以指定步骤的执行方式，subSteps 指定步骤组中子步骤的执行方式。如果你不显示声明执行模式，默认 steps 以 StepByStep 顺序执行，subSteps 以 DAG 并行执行。

## 工作流与应用的状态对应

|  应用   |  工作流  |                 说明                  |
| :-------: | :----: | :-----------------------------------: |
|    runningWorkflow    | executing |      当工作流正在执行时，应用的状态为 runningWorkflow      |
|    workflowSuspending    | suspending |      当工作流暂停时，应用的状态为 workflowSuspending     |
|    workflowTerminated    | terminated |      当工作流中有步骤失败或者被终止时，应用的状态为 workflowTerminated     |
|    running    | succeeded |      当工作流中所有步骤都成功执行后，应用的状态为  running     |

## 核心功能

工作流拥有丰富的流程控制能力，包括：

- 查看 [暂停和继续工作流](./suspend)，了解如何在工作流中使用暂停步骤完成人工审核，自动继续等功能。
- 查看 [子步骤](./step-group)，了解如何在工作流中使用子步骤完成一组步骤的执行。
- 查看 [依赖关系](./dependency)，了解如何指定工作流步骤间的依赖关系。
- 查看 [数据传递](./inputs-outputs)，了解如何通过 `inputs`、`outputs` 来进行步骤间的数据传递。
- 查看 [使用条件判断](./if-condition)，了解如何使用条件判断来控制工作流步骤的执行。
- 查看 [步骤的超时](./timeout)，了解如何指定工作流步骤的超时时间。
