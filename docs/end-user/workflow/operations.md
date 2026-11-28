---
title:  Workflow Operations
---

The `vela workflow` commands operate an Application's workflow, and a WorkflowRun's, the same way: `list`, `suspend`, `resume`, `terminate`, `restart`, `logs` and `debug` are in [Workflow Operations](/workflow/next/guides/operations) in the Workflow docs. This page covers what only an Application has: restarts on a schedule, and rollback.

Each command takes the Application's name, and `-n <namespace>` for its namespace (the current env's namespace if you leave it out).

## Terminate Workflow

Once an Application's workflow is terminated with `vela workflow terminate my-app`, the KubeVela controller stops reconciling the Application's resources, so changes you make to them by hand are not reverted. You can't resume a terminated workflow, only restart it.

## Restart Workflow

`vela workflow restart my-app` runs the whole workflow again from the first step, whatever state it is in; add `--step <name>` to restart from that step, which must be one that failed (a step that succeeded or is still running is refused). See [Restart Workflow](/workflow/next/guides/operations#restart-workflow).

### Scheduled Restarts

An Application's workflow can schedule its own re-execution with the `restart-workflow` step. This enables periodic tasks, delayed execution, or time-based orchestration. See the [restart-workflow step documentation](./built-in-workflow-defs.md#restart-workflow) for examples.

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
