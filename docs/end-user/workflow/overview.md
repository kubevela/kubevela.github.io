---
title: Overview
---

Without a workflow, KubeVela applies every component at once, apart from the order that dependencies set: `dependsOn`, `inputs` and `$(component.<name>)` reads each hold a component back until what it waits on is ready. A workflow lets you choose the order, wait for approval, branch on conditions and pass data from one step to the next.

A workflow is a list of steps. Each step has a type: one of the [built-in step types](./built-in-workflow-defs.md) (`deploy`, `suspend`, `notification`, `step-group` and more), or a type your platform team has added.

:::note
The `webhook` step and the HTTP channels of the `notification` step (DingTalk, Lark, Slack) block cloud metadata and link-local destinations by default. See [Workflow Outbound HTTP Protection](../../platform-engineers/system-operation/workflow-http-protection.md).
:::

## A first workflow

This Application deploys `backend`, waits for you to approve, then deploys `frontend`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-workflow
  namespace: default
spec:
  components:
    - name: backend
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
    - name: frontend
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
  workflow:
    steps:
      - name: deploy-backend
        type: apply-component
        properties:
          component: backend
      - name: approve
        type: suspend
      - name: deploy-frontend
        type: apply-component
        properties:
          component: frontend
```

Save it as `first-workflow.yaml`, apply it and check the status:

```bash
vela up -f first-workflow.yaml
vela status first-workflow
```

Once `backend` is up, the workflow stops at the `suspend` step and the Application waits in `workflowSuspending`:

```
About:

  Name:      	first-workflow
  Namespace: 	default
  Created at:	2026-11-24 17:19:14 +0000 GMT
  Healthy:   	✅
  Details:   	workflowSuspending

Workflow:

  mode: StepByStep-DAG
  finished: false
  Suspend: true
  Terminated: false
  Steps
  - id: rmz1k9gf84
    name: deploy-backend
    type: apply-component
    phase: succeeded
  - id: dyx9aqevcs
    name: approve
    type: suspend
    phase: suspending
    message: Suspended by field suspend
```

Approve it, and the workflow carries on with `deploy-frontend`:

```bash
vela workflow resume first-workflow
```

When every step has succeeded, `vela status` shows the Application as `running`.

## The default workflow

If you declare no workflow, KubeVela generates one when it runs the Application:

- With `topology` policies, it adds one `deploy` step per topology policy, named `deploy-<policy name>`, which also applies any `override` policies.
- With `override` policies or a `ref-objects` component but no `topology` policy, it adds a single `deploy` step.
- Otherwise, it adds one `apply-component` step per component, named after the component. A component's `dependsOn` carries over to its step.

`vela status` lists the generated steps in its `Workflow` section, the same as steps you write yourself.

## Execution order

Steps run one after another by default. To run them in parallel, make a step wait for others with `dependsOn`, or group them: see [Order Steps: Groups, Dependencies and DAG Mode](./step-group.md).

## State of Application and Workflow

An Application's phase is in `status.status`, and its workflow's phase in `status.workflow.status`. From the moment the workflow starts, the two move together:

| Application | Workflow | Description |
| :--- | :--- | :--- |
| `starting` | | KubeVela has picked up the Application and is preparing to reconcile it. |
| `rendering` | | KubeVela is rendering the components and traits. |
| `generatingPolicy` | | KubeVela is generating the Application's policies. |
| `runningWorkflow` | `executing` | The workflow is running. |
| `workflowSuspending` | `suspending` | The workflow is suspended, by a `suspend` step or by `vela workflow suspend`. |
| `workflowTerminated` | `terminated` | The workflow was terminated. |
| `workflowFailed` | `failed` | A step failed and the workflow has finished. |
| `running` | `succeeded` | Every step succeeded and every component is healthy. |
| `unhealthy` | `succeeded` | Every step succeeded, but at least one component is not healthy. |
| `deleting` | | The Application is being deleted. |

VelaUX shows each step's state; here the first step succeeded and the second failed:

![velaux-workflow](../../resources/velaux-workflow.png)

## What you can do with a workflow

| I want to... | Page |
| :--- | :--- |
| Wait for approval before carrying on | [Suspend and Resume](./suspend.md) |
| Run steps in parallel, in a set order, or in groups | [Order Steps](./step-group.md) |
| Run a step only when an earlier one failed, or skip it | [If Conditions](./if-condition.md) |
| Pass a value from one step to the next | [Data Passing](./inputs-outputs.md) |
| Stop a step that hangs | [Timeout of Step](./timeout.md) |
| Suspend, resume, terminate or restart a running workflow | [Workflow Operations](./operations.md) |
| Find out why a step failed | [Debug Workflow](../../platform-engineers/debug/debug.md) |

## Next steps

- [Built-in step types](./built-in-workflow-defs.md): every step type that ships with KubeVela and its parameters.
- [Custom workflow steps](../../platform-engineers/workflow/workflow.md): for platform engineers adding step types of their own.
