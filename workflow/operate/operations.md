---
title:  Workflow Operations
---

This page shows how to operate a running workflow with the `vela workflow` commands. They work on an Application's workflow and on a WorkflowRun alike, apart from `rollback`, which only an Application has.

Every command except `list` takes the name of the Application or WorkflowRun, and `-n <namespace>` for its namespace (the current env's namespace if you leave it out). It looks for an Application with that name first, then a WorkflowRun; pass `--type workflow` to go straight to the WorkflowRun, or `--type app` for the Application. `suspend`, `resume`, `restart`, `logs` and `debug` also take `--step <name>` to act on one step instead of the whole workflow.

## List Workflows

`vela workflow list` shows the workflow of every Application and every WorkflowRun in the namespace, with its phase, start and end time, whether it is running or not. Add `-A` for all namespaces.

```bash
vela workflow list -n default
```

## Suspend Workflow

If you have an executing workflow, you can use the `suspend` command to suspend the workflow.

```bash
vela workflow suspend my-app -n default
```

```console
Successfully suspend workflow: my-app
```

:::tip
Nothing happens if you suspend a workflow that has already finished.
Please refer to [Suspend and Resume](../steps/suspend.md) for more examples.
:::

## Resume Workflow 

Once the workflow is suspended, you can use the `vela workflow resume` command to manually resume the workflow.

```bash
vela workflow resume my-app -n default
```

```console
Successfully resume workflow: my-app
```

:::tip
Please refer to [Suspend and Resume](../steps/suspend.md) for more examples.
:::

## Terminate Workflow

You can use `vela workflow terminate` to terminate an executing workflow.

```bash
vela workflow terminate my-app -n default
```

:::tip
Different from suspend, the terminated workflow can't be resumed, you can only restart the workflow. This means restart the workflow will execute the workflow steps from scratch while resume workflow only continue the unfinished steps.
:::

:::caution
Once an Application's workflow is terminated, the KubeVela controller stops reconciling the Application's resources, so changes you make to them by hand are not reverted. Watch out for configuration drift.
:::

## Restart Workflow

`vela workflow restart` runs the whole workflow again from the first step, whatever state it is in; add `--step <name>` to restart from that step, which must be one that failed (a step that succeeded or is still running is refused). Steps that read the restarted step's outputs run again with it.

```bash
vela workflow restart my-app -n default
```

```console
Successfully restart workflow: my-app
```

```bash
vela workflow restart my-app -n default --step deploy-prod
```

```console
Successfully restart workflow my-app from step deploy-prod
```

### Scheduled Restarts

Scheduled restarts are for Applications: the [`restart-workflow`](/docs/next/end-user/workflow/built-in-workflow-defs#restart-workflow) step and the `app.oam.dev/restart-workflow` annotation restart an Application's workflow at a time or on an interval. See [Scheduled Restarts](/docs/next/end-user/workflow/operations#scheduled-restarts) in the KubeVela docs. A WorkflowRun has neither: restart it with `vela workflow restart`.

## Roll Back Workflow

`vela workflow rollback` puts an Application back on an earlier revision. A WorkflowRun has no revisions, so it refuses one (`can not rollback a WorkflowRun`). See [Roll Back Workflow](/docs/next/end-user/workflow/operations#roll-back-workflow) in the KubeVela docs.

## Check the logs of the workflow

You can use `vela workflow logs` to check the logs of the workflow.

:::tip
Note that only the steps with [op.#Log](../authoring/cue-actions.md#log) in its definition will output logs.
:::

```bash
vela workflow logs my-app -n default
```

## Debug Workflow

You can use `vela workflow debug` to debug the workflow.


```bash
vela workflow debug my-app -n default
```

:::tip
Please checkout the [Debug doc](/docs/next/platform-engineers/debug/debug#applications-with-workflow) for more examples.
:::