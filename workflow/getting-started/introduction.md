---
title: Introduction
description: "What KubeVela Workflow is, who it is for, and how the engine in an Application relates to the standalone vela-workflow controller."
---

KubeVela Workflow is the engine that runs a list of steps in order, waits for approval, branches on conditions and passes data from one step to the next. The same engine, from [kubevela/workflow](https://github.com/kubevela/workflow), runs in two places:

| Where | What runs it | Use it for |
| :--- | :--- | :--- |
| An Application's `spec.workflow` | vela-core, which embeds the engine | Delivering the Application's components: deploy to staging, approve, deploy to production. |
| A `WorkflowRun` | the `vela-workflow` controller, installed by the `vela-workflow` addon or its own chart | A one-off pipeline outside any Application: a release across several Applications, a migration, a scheduled check. See [Run a Workflow without an Application](../guides/workflowrun.md). |

Steps behave the same in both. The pages under **Guides** apply to either, and their examples use whichever shows the feature best.

A workflow is a list of steps. Each step has a type: one of the [built-in step types](../reference/built-in-steps.md) (`suspend`, `notification`, `request`, `step-group` and more), or a type your platform team has [written](../guides/authoring/step-definition.md). Each step type says whether it works in an Application, a WorkflowRun or both.

:::note
The `webhook` and `request` steps and the HTTP channels of the `notification` step (DingTalk, Lark, Slack) block cloud metadata and link-local destinations by default. See [Workflow Outbound HTTP Protection](../operate/http-protection.md).
:::

## Who it's for

| You are | Start with |
| :--- | :--- |
| Delivering an Application with KubeVela, and want approval gates, ordering or notifications | [Quick Start: in an Application](quick-start.md#in-an-application), then the [Guides](/workflow/next/guides) |
| Running a pipeline that isn't one Application: a release across several, a batch of Jobs, an HTTP check | [Install](install.md) the `vela-workflow` controller, then the [Quick Start](quick-start.md) |
| A platform engineer adding step types of your own | [Steps, Workflows and WorkflowRuns](../concepts/workflow-model.md), then [Workflow Step Definition](../guides/authoring/step-definition.md) |
| Building on the engine in Go, or contributing to it | [Contributor Onboarding](../developer-onboarding/overview.md) |

## How it relates to KubeVela

The engine lives in its own repository, [kubevela/workflow](https://github.com/kubevela/workflow), and KubeVela imports it. vela-core runs an Application's workflow with the engine version it was built with, so upgrading KubeVela upgrades the engine for Applications. The `vela-workflow` controller is a separate install with its own version, and runs WorkflowRuns whether KubeVela is there or not. Steps that work on an Application's components need vela-core; every other step type works in both.

This section is versioned by the engine. KubeVela 1.12 embeds 0.8, 1.11 embeds 0.7, and 1.10 and 1.9 embed 0.6: the full table, and the `vela-workflow` chart and addon versions that go with each, are in [Versions](../reference/versions.md).

## How a workflow runs

Steps run one after another by default (`StepByStep`). To run them in parallel, make a step wait for others with `dependsOn`, switch the mode to `DAG`, or group them: see [Order Steps: Groups, Dependencies and DAG Mode](../guides/steps/order-steps.md). A run and each of its steps go through phases (`executing`, `suspending`, `succeeded` and so on), described in [Phases and the WorkflowRun Lifecycle](../concepts/lifecycle.md). How the engine retries a step that waits or fails is in [Workflow Working Mechanism](../operate/working-mechanism.md).

An Application has phases of its own around the workflow's, and generates a workflow when you write none: both are in KubeVela's [Application Workflow overview](/docs/next/end-user/workflow/overview).

## What you can do with a workflow

| I want to... | Page |
| :--- | :--- |
| Wait for approval before carrying on | [Suspend and Resume](../guides/steps/suspend.md) |
| Run steps in parallel, in a set order, or in groups | [Order Steps](../guides/steps/order-steps.md) |
| Run a step only when an earlier one failed, or skip it | [If Conditions](../guides/steps/if-condition.md) |
| Pass a value from one step to the next | [Data Passing](../guides/steps/inputs-outputs.md) |
| Stop a step that hangs | [Timeout of Step](../guides/steps/timeout.md) |
| Repeat steps over a list | [Repeating Steps with forEach](../guides/steps/for-each.md) |
| Suspend, resume, terminate or restart a running workflow | [Workflow Operations](../guides/operations.md) |
| Run a pipeline without an Application | [Run a Workflow without an Application](../guides/workflowrun.md) |
| Find out why a step failed | [Debug Workflow](/docs/next/platform-engineers/debug/debug) |

## Next steps

- [Built-in step types](../reference/built-in-steps.md): every step type a WorkflowRun can use, and its parameters. The steps that need an Application, such as `deploy` and `apply-component`, are in KubeVela's [built-in step reference](/docs/next/end-user/workflow/built-in-workflow-defs).
- [Custom workflow steps](../guides/authoring/step-definition.md): for platform engineers adding step types of their own.
