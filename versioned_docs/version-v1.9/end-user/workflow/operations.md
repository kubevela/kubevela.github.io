---
title:  Workflow Operations
---

This section introduces how to use the `vela` CLI to operate workflow.

## Suspend Workflow

If you have an executing workflow, you can use the `suspend` command to suspend the workflow.

```bash
vela workflow suspend <name>
```

:::tip
Nothing will happen if you suspend an application that has a completed workflow, which is in `running` status.
Please refer to [Suspend and Resume](./suspend) for more examples.
:::

## Resume Workflow 

Once the workflow is suspended, you can use the `vela workflow resume` command to manually resume the workflow.

```bash
vela workflow resume <name>
```

:::tip
Please refer to [Suspend and Resume](./suspend) for more examples.
:::

## Terminate Workflow

You can use `vela workflow terminate` to terminate an executing workflow.

```bash
vela workflow terminate <name>
```

:::tip
Different from suspend, the terminated workflow can't be resumed, you can only restart the workflow. This means restart the workflow will execute the workflow steps from scratch while resume workflow only continue the unfinished steps.
:::

:::caution
Once application workflow is terminated, KubeVela controller won't reconcile the application resources. It can also be used in some cases when you want to manually operate the underlying resources, please caution the configuration drift.
:::

## Restart Workflow

You can use `vela workflow restart` to restart an executing workflow.

```bash
vela workflow restart my-app
```

## Check the logs of the workflow

You can use `vela workflow logs` to check the logs of the workflow.

:::tip
Note that only the steps with [op.#Log](../../platform-engineers/workflow/cue-actions#log) in its definition will output logs.
:::

```bash
vela workflow logs <name>
```

## Debug Workflow

You can use `vela workflow debug` to debug the workflow.


```bash
vela workflow debug <name>
```

:::tip
Please checkout the [Debug doc](../../platform-engineers/debug/debug#applications-with-workflow) for more examples.
:::