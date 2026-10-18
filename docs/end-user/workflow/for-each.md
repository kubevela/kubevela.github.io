---
title: Repeating Steps with forEach
description: "Run a workflow step once per item in a list with forEach: items from a list, a variable or a source, named by key, with per-item status and restart."
---

Some work is the same step done once per thing: scale a component in each region,
deploy to each cluster in an inventory, notify each team. Without a loop, the workflow
carries a copy of the step for each one:

```yaml
    steps:
      - name: scale-us-east
        type: scale-component
        properties: { component: web, cluster: prod-us-east, replicas: 3 }
      - name: scale-eu-west
        type: scale-component
        properties: { component: web, cluster: prod-eu-west, replicas: 2 }
```

`forEach` runs a step once per item in a list, so the workflow says what to repeat and
what to repeat it over. Adding a region adds an item, not a step, and the workflow
stops growing with the inventory:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: web
spec:
  components:
    - name: web
      type: webservice
      properties:
        image: nginx:1.27
  workflow:
    steps:
      - name: scale
        type: scale-component          # any step type, unchanged
        forEach:
          items:
            - { cluster: prod-us-east, replicas: 3 }
            - { cluster: prod-eu-west, replicas: 2 }
        inputs:
          - from: each.item.cluster
            parameterKey: cluster
          - from: each.item.replicas
            parameterKey: replicas
```

Both run one region after the other, and a failure skips the regions after it. The
difference is in the status: the loop is one step, `scale`, with its items, `scale-0` and
`scale-1`, as sub-steps.

`forEach` gives the list. `inputs` with `from: each.item...` hands each item to the
step's parameters, the same way [inputs and outputs](./inputs-outputs.md) pass data
between any two steps. The step's definition needs no change to be looped.

:::note
`scale-component` and `announce-endpoints` on this page stand for step definitions of
your own. The other step types are KubeVela's built-ins.
:::

## The list

Give exactly one of `items` and `from`.

| Field | Is |
|---|---|
| `items` | the list itself: strings, numbers or objects, mixed if you like |
| `from` | a workflow variable holding the list, written as in `inputs[].from`: `regions` or `inventory.clusters` |
| `mode` | `StepByStep` (the default) or `DAG`. See [Order and failure](#order-and-failure) |

A step using `from` waits, as a pending step, until an earlier step has produced that
variable.

### From a source

Where property expressions are enabled for the Application, `items` can be a single
expression that reads a source or an earlier step's output:

```yaml
spec:
  sources:
    - name: targets
      type: configmap-local
      properties:
        name: rollout-targets       # data.clusters: "prod-us-east,prod-eu-west"
  workflow:
    steps:
      - name: deploy
        type: apply-component
        forEach:
          items: '$(source.targets.data.clusters.split(","))'
        properties:
          component: web
        inputs:
          - from: each.item
            parameterKey: cluster
```

The expression is resolved once, when the loop starts, and the list is then fixed for
the run (see below). It can read a source or an earlier step's output,
`$(steps.discover.outputs.clusters)`; until what it reads is ready, the loop waits.
Where admission knows the type, a source field for instance, an expression that is not
a list is refused when you apply. Expressions can also sit inside a literal list, one
per item: `items: ["$(source.region.primary)", "eu-west-1"]`.

A WorkflowRun takes an expression in `items` too, when it is annotated
`workflowrun.oam.dev/cel-expressions: "true"` and the workflow controller runs with
`EnableCelExpressions`. It reads `steps` and `context`, since `source` belongs to
KubeVela; see Standalone WorkflowRun in Expressions in Workflow Steps.

### The list is fixed when the loop starts

The list is read once, when the loop first runs, and kept for the rest of that run. A
source that changes, or an upstream output that is rewritten, cannot reshuffle a loop
that is part-way through. The next run of the workflow reads the list again.

## Reading the current item

Inside a loop, `inputs[].from` can start with `each`:

| `from` | Gives |
|---|---|
| `each.item` | the whole item |
| `each.item.<path>` | a field of an object item: `each.item.cluster`, `each.item.spec.replicas` |
| `each.index` | the item's position, from `0` |
| `each.key` | the name the item's steps carry: its [key](#key), or its position as a string (`"0"`) when the loop has none |

`parameterKey` works as it always does, including nested keys such as `spec.replicas`.
`each.index` is a number, so it cannot go where only a string is accepted, such as a
label value. `each.key` is a string, so it can: it is the usual way to name what an item
creates after the item itself.

:::note Writing a definition for loops
A step definition can also read `context.each.item`, `context.each.index` and `context.each.key` in its
template. Prefer `inputs` where you can: it keeps the definition usable outside a loop.
:::

`each` is reserved inside a loop, so an output there cannot be named `each`.

### With property expressions

Where expressions are on, a looped step's properties can read the item directly, and a
looped group's sub-steps can decide per item whether to run:

```yaml
      - name: rollout
        type: step-group
        forEach:
          items:
            - { cluster: prod-us-east, enabled: true }
            - { cluster: prod-eu-west, enabled: false }
        subSteps:
          - name: deploy
            type: apply-component
            if: '$(each.item.enabled)'
            properties:
              component: web
              cluster: '$(each.item.cluster)'
```

`each.item`, `each.index` and `each.key` read as they do in `inputs`, and a literal list
types them when you apply. Inside a looped group, `$(steps.deploy.outputs.x)` reads the
output of this item's `deploy`.

## Repeating several steps

Put `forEach` on a `step-group` to run all of its sub-steps once per item:

```yaml
      - name: rollout
        type: step-group
        mode: StepByStep                 # sub-steps in order, within each item
        forEach:
          items: [us-east-1, eu-west-1, ap-south-1]
          mode: DAG                      # every region at once
        subSteps:
          - name: deploy
            type: apply-component
            properties:
              component: web
            inputs:
              - from: each.item
                parameterKey: cluster
          - name: verify
            type: print-message-in-status
            dependsOn: [deploy]
            properties:
              message: web deployed
```

The two modes are independent. `forEach.mode` decides how items run against each
other; the group's own `mode` decides how one item's sub-steps run. For a rollout over
regions:

| | group `mode: DAG` (default) | group `mode: StepByStep` |
|---|---|---|
| **`forEach.mode: StepByStep`** (default) | one region at a time; within a region, its steps start together | one region at a time; within a region, its steps run in order |
| **`forEach.mode: DAG`** | every region at once; within each, its steps start together | every region at once; within each, its steps run in order |

For a staged release, keep `forEach.mode` at `StepByStep`: a region that fails stops
the regions after it. A group with no `mode` takes the workflow's `mode.subSteps`, and
`DAG` when that is unset too, looped or not; under `DAG`, `dependsOn` between sub-steps
still orders them within an item.

A looped group has no outputs of its own: declare them on its sub-steps, whose outputs
are [collected into lists](#outputs). The group's own `inputs` are waited on before the
loop starts, as for any group.

A sub-step's `dependsOn` naming another sub-step means the one in the same item. Only
top-level steps can have `forEach`; a sub-step cannot loop on its own.

## Order and failure {#order-and-failure}

{/* PRODUCT GAP DAGSKIP-SET: on fix, drop the clause after "running" in the DAG row. */}

| Situation | What happens |
|---|---|
| `StepByStep`, an item succeeds | the next item starts |
| `StepByStep`, an item fails | the items after it are skipped, as later steps are after a failed step |
| `StepByStep`, an item fails but is still being retried | it has not finished, so the loop waits on it |
| `DAG` | every item starts at once, with no cap on how many beyond the [item limit](#limits). A failed item does not stop the items already running, though today it can cut short the ones after it: see the caution below |
| the `EnableSuspendOnFailure` gate is on, and an item fails after its retries | the workflow suspends on that item, and the items after it wait rather than being skipped. An item whose step fails outright (a definition's `#Fail`) still ends the workflow |
| an item suspends | the loop suspends. `vela workflow resume <app> --step <loop>` resumes every suspended item; `--step <loop>-1` resumes one item (in a looped group, the item's sub-step: `--step <loop>-1-<sub-step>`) |

{/* PRODUCT GAP DAGSKIP-SET: remove this caution when a failed DAG item affects only itself. */}
:::caution
In `DAG` mode a failed item can cut short items after it in the list: their unfinished
steps may be skipped, and whether they are depends on timing, so the outcome can vary
between runs. This is a known bug; the intended behaviour is that a failed item affects
only itself.
:::

The looped step's own `if`, `timeout` and `dependsOn` apply to the loop as a whole, not
to each item. To leave some items out, filter the list before the loop, or, in a looped
group, give a sub-step an `if` that reads `each` (see
[With property expressions](#with-property-expressions)).

:::caution
With the `EnableSuspendOnFailure` gate on, no step evaluates its `if`, sub-steps included,
so filtering a loop with `if` leaves nothing out: every item runs, with no error.
Filtering the list stays reliable, either before the loop or in `items` itself, which is
not an `if`: `items: '$(source.x.items.filter(i, i.enabled))'`. See Conditions in Expressions in
Workflow Steps.
:::

## Restarting

{/* PRODUCT GAP RESTARTSTEP-SET: remove this caution when the vela workflow restart fix ships. */}
:::caution
On current builds, `vela workflow restart --step` fails on every Application, looped or
not:

```
Error: expected pointer, but got nil
```

A fix is in progress. Until it ships, this section describes what the command will do,
not what it does today.
:::

Restart from a failed item by its step name:

```bash
vela workflow restart <app> --step deploy-1
```

| Restart from | What reruns |
|---|---|
| a failed item, `StepByStep` | that item and every item after it, with the same items as before |
| a failed item, `DAG` | only that item |
| a failed sub-step of an item in a looped group | that sub-step and the sub-steps that depend on it. The item's succeeded sub-steps are kept: restarting `rollout-1-verify` keeps `rollout-1-deploy` |
| the failed looped step itself | the whole loop, which reads the list again, so a `from` list or a source may give different items. This is the one exception to [the list being fixed](#the-list-is-fixed-when-the-loop-starts) for a run |

In every case the steps after the loop run again as usual. Only a failed item (in a
looped group, its failed sub-step, such as `rollout-1-verify`) or a failed loop can be
restarted; anything else is refused with `can not restart from a non-failed step`.

## Status

Each item shows up as a sub-step of the looped step:

| Looped | Item steps are named |
|---|---|
| a single step `scale` | `scale-0`, `scale-1`, ... |
| a group `rollout` with sub-step `deploy` | `rollout-0-deploy`, `rollout-1-deploy`, ... |

No other step may have a name the loop could generate; that is refused at admission.

### Naming items by a key {#key}

By default an item's steps are named by its position. Give `key` to name them by the
item's own values instead, so the status says which item is which. The example reads the item with `$(each.item...)`, which needs
expressions turned on; without them, pass the same fields with `inputs` as in
[Reading the current item](#reading-the-current-item):

```yaml
      - name: rollout
        type: step-group
        forEach:
          from: targets            # [{cluster: prod-us, namespace: shop}, ...]
          key: [cluster, namespace]
        subSteps:
          - name: deploy
            type: apply-component
            properties:
              component: shop
              cluster: '$(each.item.cluster)'
              namespace: '$(each.item.namespace)'
          - name: verify
            type: print-message-in-status
            dependsOn: [deploy]
            properties:
              message: 'shop is up in $(each.key)'
```

| Looped | Without `key` | With `key: [cluster, namespace]` |
|---|---|---|
| a single step `scale` | `scale-0` | `scale-prod-us-shop` |
| a group `rollout` with sub-step `verify` | `rollout-0-verify` | `rollout-prod-us-shop-verify` |

`key` is a list of one to eight paths into each item, with the same dotted syntax as
`inputs[].from` (`spec.zone`). One field is still a list: `key: [name]`. The values are joined with
`-`. The item's outputs and its `each` variable are named the same way
(`rollout-prod-us-shop-endpoint`), and you restart an item by its keyed step name.
`each.key` reads the joined key. A key changes names only: `each.index` still counts
from 0, and collected outputs keep the order of the items.

The loop fails, naming the items involved, if a key cannot name a step:

- a value is missing, or is not a string or an integer;
- the joined key holds anything but letters, digits, `-` and `_`, does not start and
  end with a letter or digit, or is over 63 characters. A `.` is not allowed, since
  `inputs[].from` reads a path by its dots;
- two items have the same joined key: `{a: x-y, b: z}` and `{a: x, b: y-z}` both give
  `x-y-z`;
- a key and a sub-step name together repeat another item's step name: key `a` with
  sub-step `b-c`, and key `a-b` with sub-step `c`, both name a step `rollout-a-b-c`.

A path that is empty or malformed (`spec.`), or the same path twice, is refused when you
apply; a path the items do not have fails the loop when it runs.

A key is never rewritten to make it fit. Where the values need reshaping, build a key
field in the source or an earlier step, and use that.

### When an item fails {#when-an-item-fails}

What a failed item does to the items around it depends on the mode; see
[Order and failure](#order-and-failure). A failed loop's message names the item that
failed, so the cause shows in the Application's status without opening each sub-step:

```yaml
- name: deploy
  phase: failed
  reason: Action
  message: "item 1 (us-east) failed: region us-east is unreachable"
  subSteps:
  - name: deploy-0
    phase: succeeded
  - name: deploy-1
    phase: failed
    reason: Action
    message: region us-east is unreachable
  - name: deploy-2
    phase: skipped
    reason: Skip
```

The message gives the item's index and value, and the failing step's own message. In
a group it also names the sub-step, as in `item 1 (us-east) failed at verify: ...`. An
item that is not a string is shown as JSON, cut to 60 characters. In a keyed loop the
message shows the key instead: `item 1 (prod-us-shop) failed at verify: ...`. With `DAG`, where
several items can fail, the message names the first of them by index and counts the
rest: `...; 2 more items failed`. Their messages are on their own sub-steps.

To work through a failed item:

1. Read the loop's `message` for the item and the error. The item's sub-step has the
   same error, and the rest of its status.
2. Fix the cause, then [restart](#restarting) from the item's step, `deploy-1`. It
   reruns with the same item.

:::note
To dig further, look at what the item produced. The workflow keeps each item's
`{item, index, key}` and its outputs as variables, `deploy-1-each` and
`deploy-1-<output>`, in the context ConfigMap named in the workflow status's
`contextBackend`. The collected list under the output's own name is written only once
every item succeeds.
:::

## Outputs {#outputs}

An output declared inside a loop is per item while the loop runs. Once the loop
succeeds, the output is also written as a list under its own name, one entry per item,
with `null` where an item did not produce it:

```yaml
      - name: scale
        type: scale-component
        forEach:
          items: [prod-us-east, prod-eu-west]
        inputs:
          - from: each.item
            parameterKey: cluster
        outputs:
          - name: endpoint
            valueFrom: output.endpoint
      - name: announce
        type: announce-endpoints
        inputs:
          - from: endpoint              # ["https://...", "https://..."]
            parameterKey: endpoints
```

Pick output names no other step uses, as you would anywhere in a workflow: two steps
setting the same variable to different values fail.

## Limits

A loop can have up to 50 items, since every item is recorded in the Application's
status. The limit is a controller flag, `--max-for-each-items`, set through the chart
value `workflow.step.forEachMaxItems`.

## Upgrading {#upgrading}

`forEach` is a new field in the Application, Workflow and WorkflowRun CRDs. Helm does not
upgrade CRDs, so apply the new ones before relying on it. Against an older CRD the API
server drops `forEach` without an error. A step reading `each.item` through `inputs`
then waits, pending on `Pending on Input: each.item`; one that reads nothing from the
loop runs once.

## When something is wrong

| Message | Means |
|---|---|
| `needs exactly one of items and from` | give the list one way, not both or neither |
| `forEach.mode: supported values: "StepByStep", "DAG"` | the modes are `StepByStep` and `DAG`, in that case |
| `must be a list` | `items` is an object, `null`, or a plain string. For `from`, the variable holds one of those |
| `a $( ) expression here needs expressions turned on` | turn on `EnableCelExpressions` and annotate the Application (`app.oam.dev/cel-expressions`) or WorkflowRun (`workflowrun.oam.dev/cel-expressions`) |
| `was not resolved; $( ) expressions are not turned on for this workflow` | the same, caught when the loop runs |
| `type mismatch: expression ... is string but forEach.items expects list` | the source field is not a list. Check `vela def show <source-type>` |
| `over the limit of 50` | split the list, or raise `workflow.step.forEachMaxItems` |
| `clashes with the names forEach step ... generates` | rename the other step |
| `items 0 and 1 have the same key "..."` | the key fields do not tell those items apart. Add a field to `key` |
| `items 0 and 1 both name a step ...` | a key and a sub-step name join into another item's step name. Rename the sub-step or change the key |
| `item 0: key <path> must be a string or an integer, got ...` | a key field holds a float, a bool, an object or a list |
| `item 0: key "..." is over 63 characters` | the joined key is too long to name a step. Key on fewer or shorter fields |
| `item 0 has no value at key ...` | the item lacks that field, or is not an object |
| `item 0: key "..." may only hold letters, digits, '-' and '_'` | the value holds a `.`, a space or similar. Use another field, or build one |
| `a step-group with forEach has no outputs of its own` | move the outputs onto its sub-steps |
| `Pending on forEach.from: ...` | no earlier step has produced that variable yet |
| `Pending on Input: each.item` on a step with `forEach` in its spec | the installed CRD predates `forEach` and dropped it. See [Upgrading](#upgrading) |

## Next

- [Inputs and Outputs](./inputs-outputs.md): how data passes between steps.
- [Sub Steps](./step-group.md): groups, and their `mode`.
