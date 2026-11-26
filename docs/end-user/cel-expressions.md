---
title: Property Expressions
description: Compute an Application's property values from the cluster, the platform's data, other components and earlier workflow steps, with $( ) expressions in CEL.
---

A property value often depends on something the Application does not hold: the
cluster it lands on, a registry the platform team picks, the host of a database
deployed beside it, the image an earlier step built. A **property expression** says
where to get it. Write `$( ... )` inside a string property, and when the Application
renders, the result replaces it:

```yaml
components:
  - name: web
    type: webservice
    properties:
      image: '$(has(source.registry.data.image) ? source.registry.data.image : "nginx:1.27")'
      region: "$(context.cluster)"
```

The same Application then works in every environment, and when the value changes
upstream, nobody edits the Application.

What an expression can read:

| Root | Reads | Covered in |
|---|---|---|
| `context.<field>` | what is being rendered: app name, namespace, cluster, labels | [below](#what-context-offers) |
| `source.<binding>.<path>` | a value fetched by one of your `spec.sources[]` | [Sources](../platform-engineers/source/using-sources.md) |
| `component.<name>.output.<path>`, `component.<name>.outputs.<resource>.<path>` | another component of the Application, live once it is healthy | [Reading Other Components](./reading-components.md) |
| `steps.<name>.outputs.<output>`, `steps.<name>.phase`, ... | an earlier workflow step's output or status | [Expressions in Workflow Steps](./workflow/expressions.md) |
| `each.item`, `each.index`, `each.key` | the current item of a forEach loop | [Expressions in Workflow Steps](./workflow/expressions.md#reading-the-loop-item) |

A source binding name must be an identifier: `$(source.cluster-info.x)` reads as a
subtraction, so name it `clusterInfo`. Reading a hyphenated binding gives only a bare
`undeclared reference to 'info'`, so check the name first when you see one.

Not every root is readable everywhere; [Where they work](#where-they-work) has the
table.

Inside the brackets is [CEL](https://github.com/google/cel-spec), the language
Kubernetes uses for CRD validation rules and admission policies. The core language is
the same; the functions on offer are CEL's standard ones plus its strings and lists
extensions, listed under [What you can write](#what-you-can-write). Kubernetes' own
additions, such as `quantity()` or `url()`, are not available.

[How Expressions Are Evaluated](./cel-expressions-lifecycle.md) follows an expression
from the moment you apply it to the rendered resource.

## Turning them on

`$(VAR)` already means something in Kubernetes: it is how a container's `env`,
`command` and `args` refer to another environment variable. If every property were
read as an expression, Applications that use `$(VAR)` today would quietly change
meaning. So expressions are something you ask for, and an existing Application keeps
meaning what it always meant.

On a cluster where nobody has enabled them, `$(context.cluster)` reaches the rendered
resource as that literal text.

There are three states, and your platform team picks one with two Helm values on
the vela-core chart, `featureGates.enableCelExpressions` and
`featureGates.requireCelExpressionOptIn`:

| State | `EnableCelExpressions` | `RequireCelExpressionOptIn` | Expressions evaluated in |
|---|---|---|---|
| Off (default) | `false` | (ignored) | no Application |
| Opt-in | `true` | `true` (default) | only Applications with the annotation |
| On | `true` | `false` | every Application |

The gates are published in the `kubevela-feature-gates` ConfigMap in `vela-system`, but
reading it needs permissions an Application author usually does not have. Ask your
platform team which state the cluster is in; they can check it with
`kubectl get configmap kubevela-feature-gates -n vela-system -o yaml`. If you try an
expression anyway,
an Application that reads a source finds out on apply: the error names the switch that
is off. A plain expression with expressions off is not an error; it reaches the
resource as literal text.

In opt-in, which is what you will usually meet, ask for expressions by annotation:

```yaml
metadata:
  name: my-app
  annotations:
    app.oam.dev/cel-expressions: "true"
```

Any value other than `"true"` leaves the Application's properties as they were. An
Application that declares `spec.sources` without opting in is refused outright, since
its sources could never be read.

The annotation is per Application because what you are opting in to is a new
reading of your own property values. Only you know whether any of them mean
`$(VAR)` in the Kubernetes sense.

Not sure whether a particular `$( )` will be evaluated? The full path, from gate to
annotation to escaping, is in [How Expressions Are Evaluated](./cel-expressions-lifecycle.md).

## Escaping `$(` {#escaping}

A property that means a shell substitution or a Kubernetes variable, rather than
an expression, says so with `$$(`:

```yaml
properties:
  cmd: ["sh", "-c", "echo $$(hostname)"]
  env:
    - name: ADDR
      value: "$$(SERVICE_HOST):$$(SERVICE_PORT)"   # Kubernetes expands this
    - name: IMAGE
      value: "$(source.registry.data.image)"       # the source resolves this
```

`$$(` renders as a literal `$(`, so the container sees what you would have
written. Only `$$(` is special: a bare `$`, or `$$HOME` with no bracket, is
ordinary text.

This only matters once expressions are running, and the two go together: with
expressions off, `$$(VAR)` reaches Kubernetes as written, and Kubernetes reads `$$(` as
its own escape for a literal `$(VAR)`, so the variable silently stops expanding. Escape
too early and it breaks; escape too late and it is refused. When you add the
annotation to an existing Application, do it in one change:

1. Find every property that uses `$(VAR)` for a container variable or a shell command.
2. Escape each one as `$$(VAR)`.
3. Add the annotation.

Miss one and you are told when you apply, not when the container starts. The
Application is refused rather than mangled, so nothing reaches the cluster
half-expanded:

```
"spec.components[0].properties.cmd[2]": ERROR: <input>:1:1: undeclared reference to 'hostname' (in container '')
```

To find what would need escaping across the cluster:

```bash
kubectl get applications -A -o json | jq -r '
  .items[] | "\(.metadata.namespace)/\(.metadata.name)" as $app
  | .spec | .. | strings
  | select(test("(^|[^$])\\$\\((?!\\s*(context|source|component|steps|each)\\b)"))
  | "\($app): \(.)"'
```

It prints `namespace/app: value` for every unescaped `$(` that does not start with an
expression root, shell substitutions with arguments such as `$(cat /etc/x)` included.
It reads each Application's `spec` only, so it will not see a value that arrives from
a Helm chart or a definition's own template. It also prints real expressions that start
with a function or a literal, such as `$(has(source.x) ? ...)`, so read each line before
escaping it.

## What you can write

| | |
|---|---|
| Operators | `+ - * / %`, `== != < <= > >=`, `&& \|\| !`, `x ? a : b`, `in` |
| Macros | `has`, `all`, `exists`, `exists_one`, `map`, `filter` |
| Strings | `startsWith` `endsWith` `contains` `matches` `size` `split` `join` `replace` `substring` `trim` `indexOf` `lastIndexOf` `charAt` `format` `lowerAscii` `upperAscii` `reverse` `strings.quote` |
| Lists | indexing, `size`, `slice`, `+`, `sort` `sortBy` `distinct` `flatten` `reverse` `lists.range` |
| Conversions | `int` `uint` `double` `string` `bool` `bytes` `dyn` `duration` `timestamp` |

The rest of CEL's standard library works too, such as `type()` and the timestamp and
duration accessors (`getFullYear`, `getHours`, `getSeconds`). What is not there is refused
with `undeclared reference`: Kubernetes' CEL libraries (`isSorted`, `sum`, `quantity`,
`ip`, `sets.*`), `math.*`, `base64.*`, `cel.bind` and `optional.*`:

```
ERROR: <input>:1:25: undeclared reference to 'quantity'
```

### Combining and reshaping

Expressions join with text and with each other:

```yaml
host: "$(source.db.host):$(source.db.port)"
```

A struct or a list has no string form, so it cannot be joined to text. Read a
field out of it, or turn it into one:

```yaml
# a list of structs to a list of scalars
admins: '$(source.catalog.members.filter(m, m.role == "admin").map(m, m.name))'

# ...and then to text
label: '$(source.catalog.members.map(m, m.name).join(","))'

# text, taken apart
env: '$(source.catalog.release.split("-")[0].lowerAscii())'

# a value chosen by a condition
replicas: '$(source.catalog.lifecycle == "production" ? 3 : 1)'
```

:::caution
Iterating a map has no defined order. `source.cfg.data.map(k, ...)` returns the
keys in a different order each time, so a property built that way changes between
reconciles and the resource is rewritten every pass. Sort the result
(`source.cfg.data.map(k, k).sort()`), iterate a list, or read the keys you want by
name.
:::

### Types

A property that is nothing but an expression keeps the expression's type, so
`replicas: "$(source.scale.count)"` yields an int even though YAML carried it as a
string. An expression with text around it can only produce a string, because that
is what concatenation means.

Surrounding whitespace does not count as text, and is dropped, so a stray trailing
space will not silently flip an int to a string: `"  $(source.r.count) "` is the int
`3`.

Types are checked when you submit the Application, against the parameter you are
feeding:

```
"spec.components[0].properties.port": type mismatch: expression
$(source.r.data.replicas) is string but component "webservice" parameter
expects int.
```

What a read's type is comes from where it reads: a source from its SourceDefinition's
schema, a component from its definition's output (see
[Types are checked when you apply](./reading-components.md#types-are-checked-when-you-apply)),
and a loop item from the items listed. A read whose type is not known at admission, such as
anything under `steps`, fits any parameter when you apply. A wrong one then fails the
step that renders it, with CUE's message rather than the expression's:

```
function call error for msg: cue: marshal error: msg.$params.message: conflicting values string and 5 (mismatched types string and int)
```

A ConfigMap's `data` really is `[string]: string`, so convert:

```yaml
port: "$(int(source.cfg.data.replicas))"
```

:::tip
Better still, ask the platform team to declare the field as an `int` in the
SourceDefinition. It then reads correctly for everyone and a bad value is caught
at fetch time rather than in each Application.
:::

### Values that might be missing

An optional field, or a key in an open map like a ConfigMap's `data`, needs a
guard: a test that it is there and something to use when it is not.

```yaml
image: '$(has(source.registry.data.image) ? source.registry.data.image : "nginx:latest")'
```

Feed one unguarded to a required parameter and admission tells you exactly what to
write:

```
"spec.components[0].properties.image": source.r.optional may be absent and feeds
required component "webservice" parameter; guard it with
has(source.r.optional) ? source.r.optional : <fallback>.
```

Feed one unguarded anywhere else and it still fails, but less helpfully, so it is
worth guarding every read of a value that may be absent:

```
resolve source expressions for component web: no such key: optional
```

A value can also be present but `null`, such as a field set to `null` or a step output
that came back empty. `has()` counts it as present, so guard both:

```yaml
image: '$(has(source.r.data.image) && source.r.data.image != null ? source.r.data.image : "nginx:latest")'
```

An unguarded `null` reaches a whole-value property as `null`. Inside text it is refused
when the Application renders, as a list or a map is, naming the read:

```
"source.r.data.image" is null, which text cannot embed; guard it, for example has(x) && x != null ? x : "none"
```

`has()` only works on plain identifiers. A key with a dot or a slash in it, which
is most labels and annotations, is tested with `in`:

```yaml
team: '$("platform.io/team" in source.meta.labels ? source.meta.labels["platform.io/team"] : "unowned")'
```

:::tip
Use single quotes in YAML when the fallback contains double quotes.
:::

## Where they work {#where-they-work}

| Location | `context` | `source` | `component` | `steps` | `each` |
|---|---|---|---|---|---|
| Component properties | ✔ | [✔](../platform-engineers/source/using-sources.md) | [✔](./reading-components.md) | ✘ | ✘ |
| Trait properties | ✔ | [✔](../platform-engineers/source/using-sources.md) | [✔](./reading-components.md) | ✘ | ✘ |
| Workflow step properties | ✔ | [✔](../platform-engineers/source/using-sources.md) | ✘ | [✔](./workflow/expressions.md#reading-another-step) | [in a loop](./workflow/expressions.md#reading-the-loop-item) |
| A workflow step's `if` | ✔ | [✔](../platform-engineers/source/using-sources.md) | ✘ | [✔](./workflow/expressions.md#conditions) | [in a loop body](./workflow/expressions.md#conditions-in-loops) |
| A workflow step's `forEach.items` | ✔ | [✔](../platform-engineers/source/using-sources.md) | ✘ | [✔](./workflow/expressions.md#reading-another-step) | ✘ |
| A later `spec.sources[]` entry | ✔ | [✔](../platform-engineers/source/using-sources.md#chain-sources) | ✘ | ✘ | ✘ |
| A policy with its own CUE definition | ✔ | [✔](../platform-engineers/source/using-sources.md) | ✘ | ✘ | ✘ |
| Built-in policies (`topology`, `override`, `garbage-collect` and the rest) | ✔ | ✘ | ✘ | ✘ | ✘ |
| Application-scoped policies | ✔ | ✘ | ✘ | ✘ | ✘ |

Each gap has a reason:

- **`component` only in components and traits.** A component's render can wait for
  another to be healthy. A step reads a component through the step that deployed it,
  and a policy is consumed before anything is deployed.
- **`steps` and `each` only in the workflow.** Only a step has steps before it, and
  only a loop has a current item.
- **No `source` in built-in or Application-scoped policies.** Those are consumed before
  or outside any render, so there is nothing to fetch a source through. They can still
  read `context`.

A standalone `WorkflowRun` has no `source` or `component` at all; see
[Standalone WorkflowRun](./workflow/expressions.md#workflowrun).

### What `context` offers

Not every field exists everywhere, because not every render knows the same
things. A workflow step has no component; a policy rendered once for the hub has
no per-cluster placement.

| Field | Where |
|---|---|
| `appName` `namespace` `appNamespace` `appLabels` `appAnnotations` `appRevision` `appRevisionNum` | everywhere |
| `cluster` `publishVersion` `workflowName` | components, traits, workflow steps, rendered policies |
| `clusterVersion` | those, and Application-scoped policies |
| `custom` | everywhere but built-in policies: what an Application-scoped policy published |
| `componentName` `componentType` `revision` `replicaKey` | components and traits |
| `traitType` | traits |
| `stepName` `stepType` | workflow steps |
| `policyName` `policyType` | policies |
| `policyRevisionName` `policyRevisionHash` `policyRevision` | Application-scoped policies |
| `name` | components and traits (the component), workflow steps (the step), rendered policies (the policy) |

`namespace` is the namespace being rendered for, so it is the one a topology policy
places the component in; `appNamespace` is always the Application's own.

A later `spec.sources[]` entry has no context of its own: it is checked against the
context of each location that consumes it.

A field is offered by location, so `context.traitType` is a string in a trait's
properties and refused in a component's. Reading a field where it does not
exist is refused at admission, naming the field:

```
"spec.components[0].properties.image": ERROR: <input>:1:8: undefined field 'stepName'
```

## When something is wrong

These apply to every expression. Errors particular to one root are on its page:
[Sources](../platform-engineers/source/caching-and-operations.md#common-failures),
[Reading Other Components](./reading-components.md#when-something-is-wrong) and
[Expressions in Workflow Steps](./workflow/expressions.md#when-something-is-wrong).

| Message | Means |
|---|---|
| `undeclared reference to 'hostname'` (or any name you did not write) | a `$(` that was not meant as an expression. Escape it as `$$(` |
| `empty expression` / `unterminated expression: no closing ')'` | a `$(` with no expression, or no closing bracket, as in `"price $(5"`. Escape it as `$$(` |
| `undefined field 'stepName'` | that `context` field is not offered here. See [What `context` offers](#what-context-offers) |
| `undeclared reference to 'quantity'` | that function is not offered. See [What you can write](#what-you-can-write) |
| `source expressions are not enabled on this cluster; an operator enables them with the EnableCelExpressions feature gate` | the platform has not turned expressions on, and the Application declares sources |
| `this Application has not opted in to source expressions` | add the `app.oam.dev/cel-expressions: "true"` annotation |
| `may be absent and feeds required ... parameter` | guard it: `has(x) ? x : <fallback>` |
| `no such key: x` | an unguarded read of something absent, somewhere the guard check does not reach |
| `type mismatch: ... is string but ... expects int` | convert it with `int(...)` |
| `invalid argument to has() macro` | `has()` on a bracketed key. Use `"key" in map` instead |
| `cannot be combined with text` / `which text cannot embed` | a struct, list or `null` inside text. Read a field, `join()` a list, or guard a value that may be `null` |
| `each is only set inside a forEach body` | `each` in a workflow step outside a loop body, in `forEach.items`, or in a loop's own `if` |
| `"source" cannot be read here` (or `"component"`, `"steps"`, `"each"`) | that root is not offered in this location. See [Where they work](#where-they-work) |

## Next

- [Reading External Data with Sources](../platform-engineers/source/using-sources.md): where `source` values come from.
- [Reading Other Components](./reading-components.md): reading a component deployed beside this one.
- [Expressions in Workflow Steps](./workflow/expressions.md): steps, loop items and `$( )` conditions.
- [How Expressions Are Evaluated](./cel-expressions-lifecycle.md): what is checked when, and what is resolved when.

{/* PENDING: the Sources links resolve once kubevela.github.io#1469 merges. */}
