---
title: Create a Namespace per Team with forEach
description: "A WorkflowRun that repeats one apply-object step over a list of teams with forEach, names each item by its team, and labels each namespace with its owner."
---

Onboarding three teams is the same step three times: create a namespace and label it with its owner. With `forEach`, the WorkflowRun says that once and lists the teams. Adding a team adds a line to the list, not a step.

**Needs:** the `vela-workflow` controller at 0.8 (the chart at `0.8.0-alpha.2` or later, see [Install](../getting-started/install.md)). A 0.7 controller, such as the `vela-workflow` addon's, doesn't know `forEach`.

## The WorkflowRun

```yaml title="team-namespaces.yaml"
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: team-namespaces
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: namespace
        type: apply-object
        forEach:
          items:
            - { team: payments, owner: alice }
            - { team: search, owner: bob }
            - { team: checkout, owner: carol }
          key: [team]
        inputs:
          - from: each.item.team
            parameterKey: value.metadata.name
          - from: each.item.owner
            parameterKey: value.metadata.labels.owner
        properties:
          value:
            apiVersion: v1
            kind: Namespace
```

- **`forEach.items`** is the list. Each item can be any value; here each is an object.
- **`inputs` with `from: each.item...`** fill the step's properties from the current item, the same way they pass data between two steps. `apply-object` needs no change to be looped.
- **`key: [team]`** names each item's step after its team instead of its position, so the status reads `namespace-payments` rather than `namespace-0`.

## Run it

```shell
kubectl apply -f team-namespaces.yaml
kubectl get workflowrun team-namespaces \
  -o jsonpath='{range .status.steps[*]}{.name}{"\t"}{.phase}{"\n"}{range .subSteps[*]}{"  "}{.name}{"\t"}{.phase}{"\n"}{end}{end}'
```

The loop is one step, `namespace`, with one sub-step per item:

```console
namespace	succeeded
  namespace-payments	succeeded
  namespace-search	succeeded
  namespace-checkout	succeeded
```

The namespaces carry their owners:

```shell
kubectl get namespace payments search checkout -L owner
```

```console
NAME       STATUS   AGE   OWNER
payments   Active   18s   alice
search     Active   18s   bob
checkout   Active   18s   carol
```

The items ran one after another, the default (`mode: StepByStep`). With `mode: DAG` under `forEach` they start together.

## Clean up

```shell
kubectl delete workflowrun team-namespaces
kubectl delete namespace payments search checkout
```

Deleting the WorkflowRun leaves the namespaces in place: nothing owns them.

## Read more

- [Repeating Steps with forEach](../guides/steps/for-each.md): lists from a variable or an expression, looping a step group, failures, restarts and limits.
