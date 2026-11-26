---
title: Workflow Working Mechanism
---

An Application's workflow runs on the KubeVela Workflow engine, which vela-core embeds. How the engine runs steps, in StepByStep or DAG mode, and how it backs off and retries a step that waits or fails, is in [Workflow Working Mechanism](/workflow/next/operate/working-mechanism) in the Workflow docs. vela-core takes the same flags as the standalone controller, `--max-workflow-wait-backoff-time`, `--max-workflow-failed-backoff-time` and `--max-workflow-step-error-retry-times`, listed with its other [bootstrap parameters](../system-operation/bootstrap-parameters.md).

This page covers what vela-core adds for an Application.

## Avoid Configuration Drift

When workflow enters running state or suspends due to condition wait, KubeVela application will re-apply applied resources to prevent configuration drift routinely. This process is called **State Keep** in KubeVela. By default, the interval of State Keep is 5 minutes, which can be configured in the [bootstrap parameter](../system-operation/bootstrap-parameters.md) of KubeVela controller by setting `--application-re-sync-period`. If you want to disable the state keep capability, you can also use the [apply-once](https://github.com/kubevela/kubevela/blob/master/docs/examples/app-with-policy/apply-once-policy/apply-once.md) policy in the application.
