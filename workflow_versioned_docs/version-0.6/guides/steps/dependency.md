---
title:  Dependency
---

By default the steps of a workflow run one after another, so each step already waits for the one before it. Set the mode to `DAG` and the steps run at the same time instead; `dependsOn` then makes a step wait until the steps it names have finished.

## How to use

List the steps a step waits for in its `dependsOn`:

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

## Example

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

## Expected outcome

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
