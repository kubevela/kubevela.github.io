---
title: Quick Start
description: "Run a first WorkflowRun end to end: write a ConfigMap, wait for approval, read it back and promote it, passing data between steps. Then the same idea in an Application."
---

This first run promotes a piece of configuration from staging to production, with a person approving in between. It shows the three things most workflows do: run steps in order, stop for approval, and pass data from one step to the next. It only writes ConfigMaps, so it runs on any cluster and pulls no images.

**Needs:** the `vela-workflow` controller ([Install](install.md)), and the `vela` CLI to resume the run.

## The WorkflowRun

```yaml title="promote-config.yaml"
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: promote-config
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: write-staging
        type: apply-object
        properties:
          value:
            apiVersion: v1
            kind: ConfigMap
            metadata:
              name: hello-staging
              namespace: default
            data:
              greeting: Hello from KubeVela Workflow
              logLevel: info
      - name: approve
        type: suspend
      - name: read-staging
        type: read-object
        properties:
          apiVersion: v1
          kind: ConfigMap
          name: hello-staging
        outputs:
          - name: staging-data
            valueFrom: output.value.data
      - name: write-prod
        type: apply-object
        inputs:
          - from: staging-data
            parameterKey: value.data
        properties:
          value:
            apiVersion: v1
            kind: ConfigMap
            metadata:
              name: hello-prod
              namespace: default
```

| Step | Type | Does |
| :--- | :--- | :--- |
| `write-staging` | `apply-object` | Writes the staging ConfigMap. |
| `approve` | `suspend` | Stops the run until someone resumes it. |
| `read-staging` | `read-object` | Reads the staging ConfigMap back, and gives its `data` to later steps as the output `staging-data`. |
| `write-prod` | `apply-object` | Writes the production ConfigMap, with `staging-data` as its `data` through `inputs`. |

## Run it

```shell
kubectl apply -f promote-config.yaml
kubectl get workflowrun promote-config
```

The first step runs, and the run stops at `approve`:

```console
NAME             PHASE        AGE
promote-config   suspending   5s
```

```shell
kubectl get workflowrun promote-config \
  -o jsonpath='{range .status.steps[*]}{.name}{"\t"}{.phase}{"\n"}{end}'
```

```console
write-staging	succeeded
approve	suspending
```

`hello-staging` exists; `hello-prod` doesn't yet. Approve the promotion:

```shell
vela workflow resume promote-config
```

```console
Successfully resume workflow: promote-config
```

The other two steps run, and the run finishes:

```console
NAME             PHASE       AGE
promote-config   succeeded   9s
```

```console
write-staging	succeeded
approve	succeeded
read-staging	succeeded
write-prod	succeeded
```

Production now has staging's data:

```shell
kubectl get configmap hello-prod -o jsonpath='{.data}'
```

```console
{"greeting":"Hello from KubeVela Workflow","logLevel":"info"}
```

The run is finished for good: editing it does nothing, and deleting it leaves the ConfigMaps. To run it again, `vela workflow restart promote-config`. See [Phases and the WorkflowRun Lifecycle](../concepts/lifecycle.md).

:::note
`vela workflow list` needs KubeVela's Application CRD, and fails with `no matches for kind "Application"` on a cluster that has only the `vela-workflow` chart. `vela workflow resume`, `suspend`, `terminate` and `restart` work there; use `kubectl get workflowruns` to list them.
:::

### Clean up

```shell
kubectl delete workflowrun promote-config
kubectl delete configmap hello-staging hello-prod
```

## In an Application

With KubeVela installed, an Application's `spec.workflow` runs on the engine inside vela-core, with no `vela-workflow` controller. This Application deploys `backend`, waits for you to approve, then deploys `frontend`:

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

When every step has succeeded, `vela status` shows the Application as `running`. The same three steps in a WorkflowRun, with `apply-app` instead of `apply-component`, are in [Run a Workflow without an Application](../guides/workflowrun.md#example-a-release-pipeline).

## Next

- [Steps, Workflows and WorkflowRuns](../concepts/workflow-model.md): what a step is, and where its type comes from.
- [Examples](/workflow/next/examples): HTTP calls, loops, templates and a step type of your own.
- [Guides](/workflow/next/guides): each step feature in turn.
