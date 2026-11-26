---
title: Reading Other Components
description: Read another component of the same Application live once it is running, with $(component...) expressions, including across clusters and namespaces.
---

A component or trait property can read another component of the same Application,
live, once that component is running:

```yaml
url: 'postgres://$(component.db.output.data.host):$(component.db.output.data.port)/shop'
```

In full, with `db` publishing its address in a ConfigMap and `api` reading it:

```yaml
components:
  - name: db
    type: k8s-objects
    properties:
      objects:
        - apiVersion: v1
          kind: ConfigMap
          metadata:
            name: db-info
          data:
            host: db.internal
            port: "5432"
  - name: api
    type: k8s-objects
    properties:
      objects:
        - apiVersion: v1
          kind: ConfigMap
          metadata:
            name: api-config
          data:
            url: 'postgres://$(component.db.output.data.host):$(component.db.output.data.port)/shop'
```

`api` is not rendered until `db` is applied and healthy, and then it reads `db`'s
resource as it is in the cluster, not as the template wrote it. That includes what
only exists once something has run: a generated name, an assigned IP, a field a
controller fills in.

This is a [property expression](./cel-expressions.md), so expressions must be turned
on for the Application ([Turning them on](./cel-expressions.md#turning-them-on)).
[How Expressions Are Evaluated](./cel-expressions-lifecycle.md) explains when the read
is checked and when it is answered.

## What you can read

| Read | Gives |
|---|---|
| `component.<name>.output.<path>` | the component's workload, the resource its definition calls `output` |
| `component.<name>.outputs.<resource>.<path>` | another resource it renders, by the name its definition or one of its traits gives it in `outputs` |

`<path>` is a path into the live object: `metadata.name`, `spec.replicas`,
`status.loadBalancer.ingress[0].ip`.

```yaml
traits:
  - type: env
    properties:
      env:
        # db is a webservice with an exposed port, so it renders a Service
        DB_SERVICE: '$(component.db.outputs.webserviceExpose.metadata.name)'
```

A resource added by a post-dispatch trait, such as the `service` that `expose` creates,
cannot be read: it is applied only after the workflow finishes.

To see which `outputs` a component type has, look under `outputs:` in its definition:

```bash
vela def get webservice
```

Component reads work in component properties and trait properties. A workflow step
reads a component through the step that deployed it (see
[Expressions in Workflow Steps](./workflow/expressions.md)), and a policy cannot read
one. The full table of what can be read where is on
[Property Expressions](./cel-expressions.md#where-they-work).

### A name with a hyphen

`component.my-db` would be read as `component.my` minus `db`. Read it by index:

```yaml
host: '$(component["my-db"].output.data.host)'
```

Writing it the dotted way is refused, and the message gives the indexed form to use
instead. The same holds for an output with a hyphen in its name, such as a trait
resource called `my-svc`, or the `objects-1` of a `k8s-objects` component:

```yaml
svc: '$(component.db.outputs["my-svc"].metadata.name)'
```

## Waiting for the other component

A reader is not rendered or applied until the component it reads is placed and
healthy. For a plain read beside the reader, the reader is missing from
`status.services` until `db` is healthy, and its step shows why:

| Reader deployed by | Step shows |
|---|---|
| an `apply-component` step | `Pending on DependsOn: db` |
| a `deploy` step | `local///api is waiting dependents` |

 A read that names a cluster or namespace waits with a message instead:

```
waiting for component "db" in local/default to be healthy
```

Once `db` is healthy, `api` renders.

:::caution
A read is answered while the workflow runs. A change to `db` in the Application's spec
runs the workflow again, and `api` gets the new value. A change that happens to `db`
in the cluster afterwards, such as a load balancer IP assigned later, does **not** reach
`api` once the workflow has succeeded: the reader keeps the value it had until the
workflow runs again. Read only what is settled when `db` reports healthy where you can;
[Picking up a later change](#picking-up-a-later-change) covers the rest.
:::

A field that is not in the live object yet, such as a status field before its controller
has written it, makes the read wait too:

```
waiting for component.db.output.status.loadBalancer.ingress: component "db" has no such field yet
```

To render with a fallback instead of waiting, guard the read. A guard counts only when
`has()` tests exactly the path you read, so `has(...ingress)` does not cover
`...ingress[0].ip`. Read below the tested path without naming it, for example with
`filter` and `map`. The list can be empty, and an entry can carry a `hostname` rather
than an `ip`, so check there is an entry with an `ip` before taking the first:

```yaml
endpoint: '$(has(component.db.output.status.loadBalancer.ingress) && component.db.output.status.loadBalancer.ingress.exists(i, has(i.ip)) ? component.db.output.status.loadBalancer.ingress.filter(i, has(i.ip)).map(i, i.ip)[0] : "pending")'
```

The guard only covers the missing field. The reader still waits for `db` to be healthy.

The same holds for a trait's resource: it is read once the component is healthy, and
waits with `has no such field yet` if it is not there yet. A trait in the post-dispatch
stage is the exception: it cannot be read at all.

### Picking up a later change

To pick up a value that changed after the workflow finished, change the Application's
spec. That makes a new revision, and it is the option to reach for.

Or restart the workflow, and the reads run again against the current value:

```bash
vela workflow restart <app>
```

This runs every step again, notifications and approvals included.

### Reads put components in order

A read is a dependency, so you do not need a `dependsOn` for it. The edge is recorded
in the Application's status, with `source: expression`:

```yaml
status:
  dependencies:
    - component: api
      dependsOn: db
      source: expression
```

With a `garbage-collect` policy set to `order: dependency`, that order holds at deletion
too: `db` is only removed once `api` is gone. Without it, both are deleted at once.

```yaml
policies:
  - name: gc
    type: garbage-collect
    properties:
      order: dependency
```

In a workflow, an `apply-component` step for the reader gets a `dependsOn` on the step
named after the producer in `DAG` mode. In `StepByStep` mode, nothing is added, so put
the producer's step first.

:::caution
In `StepByStep`, a reader whose step comes before its producer's waits for ever, with
`waiting for component "db" to be placed in local/<namespace>`. Nothing refuses it on
apply.
:::

Reads that cannot be put in order are refused when you apply the Application:

| Message | Means |
|---|---|
| `component "api" reads its own output (...)` | a component reading itself |
| `components wait on each other in a cycle: db -> api -> db` | reads, `dependsOn` and inputs loop back on each other |
| `component "api" reads component.cache.output..., but the application has no component "cache"` | the name matches no component |

## In another cluster or namespace

A plain read is of the other component **beside** the reader: same cluster, same
namespace. Where a component is deployed to several places, name the one to read:

| Read | Reads `db` |
|---|---|
| `component.db.output...` | beside the reader |
| `component.db.cluster("east").output...` | in cluster `east` (in its one namespace there) |
| `component.db.namespace("data").output...` | in namespace `data`, in the reader's cluster |
| `component.db.cluster("east").namespace("data").output...` | in exactly that place |

```yaml
remote: '$(component.db.cluster("east").output.data.host)'
```

The cluster and namespace go straight after the component name, and they must be
literal strings, so the read is known before anything is evaluated.

:::note
A read beside the reader orders the two components. A read that names a cluster or
namespace does not: the reader just waits, and retries, until `db` is healthy there.
The edge is still recorded in `status.dependencies`, with `cluster` and `namespace`
fields, so seeing it there does not mean it orders anything.
:::

If `db` is in more than one namespace of the cluster you name, the deploy step fails
(and is retried) until you add the namespace:

```
component "db" is in 2 namespaces of cluster "east"; name one with component.db.cluster("east").namespace("<namespace>")
```

A component deployed with replicas (a `replication` policy) can only be read by a
reader with the same replica key.

## Types are checked when you apply

Where the other component's definition says what a field is, the read is typed from it,
and a read that cannot fit the parameter it feeds is refused before anything renders:

```yaml
properties:
  port: '$(component.db.outputs.webserviceExpose.metadata.name)'
```

```
type mismatch: expression $(component.db.outputs.webserviceExpose.metadata.name) is string but component "webservice" parameter expects int.
```

The message names the reader's component type, not its name.

Convert it, or read something that fits:

```yaml
port: '$(int(component.db.output.data.port))'
```

The check only applies where the type is known, and stays out of the way where it
is not. No type is assumed, so the read is admitted, when:

- the field is not one the template writes (`metadata.uid`, a defaulted field, anything
  under `status`);
- one of the component's traits patches its workload (`patch`), or its other resources
  (`patchOutputs`), since the trait may change what is there.

An expression whose result type CEL can tell is typed too: `$(component.db.output.spec.replicas * 2)`
is an int because of the `* 2`, and refused where a string is expected.

A read that is admitted this way and still does not fit fails when the component
renders, as any other expression does. The full set of rules is in
[How a component read is typed](./cel-expressions-lifecycle.md#how-a-component-read-is-typed).

## When something is wrong

Errors common to every expression (escaping, types, `has()`) are on
[Property Expressions](./cel-expressions.md#when-something-is-wrong). These are
particular to component reads. The first four are waits rather than failures: the reader
is held back and tried again, and the first three end on their own:

| Message | Means |
|---|---|
| `waiting for component "db" in local/default to be healthy` | not an error: `db` is not healthy yet, for a read that names a cluster or namespace |
| `waiting for component "db" to be placed in ...` | not an error: `db` has not been deployed there yet |
| `... component "db" has no such field yet` | not an error: the field is not in the live object yet. Guard it to use a fallback |
| `component "api" reads "db" beside it in ..., but "db" is placed only in ...; read it there with ...` | a wait that does not end on its own: `db` is not deployed beside the reader. Use the read the message suggests |
| `... a component whose name has a hyphen is read by index: write ...` | use `component["my-db"]` |
| `cluster and namespace go straight after component.<name>: component.<name>.cluster("...")` | write `component.db.cluster("east").output...`, not `component.db.output.cluster("east")` |
| `cluster() takes a literal string, so the read is known before evaluation` (or `namespace()`) | the cluster or namespace must be a quoted string, not an expression |
| `... read component.db.output or component.db.outputs.<resource> ...` | the path starts with something other than `output` or `outputs` |
| `... but no cluster "east" is registered` | the cluster name is not one KubeVela knows. Check `vela cluster list` |
| `... which post-dispatch trait "..." outputs; it is applied only after the workflow finishes, so the read would wait for ever` | a resource from a post-dispatch trait cannot be read |
| `component "db" is in 2 namespaces of cluster "east"; name one with ...` | the deploy step fails, and is retried, until you add `.namespace(...)` |
| `undeclared reference to 'placements'` | there is no `placements()`. Use `cluster()` and `namespace()` |
| `"component" cannot be read here` | component reads work in component and trait properties only |

## Next

- [Property Expressions](./cel-expressions.md): the language, escaping and guards.
- [Expressions in Workflow Steps](./workflow/expressions.md): reading steps and loop items.
- [Data Passing](./workflow/inputs-outputs.md): the CUE `inputs` and `outputs` this can replace.
- [Reading External Data with Sources](../platform-engineers/source/intro.md): reading data the Application does not own, and when to use a source instead.

{/* PENDING: the Sources links resolve once kubevela.github.io#1469 merges. */}
