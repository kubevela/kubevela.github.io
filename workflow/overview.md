---
title: Overview
---

KubeVela Workflow is the engine that runs a list of steps in order, waits for approval, branches on conditions and passes data from one step to the next. The same engine, from [kubevela/workflow](https://github.com/kubevela/workflow), runs in two places:

| Where | What runs it | Use it for |
| :--- | :--- | :--- |
| An Application's `spec.workflow` | vela-core, which embeds the engine | Delivering the Application's components: deploy to staging, approve, deploy to production. |
| A `WorkflowRun` | the `vela-workflow` controller, installed by the `vela-workflow` addon or its own chart | A one-off pipeline outside any Application: a release across several Applications, a migration, a scheduled check. See [Run a Workflow without an Application](workflowrun.md). |

Steps behave the same in both. The pages under **Steps** apply to either, and their examples use whichever shows the feature best.

A workflow is a list of steps. Each step has a type: one of the [built-in step types](reference/built-in-steps.md) (`suspend`, `notification`, `request`, `step-group` and more), or a type your platform team has [written](authoring/step-definition.md). Each step type says whether it works in an Application, a WorkflowRun or both.

:::note
The `webhook` and `request` steps and the HTTP channels of the `notification` step (DingTalk, Lark, Slack) block cloud metadata and link-local destinations by default. See [Workflow Outbound HTTP Protection](operate/http-protection.md).
:::

## Versions

This section is versioned by the workflow engine, not by KubeVela. Each KubeVela release embeds one engine version:

| KubeVela | Workflow |
| :--- | :--- |
| 1.12 | [0.8](/workflow/next/overview) |
| 1.11 | [0.7](/workflow/overview) |
| 1.10, 1.9 | [0.6](/workflow/0.6/overview) |

The `vela-workflow` addon and chart carry their own version, which can lag the engine inside vela-core: check which one runs your WorkflowRuns before you rely on a newer feature.

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

When every step has succeeded, `vela status` shows the Application as `running`. The same three steps in a WorkflowRun, with `apply-app` instead of `apply-component`, are in [Run a Workflow without an Application](workflowrun.md#example-a-release-pipeline).

## Execution order

Steps run one after another by default (`StepByStep`). To run them in parallel, make a step wait for others with `dependsOn`, switch the mode to `DAG`, or group them: see [Order Steps: Groups, Dependencies and DAG Mode](steps/order-steps.md). How the engine retries a step that waits or fails is in [Workflow Working Mechanism](operate/working-mechanism.md).

## Phases

A workflow's phase is `executing`, `suspending`, `terminated`, `failed` or `succeeded`, and each step has a phase of its own. A WorkflowRun shows them in `status.status` and `status.steps`: the tables are in [WorkflowRun phases](workflowrun.md#workflowrun-phases). An Application has phases of its own around the workflow's, and generates a workflow when you write none: both are in KubeVela's [Application Workflow overview](/docs/next/end-user/workflow/overview).

## What you can do with a workflow

| I want to... | Page |
| :--- | :--- |
| Wait for approval before carrying on | [Suspend and Resume](steps/suspend.md) |
| Run steps in parallel, in a set order, or in groups | [Order Steps](steps/order-steps.md) |
| Run a step only when an earlier one failed, or skip it | [If Conditions](steps/if-condition.md) |
| Pass a value from one step to the next | [Data Passing](steps/inputs-outputs.md) |
| Stop a step that hangs | [Timeout of Step](steps/timeout.md) |
| Repeat steps over a list | [Repeating Steps with forEach](steps/for-each.md) |
| Suspend, resume, terminate or restart a running workflow | [Workflow Operations](operate/operations.md) |
| Run a pipeline without an Application | [Run a Workflow without an Application](workflowrun.md) |
| Find out why a step failed | [Debug Workflow](/docs/next/platform-engineers/debug/debug) |

## Next steps

- [Built-in step types](reference/built-in-steps.md): every step type a WorkflowRun can use, and its parameters. The steps that need an Application, such as `deploy` and `apply-component`, are in KubeVela's [built-in step reference](/docs/next/end-user/workflow/built-in-workflow-defs).
- [Custom workflow steps](authoring/step-definition.md): for platform engineers adding step types of their own.
