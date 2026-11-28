---
title: "Order Steps: Groups, Dependencies and DAG Mode"
---

By default the steps of a workflow run one after another, so each step already waits for the one before it. This page covers the ways to change that: the workflow's mode, `dependsOn`, and step groups.

To order components rather than workflow steps, see [Order Components and Pass Data Between Them](/docs/next/end-user/workflow/component-dependency-parameter).

## Execution modes

Each workflow has two modes: one for its `steps`, and one for the sub-steps inside a `step-group`.

| Mode | How steps run | Default for |
| :--- | :--- | :--- |
| `StepByStep` | Each step starts when the one before it succeeds. | `steps` |
| `DAG` | Steps start together; `dependsOn` and `inputs` decide the order. | `subSteps` |

Set them under `workflow.mode`:

```yaml
workflow:
  mode:
    steps: StepByStep
    subSteps: DAG
```

## Wait for other steps with `dependsOn`

In `DAG` mode the steps start together; `dependsOn` makes a step wait until the steps it names have finished. List the steps a step waits for in its `dependsOn`:

```yaml
workflow:
  mode:
    steps: DAG
  steps:
    - name: deploy-db
      type: apply-component
      properties:
        component: db
    - name: deploy-api
      type: apply-component
      dependsOn:
        - deploy-db
      properties:
        component: api
```

Here `deploy-api` starts only once `deploy-db` has finished.

### Example

This Application deploys three components. The `db` and `cache` components have nothing in common, so their steps run together; `api` needs both, so its step waits for them. The three components use the same hello-world image as stand-ins.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: depends-on-app
  namespace: default
spec:
  components:
    - name: db
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
    - name: cache
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
    - name: api
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
  workflow:
    mode:
      steps: DAG
    steps:
      - name: deploy-db
        type: apply-component
        properties:
          component: db
      - name: deploy-cache
        type: apply-component
        properties:
          component: cache
      - name: deploy-api
        type: apply-component
        dependsOn:
          - deploy-db
          - deploy-cache
        properties:
          component: api
```

Save it as `depends-on-app.yaml` and apply it:

```shell
vela up -f depends-on-app.yaml
```

### Expected outcome

Check the Application with `vela status` while `db` is still starting. The Workflow section of the output shows `deploy-cache` finished, `deploy-db` still running, and `deploy-api` pending on it:

```shell
vela status depends-on-app
```

```console
Workflow:

  mode: DAG-DAG
  finished: false
  Suspend: false
  Terminated: false
  Steps
  - id: 4o4zcpbmhj
    name: deploy-db
    type: apply-component
    phase: running
    message: wait healthy
  - id: q6m2k8wx1d
    name: deploy-cache
    type: apply-component
    phase: succeeded
  - id: x7fn3c2tbe
    name: deploy-api
    type: apply-component
    phase: pending
    message: Pending on DependsOn: deploy-db
```

Once `db` is healthy, `deploy-api` runs, and all three steps end as `succeeded`.

## Group steps with `step-group`

A step of type `step-group` holds sub-steps of its own, in `subSteps`. For example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: sub-success
spec:
  components:
    - name: express-server1
      type: webservice
      properties:
        image: crccheck/hello-world
    - name: express-server2
      type: webservice
      properties:
        image: crccheck/hello-world
    - name: express-server3
      type: webservice
      properties:
        image: crccheck/hello-world

  workflow:
    steps:
      - name: step1
        type: apply-component
        properties:
          component: express-server1
      - name: step2
        type: step-group
        subSteps:
          - name: step2-sub1
            type: apply-component
            properties:
              component: express-server2
          - name: step2-sub2
            type: apply-component
            properties:
              component: express-server3
```

By default, steps are executed sequentially, so step2 is not executed until step1 is deployed. Whereas in the step-group, sub-steps will be executed concurrently by default, so step2-sub1 and step2-sub2 will be deployed at the same time.

To run the sub-steps one after another instead, set the sub-step mode on the workflow:

```yaml
  workflow:
    mode:
      steps: StepByStep
      subSteps: StepByStep
    steps:
      # ...the same steps as above
```

The mode applies to every step group in the workflow that does not set its own `mode`; a group's `mode: StepByStep` or `mode: DAG` overrides it. Use `DAG` for `steps` to run the top-level steps in parallel too.
