---
title: Workflow Working Mechanism
---

This page covers how the workflow engine runs steps, and how it retries a step that waits or fails. It works the same in vela-core, for an Application's workflow, and in the `vela-workflow` controller, for a WorkflowRun.

## Running Mode

A workflow runs in one of two modes: **StepByStep** or **DAG**. In StepByStep mode, steps run one after another, in the order they are listed. In DAG mode, every step starts at once, and a step that has `dependsOn` or `inputs` waits until the steps it depends on have finished. Steps default to StepByStep and the sub-steps of a `step-group` to DAG; set `mode` to change either. See [Dependency](../guides/steps/dependency.md) and [Sub Steps](../guides/steps/step-group.md).

## Suspend and Retry

The engine retries a step, or suspends the workflow, for different reasons:

1. If a step fails or waits for a condition, the engine runs it again after a backoff time, which grows with each retry.
2. If a step fails too many times, it stops being retried and fails with the reason `FailedAfterRetries`, and the workflow fails. With the `EnableSuspendOnFailure` feature gate on, the workflow suspends instead, and resumes when you run `vela workflow resume`.
3. If a step waits for manual approval, such as a `suspend` step, the workflow suspends at once.

### Backoff Time

The backoff time before a retry is `int(0.05 * 2^(n-1))` seconds, where `n` is the number of retries, and at least 1 second. The first ten are:

| Times | 2^(n-1) | 0.05*2^(n-1) | Requeue After(s) |
|-------|---------|--------------|------------------|
| 1     | 1       | 0.05         | 1                |
| 2     | 2       | 0.1          | 1                |
| 3     | 4       | 0.2          | 1                |
| 4     | 8       | 0.4          | 1                |
| 5     | 16      | 0.8          | 1                |
| 6     | 32      | 1.6          | 1                |
| 7     | 64      | 3.2          | 3                |
| 8     | 128     | 6.4          | 6                |
| 9     | 256     | 12.8         | 12               |
| 10    | 512     | 25.6         | 25               |
| ...   | ...     | ...          | ...              |

A waiting step backs off for at most 60 seconds, and a failed step for at most 300 seconds.

### Maximum Retry Times

A failed step is retried at most 10 times by default.

A step whose resources are not healthy yet is waiting, not failed, so it keeps waiting for them and never runs out of retries.

### Change the limits

Both controllers take the same flags, and both charts the same values:

| Flag | Chart value | Default |
| --- | --- | --- |
| `--max-workflow-wait-backoff-time` | `workflow.backoff.maxTime.waitState` | `60` (seconds) |
| `--max-workflow-failed-backoff-time` | `workflow.backoff.maxTime.failedState` | `300` (seconds) |
| `--max-workflow-step-error-retry-times` | `workflow.step.errorRetryTimes` | `10` |
| `--feature-gates=EnableSuspendOnFailure=true` | `workflow.enableSuspendOnFailure` | `false` |

For vela-core, the flags are listed with the rest of its [bootstrap parameters](/docs/platform-engineers/system-operation/bootstrap-parameters).

## Applications keep their resources in place

While an Application's workflow runs, or waits on a condition, vela-core also re-applies the resources it has already applied, so they don't drift. This is an Application feature, not part of the engine, and a WorkflowRun does not do it. See [Workflow Working Mechanism](/docs/platform-engineers/workflow/working-mechanism) in the KubeVela docs.
