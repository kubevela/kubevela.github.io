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
Please refer to [Suspend and Resume](./suspend.md) for more examples.
:::

## Resume Workflow 

Once the workflow is suspended, you can use the `vela workflow resume` command to manually resume the workflow.

```bash
vela workflow resume <name>
```

:::tip
Please refer to [Suspend and Resume](./suspend.md) for more examples.
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

### Scheduled Restarts

For automated restarts, workflows can schedule their own re-execution using the `restart-workflow` step. This enables periodic tasks, delayed execution, or time-based orchestration. See the [restart-workflow step documentation](./built-in-workflow-defs.md#restart-workflow) for examples.

You can also schedule restarts by adding the `app.oam.dev/restart-workflow` annotation to an Application:

```bash
# One-time restart at specific time (RFC3339 format)
kubectl annotate application my-app app.oam.dev/restart-workflow="2025-01-20T15:00:00Z"

# Recurring restart every 24 hours
kubectl annotate application my-app app.oam.dev/restart-workflow="24h"

# Immediate restart
kubectl annotate application my-app app.oam.dev/restart-workflow="true"
```

The annotation accepts three formats:
- **RFC3339 timestamp**: One-time restart at the specified time
- **Duration** (e.g., "5m", "1h", "24h"): Recurring restarts at the specified interval
- **"true"**: Immediate restart

## Check the logs of the workflow

You can use `vela workflow logs` to check the logs of the workflow.

:::tip
Note that only the steps with [op.#Log](../../platform-engineers/workflow/cue-actions.md#log) in its definition will output logs.
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
Please checkout the [Debug doc](../../platform-engineers/debug/debug.md#applications-with-workflow) for more examples.
:::