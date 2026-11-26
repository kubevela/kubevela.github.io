---
title: Expressions in Workflow Steps
description: Read earlier steps' outputs and status, the current loop item and the Application's sources in workflow step properties, forEach items and $( ) conditions.
---

A workflow step can use `$( )` expressions in three places: its `properties`, its
`forEach.items`, and its `if`. On top of everything a component property can read,
a step can read the steps around it and, inside a loop, the current item.

```yaml
workflow:
  steps:
    - name: release
      type: read-config
      properties:
        name: release
      outputs:
        - name: version
          valueFrom: output.config.version
    - name: announce
      type: notification
      if: '$(steps.release.succeeded)'
      properties:
        slack:
          url:
            secretRef: {name: slack, key: url}
          message:
            text: 'releasing $(steps.release.outputs.version) to $(context.namespace)'
```

This page covers what is particular to workflow steps. The expression language,
escaping, types and the `has()` guard are on [Property Expressions](../cel-expressions.md),
and [How Expressions Are Evaluated](../cel-expressions-lifecycle.md) explains when each
part is checked and resolved.

## Turning them on

Expressions in an Application's workflow are turned on the same way as anywhere else in
the Application: the `EnableCelExpressions` gate, plus the `app.oam.dev/cel-expressions: "true"`
annotation where your platform requires opt-in. See
[Turning them on](../cel-expressions.md#turning-them-on).

For a standalone `WorkflowRun`, see [below](#workflowrun).

## What a step can read

| Root | Reads | Where in a step |
|---|---|---|
| `context` | the Application and the step: `appName`, `namespace`, `stepName`, `stepType`, ... | properties, `forEach.items`, `if` |
| `source` | a value fetched by one of the Application's [sources](../../platform-engineers/source/using-sources.md), read when a run first uses it (from the cache while its entry is fresh) and [pinned](../cel-expressions-lifecycle.md#workflow-steps) for the rest of the run | properties, `forEach.items`, `if` |
| `steps` | another step's outputs and status | properties, `forEach.items`, `if` |
| `each` | the current item of a [forEach](./for-each.md) | inside a loop only |

`component` is not offered in a step: a step reads a component's result through the
step that deployed it. The full table of roots by location is on
[Property Expressions](../cel-expressions.md#where-they-work).

## Reading another step

### Outputs

`steps.<name>.outputs.<output>` reads an output the step declared in its `outputs`:

```yaml
- name: lookup
  type: read-config
  properties:
    name: tenants
  outputs:
    - name: tenants
      valueFrom: output.config.tenants
- name: notify
  type: notification
  properties:
    slack:
      url:
        secretRef: {name: slack, key: url}
      message:
        text: '$(string(steps.lookup.outputs.tenants.size())) tenants found'
```

This does the same job as [`inputs`](./inputs-outputs.md), without the `parameterKey`
plumbing, and it can be combined, converted or tested like any other value. The output
keeps its own type: a list stays a list and a number stays a number.

### Status

A step's status is readable too:

| Read | Type | True or set when |
|---|---|---|
| `steps.<name>.phase` | string | `"succeeded"`, `"failed"` or `"skipped"` |
| `steps.<name>.message` | string | the step's status message |
| `steps.<name>.reason` | string | the step's status reason |
| `steps.<name>.succeeded` | bool | the phase is `succeeded` |
| `steps.<name>.failed` | bool | the phase is `failed` |
| `steps.<name>.skipped` | bool | the phase is `skipped` |
| `steps.<name>.timeout` | bool | it failed on its `timeout` |
| `steps.<name>.failedAfterRetries` | bool | it hit the controller's error-retry limit (10 by default). A step that fails on purpose, with `#Fail`, is `failed` but not this |
| `steps.<name>.terminate` | bool | it was stopped by terminating the workflow, or it is a `#Break` step (whose phase is `succeeded`) |

The names are the same as the CUE `status.<name>` fields an `if` has always offered.
The types are what each field holds when the step runs; neither outputs nor status
fields are checked against a parameter when you apply, so a mismatch fails the step
that reads it.

### A step name with a hyphen

Read it by index:

```yaml
if: '$(steps["list-tenants"].succeeded)'
```

### When the answer is ready

A read is answered once the step it reads has finished. Until then the reading step
**waits**: it shows phase `running`, reason `Wait`, and a message naming what it is
waiting for:

```
steps.build.outputs.image: waiting for step build
```

A step has finished when it has succeeded, been skipped, or failed for good. A step
that failed and is still retrying has not finished.

Reading an output of a step that did not succeed is an error rather than a wait: the
reading step fails, with reason `Rendering`, and so does the workflow. Each message is
prefixed with the read, as in `steps.x.outputs.y: step x was skipped`:

| The step it reads | `$(steps.x.outputs.y)` | `$(has(steps.x.outputs.y) ? steps.x.outputs.y : "none")` |
|---|---|---|
| still running | waits | waits |
| skipped | `step x was skipped` | `"none"` |
| failed | `step x failed` | `step x failed` |
| succeeded, but its `valueFrom` found nothing | see below | `null` |

:::tip
`has()` does not stop the wait for a step that is still running, and it does not catch
an output that came back empty. A succeeded step whose `valueFrom` finds nothing stores
`null`, which `has()` counts as present; the step still shows `succeeded`, with the
message `failed to get output from <valueFrom>`. Guard both cases at once:

```yaml
text: '$(has(steps.x.outputs.y) && steps.x.outputs.y != null ? steps.x.outputs.y : "none")'
```
:::

Guard every output that may be unset. An unguarded `null` reaches a whole-value property
as `null`, and inside text it fails the step's render, naming the read.

### Reads put steps in order

A read is a dependency, so you do not need a `dependsOn` for it.

- **In `DAG` mode**, the reader gets a `dependsOn` on the step it reads.
- **In `StepByStep` mode** (the default), order already answers it, so nothing is added.
  A step may read only steps that come before it.

Either way the edge is recorded under `status.workflow.dependencies`, with
`source: expression`, so you can see why a step waited:

```yaml
status:
  workflow:
    dependencies:
      - step: deploy
        dependsOn: build
        source: expression
```

A read that cannot be put in order is refused when you apply the Application:

| Message | Means |
|---|---|
| `step deploy cannot read its own outputs` | a step reading itself, its own group, or its own sub-steps (status reads included) |
| `notify runs after deploy, and a workflow run in order cannot wait for it` | in `StepByStep`, a read of a later step. Move the step, or use `DAG` |
| `reading build closes a cycle through dependsOn` | the read and the existing `dependsOn` edges loop back on each other |

A read does not change the default for a step with no `if`: in `StepByStep`, an
earlier step that fails still skips it, as it would with no read at all. To run a step
after a failure, give it a [condition](#conditions) that says so.

## Conditions: `$( )` in `if` {#conditions}

An `if` that is exactly one `$( )` expression is a condition. The step runs when it is
`true` and is skipped when it is `false`:

```yaml
- name: rollback
  type: notification
  if: '$(steps.deploy.failed || steps.deploy.timeout)'
  properties:
    slack:
      url:
        secretRef: {name: slack, key: url}
      message:
        text: 'deploy of $(context.appName) did not finish: $(steps.deploy.message)'
```

Any other `if` is CUE, exactly as before, so existing workflows are unaffected. `always`
and an empty `if` keep their meaning too. Like a CUE `if`, a condition replaces the
default rule that a step is skipped after an earlier failure, which is what lets the
`rollback` step above run.

A condition is only read as one when expressions are on for the Application. With the
gate off, or without the `app.oam.dev/cel-expressions: "true"` annotation where your
platform requires it, a `$( )` `if` is refused when you apply the Application, with a
message naming the switch to turn on.

| `if` | Read as |
|---|---|
| `$(steps.build.succeeded)` | a condition |
| `  $(context.namespace == "prod")  ` | a condition (surrounding spaces are fine) |
| `$(steps.a.succeeded && steps.b.failed)` | a condition |
| `$(steps.a.succeeded) && $(steps.b.failed)` | refused when you apply it: two expressions, not one. Put the whole test inside one `$( )` |
| `status.build.succeeded` | CUE |
| `always` | CUE, as before |

The result must be a bool. Where admission knows the type of what you read, a `context`
or `source` read, an Application whose condition is not a bool is refused when you
apply it:

```
type mismatch: expression $(source.cfg.data.mode) is string but if expects bool
```

Compare instead, guarding the read: `$(has(source.cfg.data.mode) && source.cfg.data.mode == "blue")`. A `steps` read is not typed when
you apply, so `if: $(steps.build.phase)` is admitted, and the step
[fails](#condition-outcomes) when it runs.

:::caution
With the controller's `EnableSuspendOnFailure` gate on (a workflow gate, set with the
`workflow.enableSuspendOnFailure` Helm value, so it is not in the published ConfigMap; see
[Feature Gates](../../platform-engineers/system-operation/bootstrap-parameters.md#feature-gates)),
no step `if` is evaluated, CUE
or `$( )`: every step runs whatever its `if` says. The `rollback` step above runs even
after a successful deploy. A failed step suspends the run instead of finishing, so a
status read of it waits rather than answering. This covers sub-steps too: a
step-group's sub-steps run even when the group's own `if` would skip it, and in a
[forEach](./for-each.md) loop a condition meant to skip items does not skip them.
:::

### Conditions wait

A condition reads what the step's properties can: `context`, `source`, `steps` and,
inside a loop body, `each`. If a read is not answered yet, the step **waits** rather
than being skipped, and the condition is checked again on a later reconcile. A CUE `if`
over `status.x` does not wait: it is decided by whatever the status is at that moment.

### Guard what may be absent

A condition decides the step, so the
[`has()` guard](../cel-expressions.md#values-that-might-be-missing) is required for
every read that may be absent: an optional field of a source, a key of an open map such
as `context.appLabels`, or a field that only some loop items have.

```yaml
if: '$(has(source.cfg.data.mode) && source.cfg.data.mode == "blue")'
```

Without the guard:

```
source.cfg.data.mode may be absent and decides the step; guard it with
has(source.cfg.data.mode) ? source.cfg.data.mode : <fallback>
```

### Conditions in loops

A [forEach](./for-each.md) step's own `if` is decided **once**, before the first pass,
and cannot read `each`. To decide per item, make the loop a `step-group` and put the
`if` on its sub-steps, which are checked on every pass:

```yaml
- name: per-region
  type: step-group
  forEach:
    items: [{region: eu, wave: 1}, {region: us, wave: 2}]
  subSteps:
    - name: deploy
      type: apply-component
      if: '$(each.item.wave == 1)'
      properties:
        component: web
        cluster: '$(each.item.region)'
```

A sub-step whose condition is `false` is skipped for that pass only.

### When a condition skips or fails {#condition-outcomes}

A step whose condition is `false` shows phase `skipped`, reason `Skip`, and no message.

A step whose condition could not be evaluated is not skipped: it fails, with reason
`Action`, and so does the workflow. Skipping it would let the workflow succeed without
a step nobody chose to leave out. The message says why:

```
this step's if could not be evaluated: $(steps.build.phase) is string, but a step's if must be a bool
```

## Reading the loop item

Inside a forEach body, `each` is the current pass:

| Read | Type | Gives |
|---|---|---|
| `each.item` | the item's type | the current item |
| `each.index` | int | its position, from 0 |
| `each.key` | string | its [key](./for-each.md#key) |

```yaml
properties:
  name: 'greeting-$(each.item.name)'
  config:
    message: 'hi $(each.item.name), #$(each.index)'
```

`each` is not set in a loop's own `if`, in its `forEach.items`, or in any step outside a
loop. Reading it there is refused:

```
each is only set inside a forEach body
```

When the items are a literal list, or a single read of a source list, `each.item` is
typed from them when you apply the Application. Feeding an int item into a string
parameter is refused then, rather than failing mid-run. Text around the read makes it
a string, so `'wave $(each.item)'` is always fine.

[forEach](./for-each.md) covers loops themselves: items, order, failure and outputs.

## Standalone WorkflowRun {#workflowrun}

This needs the standalone workflow controller, installed from its own `vela-workflow`
chart. A KubeVela install does not ship the `WorkflowRun` CRD or controller.

A `WorkflowRun` from the [standalone workflow controller](https://github.com/kubevela/workflow)
supports the same expressions in properties, `forEach.items` and `if`, with two differences:

| | Application workflow | WorkflowRun |
|---|---|---|
| Opt-in annotation | `app.oam.dev/cel-expressions: "true"` | `workflowrun.oam.dev/cel-expressions: "true"` |
| Gate | KubeVela's `EnableCelExpressions` | the workflow controller's `EnableCelExpressions` (Helm: `workflow.enableCelExpressions`) |
| Roots | `context`, `source`, `steps`, `each` | `context`, `steps`, `each`. There is **no `source`** |
| Types checked on apply | yes, where the read's kind is known: not `steps` reads, and `each.item` only from a [literal or source list](#reading-the-loop-item) | no: a wrong type or a missing guard shows up when the step runs |

Each annotation only counts on its own kind: a `WorkflowRun` ignores the Application
one, and the other way round.

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: tenants
  annotations:
    workflowrun.oam.dev/cel-expressions: "true"
spec:
  mode:
    steps: DAG
  workflowSpec:
    steps:
      - name: create
        type: create-config
        properties:
          name: tenants
          config:
            tenants: [{name: a}, {name: b}]
      - name: check
        type: read-config
        dependsOn: [create]
        properties:
          name: tenants
        outputs:
          - name: tenants
            valueFrom: output.config.tenants
      - name: per-tenant
        type: step-group
        if: '$(steps.check.succeeded && steps.check.outputs.tenants.size() > 0)'
        forEach:
          items: '$(steps.check.outputs.tenants)'
        subSteps:
          - name: save
            type: create-config
            properties:
              name: 'tenant-$(each.item.name)'
              config:
                index: '$(each.index)'
```

## When something is wrong

Errors common to every expression (escaping, types, `has()`) are on
[Property Expressions](../cel-expressions.md#when-something-is-wrong). These are
particular to steps:

| Message | Means |
|---|---|
| `steps.build.outputs.image: waiting for step build` | not an error: the step being read has not finished |
| `a $( ) condition needs expressions, ...` | a `$( )` `if` in an Application that does not read expressions; the rest of the message names the switch. See [Conditions](#conditions) |
| `a $( ) condition must be the whole if, one expression: ...` | the `if` holds two expressions, or text around one. Put the whole test inside one `$( )` |
| `no step "biuld"` | the name matches no step |
| `step build declares no output "img"` | the step has no such entry in `outputs` |
| `read steps.build.outputs.<name>, or steps.build.<phase\|message\|...>` | `steps.build.<field>` is not an output or a status field |
| `steps.build.succeeded is a value; read nothing below it` | a read under a status field |
| `output "image" is declared by more than one step` | two steps declare the same output name, so the read is ambiguous |
| `step build was skipped` / `step build failed` | an unguarded output read of a step that did not succeed. Guard it, or test its status first |
| `each is only set inside a forEach body` | `each` outside a loop body, in `forEach.items`, or in a loop's own `if` |
| `"component" cannot be read here` | a step cannot read components. Read the output of the step that deployed it |
| `undeclared reference to 'source'` | in a `WorkflowRun`, which has no sources |
| `... may be absent and decides the step` | a condition read needs a `has()` guard |
| `type mismatch: ... but if expects bool` | the condition is not a bool. Compare it to something |
| `this step's if could not be evaluated: ...` | the condition failed at run time, so the step failed. The rest of the message says why |

## Next

- [forEach](./for-each.md): repeating a step once per item.
- [Property Expressions](../cel-expressions.md): the language, escaping and guards.
- [If Conditions](./if-condition.md): CUE conditions, `always`, and the default.

{/* PENDING: the Sources links resolve once kubevela.github.io#1469 merges, and the forEach links once #1453 does. */}
