---
title:  Workflow Operations
---

This section introduces how to use the `vela` CLI to operate workflow.

Every command except `list` takes the name of an Application, or of a standalone WorkflowRun, and `-n <namespace>` for its namespace (the current env's namespace if you leave it out). The CLI looks for an Application of that name first and then a WorkflowRun; pass `--type app` or `--type workflow` to say which. `restart` and `rollback` work on Applications only. `suspend`, `resume`, `restart`, `logs` and `debug` also take `--step <name>` to act on one step instead of the whole workflow.

## List Workflows

`vela workflow list` shows the workflow of every Application in the namespace, and every WorkflowRun, with its phase, start and end time, whether it is running or not. Add `-A` for all namespaces.

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
Nothing will happen if you suspend an application that has a completed workflow, which is in `running` status.
Please refer to [Suspend and Resume](/workflow/next/steps/suspend) for more examples.
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
Please refer to [Suspend and Resume](/workflow/next/steps/suspend) for more examples.
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
Once application workflow is terminated, KubeVela controller won't reconcile the application resources. It can also be used in some cases when you want to manually operate the underlying resources, please caution the configuration drift.
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

How the controller handles it:

- A timestamp or `"true"` is copied to `status.workflowRestartScheduledAt` and the annotation is removed, so it fires once.
- A duration stays on the Application. Each next restart is counted from the end of the last finished run, so `24h` means 24 hours after the previous run finished, not every 24 hours on the clock.
- A restart that comes due while a run is still executing or suspended waits for that run to finish, then runs. If the run started after the requested time, it already answered the request and no extra run happens.

## Roll Back Workflow

`vela workflow rollback` puts the Application back on an earlier revision.

```bash
vela workflow rollback my-app -n default
```

It refuses a workflow that is still running (`can not rollback a running workflow`); suspend or terminate it first, or wait for it to finish. Where it goes back to depends on whether the Application uses [publish versions](../version-control.md):

- **Without `app.oam.dev/publishVersion`**, it restores the spec of the Application's latest revision (`status.latestRevision`), which undoes spec changes made since that revision was created.
- **With `app.oam.dev/publishVersion`**, it finds the latest revision that succeeded and has a publish version, restores its spec, status and resources, and deletes the newer revisions that never succeeded.

## Check the logs of the workflow

You can use `vela workflow logs` to check the logs of the workflow.

:::tip
Note that only the steps with [op.#Log](../../platform-engineers/workflow/cue-actions.md#log) in its definition will output logs.
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
Please checkout the [Debug doc](../../platform-engineers/debug/debug.md#applications-with-workflow) for more examples.
:::