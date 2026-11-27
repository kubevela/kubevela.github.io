---
title: Context
description: "The values every step and if condition can read: the run's name and namespace, the current step, and custom values set on the WorkflowRun."
---

Every step's template and every `if` condition can read `context`: a small set of values about the run, plus any you add. It is how one Workflow serves several environments, and how a custom step names what it creates after the run that created it.

## Built-in values

| Variable | Description | Type |
| :---: | :---: | :---: |
| `context.name` | The name of the WorkflowRun | string |
| `context.namespace` | The namespace of the WorkflowRun | string |
| `context.stepName` | The name of the current step | string |
| `context.stepSessionID` | The ID of the current step | string |
| `context.spanID` | The trace ID of the current step in this reconcile | string |

In an Application's workflow, `context.name` and `context.namespace` are the Application's, and KubeVela adds values of its own, such as the Application's revision: every field is in KubeVela's [Context Reference](/docs/next/platform-engineers/context-reference).

## Custom values

Values you set in a WorkflowRun's `spec.context` are added to it. A value with the same name as a built-in one replaces it.

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: deploy-run
  namespace: default
spec:
  context:
    env: test
  workflowRef: deploy-template
```

Steps in `deploy-template` can then branch on `context.env`, or pass it to a step's properties. [Run a Workflow Template per Environment](../examples/workflow-template.md) is the full example.

## Context and data passing

The context is fixed for the run: steps read it, they can't change it. To hand a value from one step to the next, use [`outputs` and `inputs`](../guides/steps/inputs-outputs.md).
