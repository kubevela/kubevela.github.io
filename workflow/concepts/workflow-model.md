---
title: Steps, Workflows and WorkflowRuns
description: "The workflow model: a list of typed steps, the objects that hold one (an Application, a WorkflowRun, a Workflow template), step types as CUE definitions, and the two execution modes."
---

A workflow is a list of steps. Each step has a **type**, and the type decides what the step does: apply an object, wait for approval, call an HTTP endpoint, send a notification. The engine runs the steps in order, keeps the state of each one, and passes data between them. It doesn't start a pod or a job for a step: a step is a CUE template that the controller evaluates itself, so a workflow that only applies objects and waits costs no compute beyond the controller.

## Where a workflow lives

The same list of steps can sit in three objects:

| Object | Holds | Run by | Runs |
| :--- | :--- | :--- | :--- |
| `Application` (`spec.workflow`) | the steps that deliver the Application's components | vela-core | again on every change to the Application, which also keeps what it applied in place |
| `WorkflowRun` (`spec.workflowSpec`) | a one-off list of steps | the `vela-workflow` controller | once. Deleting it deletes nothing its steps created |
| `Workflow` | steps with no run of their own: a template | nothing on its own | when a WorkflowRun names it in `workflowRef`, or an Application in `spec.workflow.ref` |

This section is about the steps, which behave the same in all three. The Application parts, such as the phases around the workflow and the workflow KubeVela writes when you leave it out, are in KubeVela's [Application Workflow overview](/docs/next/end-user/workflow/overview).

## A step

```yaml
- name: deploy-prod          # unique in the workflow
  type: apply-deployment     # a WorkflowStepDefinition
  properties:                # the type's parameters
    image: nginx
  dependsOn: [approve]       # wait for other steps (DAG mode)
  if: status.approve.succeeded
  timeout: 10m
  inputs:                    # take values from earlier steps
    - from: image-tag
      parameterKey: image
  outputs:                   # give values to later steps
    - name: deployed
      valueFrom: output.value.metadata.name
```

Everything but `name` and `type` is optional. The guides cover each field: [`dependsOn`](../guides/steps/order-steps.md), [`if`](../guides/steps/if-condition.md), [`timeout`](../guides/steps/timeout.md), [`inputs` and `outputs`](../guides/steps/inputs-outputs.md) and [`forEach`](../guides/steps/for-each.md).

A step of type `step-group` holds `subSteps` instead of `properties`: a group runs its sub-steps, and finishes when they have.

## Step types

A step type is a `WorkflowStepDefinition`: a CUE template with a `parameter` block for the step's properties and the actions the step takes, such as `kube.#Apply` or `http.#Do`. The engine checks each step's properties against the template's parameters before the step runs, so a misspelt field fails the step rather than being ignored.

| Where the types come from | What you get |
| :--- | :--- |
| The `vela-workflow` chart or addon | The [built-in step types](../reference/built-in-steps.md) a WorkflowRun can use: `apply-deployment`, `apply-job`, `apply-object`, `read-object`, `request`, `notification`, `suspend`, `step-group` and the rest. |
| vela-core | The same, plus the types that work on an Application's components, such as `deploy` and `apply-component`. |
| Your platform team | Types of their own, written in CUE: see [Custom Workflow Step](../guides/authoring/step-definition.md). |

The built-in types are installed in `vela-system`. Each type's reference entry says whether it works in an Application, a WorkflowRun or both.

## Execution modes

| Mode | How steps run | Default for |
| :--- | :--- | :--- |
| `StepByStep` | Each step starts when the one before it has finished. | `steps` |
| `DAG` | Steps start together; `dependsOn` and `inputs` decide the order. | the `subSteps` of a `step-group` |

Set either with `mode` on the WorkflowRun or Workflow (`workflow.mode` in an Application):

```yaml
spec:
  mode:
    steps: DAG
    subSteps: StepByStep
```

A step with no `if` runs only when the steps before it succeeded, so a failure skips what comes after it. An `if` changes that for its own step: see [If Conditions](../guides/steps/if-condition.md).

## What a step can read

A step's template and its `if` condition read three things:

- **Its properties**, after `inputs` have been filled in.
- **The context**: the name and namespace of the run, the current step, and any values you set. See [Context](context.md).
- **The status of earlier steps**, in `if` conditions: `status.<step>.succeeded`, `status.<step>.failed`, `status.<step>.timeout` and `status.<step>.message`.

## Next

- [Phases and the WorkflowRun lifecycle](lifecycle.md): the phases a run and its steps go through, and what makes a step retry.
- [Quick Start](../getting-started/quick-start.md): run a workflow end to end.
