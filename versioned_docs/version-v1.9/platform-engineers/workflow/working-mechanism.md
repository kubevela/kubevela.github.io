---
title: Workflow Working Mechanism
---

This document will give a brief introduction to the core mechanisms of KubeVela Workflow.

## Running Mode

The execution of workflow has two different running modes: **DAG** mode and **StepByStep** mode. In DAG mode, all steps in the workflow will execute concurrently. They will form a dependency graph for running according to the Input/Output in the step configuration automatically. If one workflow step has not met all its dependencies, it will wait for the conditions. In StepByStep mode, all steps will be executed in order. In KubeVela v1.2+, the defaut running mode is StepByStep. Using DAG mode is not supported in version before KubeVela v1.5.

## Suspend and Retry

Workflow will retry steps and suspend for different reasons.
1. If step fails or waits for conditions, the workflow will retry after a backoff time. The backoff time will increase by the retry times.
2. If step fails too many times, the workflow will enter suspending state and stop retry.
3. If step is waiting for manual approval, the workflow will enter suspending state immediately. 

### Backoff Time

The backoff time for workflow to retry can be calculated by `int(0.05 * 2^(n-1))` where `n` is the number of retries. The minimal backoff time is 1 second，the first ten backoff time will be like:

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

If the workflow step is waiting, the max backoff time is 60s, you can change it by setting `--max-workflow-wait-backoff-time` in the [bootstrap parameter](../system-operation/bootstrap-parameters) of KubeVela controller.

If the workflow step is failed, the max backoff time is 300s, you can change it by setting`--max-workflow-failed-backoff-time` in the [bootstrap parameter](../system-operation/bootstrap-parameters) of KubeVela controller.

### Maximum Retry Times

For failure case, the workflow will retry at most 10 times by default and enter suspending state after that. You can change the retry times by setting `--max-workflow-step-error-retry-times` in the [bootstrap parameter](../system-operation/bootstrap-parameters) of KubeVela controller.

> Note that if the workflow step is unhealthy, the workflow step will be marked as wait but not failed and it will wait for healthy.

## Avoid Configuration Drift

When workflow enters running state or suspends due to condition wait, KubeVela application will re-apply applied resources to prevent configuration drift routinely. This process is called **State Keep** in KubeVela. By default, the interval of State Keep is 5 minutes, which can be configured in the [bootstrap parameter](../system-operation/bootstrap-parameters) of KubeVela controller by setting `--application-re-sync-period`. If you want to disable the state keep capability, you can also use the [apply-once](https://github.com/kubevela/kubevela/blob/master/docs/examples/app-with-policy/apply-once-policy/apply-once.md) policy in the application.
