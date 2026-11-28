---
title: Run a Workflow Template per Environment
description: "One Workflow template, run by two WorkflowRuns with different context values, so each run takes the steps for its own environment."
---

A `Workflow` holds steps without running them. Each WorkflowRun that names it in `workflowRef` runs those steps, with its own `context`. Here one template configures an application for either environment, and `if` on `context.env` picks the steps that apply.

**Needs:** the `vela-workflow` controller ([Install](../getting-started/install.md)).

## The template

```yaml title="configure-env.yaml"
apiVersion: core.oam.dev/v1alpha1
kind: Workflow
metadata:
  name: configure-env
  namespace: default
steps:
  - name: dev-config
    type: apply-object
    if: context.env == "dev"
    properties:
      value:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: app-config-dev
          namespace: default
        data:
          logLevel: debug
  - name: prod-config
    type: apply-object
    if: context.env == "prod"
    properties:
      value:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: app-config-prod
          namespace: default
        data:
          logLevel: warn
  - name: done
    type: print-message-in-status
    properties:
      message: configured
```

A Workflow has `steps` at the top level, not under `spec`, and an optional `mode`.

## Two runs

```yaml title="configure-runs.yaml"
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: configure-dev
  namespace: default
spec:
  context:
    env: dev
  workflowRef: configure-env
---
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: configure-prod
  namespace: default
spec:
  context:
    env: prod
  workflowRef: configure-env
```

## Run it

```shell
kubectl apply -f configure-env.yaml
kubectl apply -f configure-runs.yaml
kubectl get workflowrun configure-dev configure-prod
```

```console
NAME             PHASE       AGE
configure-dev    succeeded   4s
configure-prod   succeeded   4s
```

Each run took its own branch and skipped the other:

```shell
for r in configure-dev configure-prod; do
  echo "== $r"
  kubectl get workflowrun $r -o jsonpath='{range .status.steps[*]}{.name}{"\t"}{.phase}{"\t"}{.message}{"\n"}{end}'
done
```

```console
== configure-dev
dev-config	succeeded
prod-config	skipped
done	succeeded	configured
== configure-prod
dev-config	skipped
prod-config	succeeded
done	succeeded	configured
```

A skipped step doesn't stop the ones after it: `done` ran in both. Each run wrote its own ConfigMap, `app-config-dev` and `app-config-prod`.

## Changing the template

Each reconcile reads the steps from the template, so an edit to `configure-env` reaches every WorkflowRun that hasn't finished, such as one waiting at a suspend step, as well as the next. A finished one keeps what it ran; to run it again with the new steps, use `vela workflow restart configure-dev`.

## Clean up

```shell
kubectl delete workflowrun configure-dev configure-prod
kubectl delete workflow configure-env
kubectl delete configmap app-config-dev app-config-prod
```

## Read more

- [Context](../concepts/context.md): the values a run carries, and how `spec.context` adds to them.
- [Run a Workflow without an Application](../guides/workflowrun.md#how-steps-behave): `workflowRef`, and which `mode` wins when both set one.
