---
title: Quick Start
description: "Run a first WorkflowRun end to end: write a ConfigMap, wait for approval, read it back and promote it, passing data between steps."
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

The run is finished for good: editing it does nothing, and deleting it leaves the ConfigMaps. To run it again, `vela workflow restart promote-config`. The phases are listed in [WorkflowRun Status](../guides/workflowrun.md#status).

:::note
`vela workflow list` needs KubeVela's Application CRD, and fails with `no matches for kind "Application"` on a cluster that has only the `vela-workflow` chart. `vela workflow resume`, `suspend`, `terminate` and `restart` work there; use `kubectl get workflowruns` to list them.
:::

### Clean up

```shell
kubectl delete workflowrun promote-config
kubectl delete configmap hello-staging hello-prod
```

## In an Application

With KubeVela 1.10 installed, an Application's `spec.workflow` runs on the engine inside vela-core, with no `vela-workflow` controller. KubeVela's [Application Workflow overview](/docs/v1.10/end-user/workflow/overview) starts from there.

## Next

- [K8S API for Pipeline](../guides/workflowrun.md): the WorkflowRun spec and status.
- [Examples](/workflow/0.6/examples): HTTP calls, templates and a step type of your own.
- [Guides](/workflow/0.6/guides): each step feature in turn.
