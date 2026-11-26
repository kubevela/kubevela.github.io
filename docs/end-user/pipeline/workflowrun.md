---
title: Run a Workflow without an Application
---

A WorkflowRun runs a list of workflow steps once, outside any Application: a release pipeline that deploys several Applications in turn, a database migration, a scheduled check. Deleting a WorkflowRun does not delete what its steps created.

## Before you start

WorkflowRuns are reconciled by the `vela-workflow` addon, not by vela-core. Enable it:

```shell
vela addon enable vela-workflow
```

:::caution
The addon runs workflow v0.7 (addon version `v0.7.3`, image `oamdev/vela-workflow:v0.7.2`), while KubeVela 1.12 runs workflow v0.8 inside vela-core. The 1.12 step features, such as `forEach` and `$( )` expressions in `if`, work in an Application's workflow but not in a WorkflowRun until the addon moves to v0.8: its controller doesn't know them, and its WorkflowRun CRD drops the fields.
:::

## Example: a release pipeline

This WorkflowRun deploys the same Application to staging, waits for someone to approve it, then deploys it to production. `apply-app` comes with the `vela-workflow` addon: it applies an Application and waits until it is running.

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: release
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: deploy-staging
        type: apply-app
        properties:
          data:
            apiVersion: core.oam.dev/v1beta1
            kind: Application
            metadata:
              name: hello-staging
              namespace: default
            spec:
              components:
                - name: hello
                  type: webservice
                  properties:
                    image: crccheck/hello-world
                    ports:
                      - port: 8000
      - name: approve
        type: suspend
      - name: deploy-prod
        type: apply-app
        properties:
          data:
            apiVersion: core.oam.dev/v1beta1
            kind: Application
            metadata:
              name: hello-prod
              namespace: default
            spec:
              components:
                - name: hello
                  type: webservice
                  properties:
                    image: crccheck/hello-world
                    ports:
                      - port: 8000
```

Save it as `release.yaml` and apply it:

```shell
kubectl apply -f release.yaml
```

### Check how it's going

Once `hello-staging` is running, the WorkflowRun stops at the `approve` step:

```shell
kubectl get workflowrun release
```

```console
NAME      PHASE        AGE
release   suspending   40s
```

To see each step, read `status.steps`:

```shell
kubectl get workflowrun release -o jsonpath='{range .status.steps[*]}{.name}{"\t"}{.phase}{"\n"}{end}'
```

```console
deploy-staging	succeeded
approve	suspending
```

Resume it to deploy to production:

```shell
vela workflow resume release
```

When the last step finishes, the phase is `succeeded`:

```console
NAME      PHASE       AGE
release   succeeded   2m
```

`vela workflow logs release --step <step>` prints a step's logs, but only for steps whose definition writes them with [op.#Log](../../platform-engineers/workflow/cue-actions.md#log). `apply-app` and `suspend` don't, so this example has none.

### WorkflowRun phases

| Phase | Meaning |
| :---: | --- |
| `initializing` | The WorkflowRun has been created and no step has started. |
| `executing` | A step is running. |
| `suspending` | A step is suspended, waiting for `vela workflow resume` or its `duration`. |
| `terminated` | The WorkflowRun was terminated. |
| `failed` | Every step has finished and at least one failed. |
| `succeeded` | Every step has finished and each one succeeded or was skipped. |

### Step phases

| Phase | Meaning |
| :---: | --- |
| `running` | The step is running. |
| `suspending` | The step is suspended. |
| `pending` | The step is waiting for something before it can run, such as its inputs. |
| `succeeded` | The step succeeded. |
| `failed` | The step failed. |
| `skipped` | The step was skipped. |

A failed step has a `message` with the error and a `reason`:

| Reason | Meaning |
| :---: | --- |
| `Execute` | The step failed while running. |
| `Terminate` | The step was terminated. |
| `Output` | The step failed to write one of its `outputs`. |
| `FailedAfterRetries` | The step failed and hit the retry limit. |
| `Timeout` | The step ran past its `timeout`. |
| `Action` | The step's definition called [op.#Fail](../../platform-engineers/workflow/cue-actions.md#fail). |

## The WorkflowRun spec

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: <name>
  namespace: <namespace>
spec:
  mode:                  # optional; default is StepByStep for steps, DAG for sub-steps
    steps: <DAG or StepByStep>
    subSteps: <DAG or StepByStep>
  context:               # optional custom context values
    <key>: <value>
  workflowRef: <optional name of a Workflow to run>
  workflowSpec:          # optional steps to run
    steps:
      - name: <name>
        type: <type>
        dependsOn: <optional list of step names this step waits for>
        meta:
          alias: <optional alias of the step>
        properties:
          <parameter values>
        if: <optional condition to decide whether this step runs>
        timeout: <optional timeout for the step>
        outputs:
          - name: <output name>
            valueFrom: <value source of the output>
        inputs:
          - from: <output name>
            parameterKey: <optional parameter to set from the input>
        subSteps: <optional sub-steps, if the type is step-group>
```

## How steps behave

Steps behave as they do in an Application: suspend and resume, step groups, `dependsOn`, inputs and outputs, timeouts and `if` conditions all work the same way. See [Application Workflow](../workflow/overview.md) for each of them. What differs:

- **Which steps you can use.** Each step in the [step reference](../workflow/built-in-workflow-defs.md) has a **Scope** section. A WorkflowRun can use the steps marked "valid in both Application and WorkflowRun" or "only valid in WorkflowRun". Steps that work on an Application's components, such as `deploy` and `apply-component`, need an Application and don't work here. In a [custom step](../../platform-engineers/workflow/workflow.md), you can't use the [application operations](../../platform-engineers/workflow/cue-actions.md#application-operations).
- **`workflowRef`.** Instead of listing steps in `workflowSpec`, you can run a `Workflow` object by name. If you set both, the steps in `workflowSpec` win. If both the WorkflowRun and the Workflow set `mode`, the WorkflowRun's `mode` wins.
- **`context`.** Steps and `if` conditions read the context described below, and you can add your own values to it.
- **`vela workflow`.** The `vela workflow` commands (`suspend`, `resume`, `terminate`, `restart`, `logs`) work on WorkflowRuns too; only `rollback` is for Applications alone. They look for an Application with the name first, then a WorkflowRun; pass `--type workflow` to go straight to the WorkflowRun.

### Context

Steps in a WorkflowRun can read this context:

| Variable | Description | Type |
| :---: | :---: | :---: |
| `context.name` | The name of the WorkflowRun | string |
| `context.namespace` | The namespace of the WorkflowRun | string |
| `context.stepName` | The name of the current step | string |
| `context.stepSessionID` | The ID of the current step | string |
| `context.spanID` | The trace ID of the current step in this reconcile | string |

Values you set in `spec.context` are added to it. A value with the same name as a built-in one replaces it.

With `if`, a custom value lets one Workflow serve several environments. This WorkflowRun runs the `deploy-template` Workflow with `env: test`, so only the `apply-test` step runs:

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
---
apiVersion: core.oam.dev/v1alpha1
kind: Workflow
metadata:
  name: deploy-template
  namespace: default
steps:
  - name: apply
    type: apply-deployment
    if: context.env == "dev"
    properties:
      image: nginx
  - name: apply-test
    type: apply-deployment
    if: context.env == "test"
    properties:
      image: crccheck/hello-world
```
