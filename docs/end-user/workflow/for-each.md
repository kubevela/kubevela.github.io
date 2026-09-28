---
title: Repeating Steps with forEach
---

Some work is the same step done once per thing: scale a component in each region,
deploy to each cluster in an inventory, notify each team. `forEach` runs a step once
per item in a list, so the workflow says what to repeat and what to repeat it over,
rather than carrying a copy of the step for each item.

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
          - from: loop.item.cluster
            parameterKey: cluster
          - from: loop.item.replicas
            parameterKey: replicas
```

`forEach` gives the list. `inputs` with `from: loop.item...` hands each item to the
step's parameters, the same way [inputs and outputs](./inputs-outputs) pass data
between any two steps. The step's definition needs no change to be looped.

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
expression that reads a source (see the Property Expressions and Sources pages):

```yaml
spec:
  sources:
    - name: inventory
      type: cluster-inventory
  workflow:
    steps:
      - name: deploy
        type: deploy-to-cluster
        forEach:
          items: "$(source.inventory.clusters)"
        inputs:
          - from: loop.item.name
            parameterKey: cluster
```

The expression resolves before the workflow runs, so the step still receives a plain
list. At admission it is checked against the source's schema: an expression whose type
is not a list is refused. Expressions can also sit inside a literal list, one per item:
`items: ["$(source.region.primary)", "eu-west-1"]`.

A WorkflowRun resolves no expressions, so there `items` must be a literal list.

### The list is fixed when the loop starts

The list is read once, when the loop first runs, and kept for the rest of that run. A
source that changes, or an upstream output that is rewritten, cannot reshuffle a loop
that is part-way through. The next run of the workflow reads the list again.

## Reading the current item

Inside a loop, `inputs[].from` can start with `loop`:

| `from` | Gives |
|---|---|
| `loop.item` | the whole item |
| `loop.item.<path>` | a field of an object item: `loop.item.cluster`, `loop.item.spec.replicas` |
| `loop.index` | the item's position, from `0` |

`parameterKey` works as it always does, including nested keys such as `spec.replicas`.
`loop.index` is a number, so it cannot go where only a string is accepted, such as a
label value.

:::note Writing a definition for loops
A step definition can also read `context.loop.item` and `context.loop.index` in its
template. Prefer `inputs` where you can: it keeps the definition usable outside a loop.
:::

`loop` is reserved inside a loop, so an output there cannot be named `loop`.

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
            type: deploy
            inputs:
              - from: loop.item
                parameterKey: region
          - name: verify
            type: check-health
            dependsOn: [deploy]
```

The two modes are independent:

| | Decides |
|---|---|
| `forEach.mode` | whether items run one at a time or all at once |
| the group's `mode` | the order of sub-steps within one item |

So a rollout that goes region by region, deploying each region's pieces in parallel, is
`forEach.mode: StepByStep` with the group's `mode: DAG`. A group with no `mode` runs its
sub-steps as `DAG`, looped or not.

A looped group has no outputs of its own: declare them on its sub-steps, whose outputs
are [collected into lists](#outputs). The group's own `inputs` are waited on before the
loop starts, as for any group.

A sub-step's `dependsOn` naming another sub-step means the one in the same item. Only
top-level steps can have `forEach`; a sub-step cannot loop on its own.

## Order and failure {#order-and-failure}

With `StepByStep`, each item starts once the one before it has finished. If an item
fails, the items after it are skipped, just as later steps are skipped after a failed
step. A failure the workflow is still retrying is not finished yet, so the loop waits on
that item.

With `DAG`, every item starts at once and each finishes on its own.

The looped step's own `if`, `timeout` and `dependsOn` apply to the loop as a whole, not
to each item. To leave some items out, filter the list before the loop.

An item that suspends suspends the loop, so the loop is resumed by name like any other
suspended step.

## Restarting

Restarting from a failed item reruns that item from the start and, in `StepByStep`
mode, every item after it; with `DAG`, only that item. The loop keeps its list, so it
reruns the same items, and the steps after the loop run again as usual.

Restarting from the looped step itself is the one exception to the list being fixed
for a run: it reruns the whole loop, which reads the list again, so a `from` list or a
source may give different items the second time.

## Status

Each item shows up as a sub-step of the looped step:

| Looped | Item steps are named |
|---|---|
| a single step `scale` | `scale-0`, `scale-1`, ... |
| a group `rollout` with sub-step `deploy` | `rollout-0-deploy`, `rollout-1-deploy`, ... |

No other step may have a name the loop could generate; that is refused at admission.

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
          - from: loop.item
            parameterKey: cluster
        outputs:
          - name: endpoint
            valueFrom: output.endpoint
      - name: announce
        type: notification
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
server drops `forEach` without an error. A step reading `loop.item` through `inputs`
then waits, pending on `Pending on Input: loop.item`; one that reads nothing from the
loop runs once.

## When something is wrong

| Message | Means |
|---|---|
| `needs exactly one of items and from` | give the list one way, not both or neither |
| `forEach.mode: supported values: "StepByStep", "DAG"` | the modes are `StepByStep` and `DAG`, in that case |
| `forEach.items ... must be a list` | `items` is an object, `null`, or a plain string. For `from`, the variable holds one of those |
| `a $( ) expression here needs KubeVela with EnableCelExpressions` | expressions are not enabled for this Application, or this is a WorkflowRun |
| `type mismatch: expression ... is string but forEach.items expects list` | the source field is not a list. Check `vela def show <source-type>` |
| `over the limit of 50` | split the list, or raise `workflow.step.forEachMaxItems` |
| `clashes with the names forEach step ... generates` | rename the other step |
| `a step-group with forEach has no outputs of its own` | move the outputs onto its sub-steps |
| `Pending on forEach.from: ...` | no earlier step has produced that variable yet |
| `Pending on Input: loop.item` on a step with `forEach` in its spec | the installed CRD predates `forEach` and dropped it. See [Upgrading](#upgrading) |

## Next

- [Inputs and Outputs](./inputs-outputs) - how data passes between steps.
- [Sub Steps](./step-group) - groups, and their `mode`.
