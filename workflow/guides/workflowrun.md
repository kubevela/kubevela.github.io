---
title: Run a Workflow without an Application
---

A WorkflowRun runs a list of workflow steps once, outside any Application: a release pipeline that deploys several Applications in turn, a database migration, a scheduled check. Deleting a WorkflowRun does not delete what its steps created.

## Before you start

WorkflowRuns are reconciled by the `vela-workflow` controller, not by vela-core. Install it from its chart or the `vela-workflow` addon: see [Install](../getting-started/install.md).

:::caution
The `vela-workflow` addon runs workflow v0.7 (addon version `v0.7.3`), while KubeVela 1.12 runs workflow v0.8 inside vela-core. The 0.8 step features, such as `forEach` and `$( )` expressions, work in a WorkflowRun only under a 0.8 controller: install the `vela-workflow` chart at `0.8.0-alpha.2` or later. A 0.7 controller doesn't know them, and its WorkflowRun CRD drops the fields.
:::

The example below uses `apply-app`, which applies a KubeVela Application, so it also needs KubeVela installed.

## Example: a release pipeline

This WorkflowRun deploys the same Application to staging, waits for someone to approve it, then deploys it to production. `apply-app` comes with the `vela-workflow` chart and addon: it applies an Application and waits until it is running.

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

`vela workflow logs release --step <step>` prints a step's logs, but only for steps whose definition writes them with [op.#Log](authoring/cue-actions.md#log). `apply-app` and `suspend` don't, so this example has none.

### Phases

The phase is `initializing`, `executing`, `suspending`, `terminated`, `failed` or `succeeded`, and each step has a phase of its own. What each one means, and the reasons a step fails, are in [Phases and the WorkflowRun Lifecycle](../concepts/lifecycle.md).

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

Steps behave as they do in an Application: suspend and resume, step groups, `dependsOn`, inputs and outputs, timeouts and `if` conditions all work the same way. See [Application Workflow](../getting-started/introduction.md) for each of them. What differs:

- **Which steps you can use.** Each step in the [step reference](../reference/built-in-steps.md) has a **Scope** section. A WorkflowRun can use the steps marked "valid in both Application and WorkflowRun" or "only valid in WorkflowRun". Steps that work on an Application's components, such as `deploy` and `apply-component`, need an Application and don't work here. In a [custom step](authoring/step-definition.md), you can't use the [application operations](authoring/cue-actions.md#application-operations).
- **`workflowRef`.** Instead of listing steps in `workflowSpec`, you can run a `Workflow` object by name. If you set both, the steps in `workflowSpec` win. If both the WorkflowRun and the Workflow set `mode`, the WorkflowRun's `mode` wins.
- **`context`.** Steps and `if` conditions read the context described below, and you can add your own values to it.
- **`vela workflow`.** The `vela workflow` commands (`suspend`, `resume`, `terminate`, `restart`, `logs`) work on WorkflowRuns too; only `rollback` is for Applications alone. They look for an Application with the name first, then a WorkflowRun; pass `--type workflow` to go straight to the WorkflowRun.

### Context

Steps in a WorkflowRun can read the run's name and namespace, the current step, and the values you set in `spec.context`: see [Context](../concepts/context.md). A value with the same name as a built-in one replaces it.

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
