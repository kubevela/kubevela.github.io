---
title: Resource Builder
---

Resource builders are the fluent API for constructing Kubernetes resource manifests in Go. Path syntax supports dot-notation (`spec.replicas`), array indices (`containers[0]`), and bracket notation (`labels[app.oam.dev/name]`).

### Resource Builder Methods

| Method | Description |
|---|---|
| `.Set(path string, value Value)` | Sets a field at the given dot-path to the given value. Supports dot notation (`"metadata.name"`), array indexing (`"spec.containers[0].image"`), and bracket notation. |
| `.SetIf(cond, path, value)` | Conditionally sets a field only when the condition is true. Generates CUE `if cond { path: value }`. |
| `.SpreadIf(cond, path, value)` | Conditionally merges a value into a path. The condition is placed inside the target struct. Use for merging user-provided maps. |
| `.If(cond)` / `.EndIf()` | Opens/closes a conditional block. All `Set()` calls between are wrapped in a single `if cond { ... }`. |
| `.Directive(path, directive)` | Adds a CUE directive comment at the given path (e.g. `Directive("spec.containers", "patchKey=name")`). |
| `.VersionIf(cond, apiVersion)` | Sets the API version conditionally. Use with `NewResourceWithConditionalVersion()` for K8s version differences. |
| `.ConditionalStruct(cond, path, fn)` | Creates a conditional struct block. The closure receives an `*OutputStructBuilder` with `Set()` and `SetIf()`. |

### ArrayBuilder Methods

**Constructor:** `NewArray() *ArrayBuilder`

| Method | Description |
|---|---|
| `.Item(elem)` / `.ItemIf(cond, elem)` | Adds a static / conditional element to the array. |
| `.ForEach(source, elem)` | For-comprehension over a source collection. |
| `.ForEachGuarded(guard, source, elem)` | Guarded comprehension — skips when guard is false. |
| `.ForEachWith(source, fn func(item *ItemBuilder))` | Callback iteration with access to item builder methods. |
| `.ForEachWithVar(varName, source, fn)` | Named variable iteration — access iteration variable by name. |
| `.ForEachWithGuardedFiltered(guard, filter, source, fn)` | Full combo: guarded + filtered comprehension. |
| `.ForEachWithGuardedFilteredVar(varName, guard, filter, source, fn)` | Full combo with named variable. |

**ItemBuilder** (9 methods): `Var()` (access iteration variable via `.Ref()`, `.Field(name)`), `Set(field, value)`, `If(cond, fn)`, `IfSet(field, fn)`, `IfNotSet(field, fn)`, `Let(name, value)`, `SetDefault(field, defValue, typeName)`, `FieldExists(field)`, `FieldNotExists(field)`.

**NewArrayElement**: `.Set(key, value)`, `.SetIf(cond, key, value)`, `.PatchKeyField(field, key, value)`.

**ArrayConcat**: `ArrayConcat(left, right Value)` — CUE list concatenation.

**FromTyped**: `FromTyped(obj runtime.Object) (*Resource, error)`, `MustFromTyped(obj) *Resource` — convert Go K8s objects to Resources.

## Constructors

### `defkit.NewResource(apiVersion, kind string)`

Creates a typed Kubernetes resource builder. Chain `.Set()`, `.SetIf()`, `.If()/.EndIf()`, and `.SpreadIf()` to populate fields. Pass the result to `tpl.Output()` or `tpl.Outputs()`.

```go title="Go — defkit"
vela  := defkit.VelaCtx()
min   := defkit.Int("min").Default(1)
max   := defkit.Int("max").Default(10)

hpa := defkit.NewResource("autoscaling/v1", "HorizontalPodAutoscaler").
    Set("metadata.name", vela.Name()).
    Set("spec.minReplicas", min).
    Set("spec.maxReplicas", max)

tpl.Outputs("hpa", hpa)
```

```cue title="CUE — generated"
outputs: hpa: {
    apiVersion: "autoscaling/v1"
    kind:       "HorizontalPodAutoscaler"
    metadata: name: context.name
    spec: {
        minReplicas: parameter.min
        maxReplicas: parameter.max
    }
}
```

### `defkit.NewResourceWithConditionalVersion(kind string)`

Creates a resource whose `apiVersion` is determined at runtime based on cluster version. Chain `.VersionIf(condition, apiVersion)` clauses. The first matching condition wins.

```go title="Go — defkit"
vela := defkit.VelaCtx()

hpa := defkit.NewResourceWithConditionalVersion("HorizontalPodAutoscaler").
    VersionIf(defkit.Lt(vela.ClusterVersion().Minor(), defkit.Lit(23)), "autoscaling/v2beta2").
    VersionIf(defkit.Ge(vela.ClusterVersion().Minor(), defkit.Lit(23)), "autoscaling/v2").
    Set("metadata.name", vela.Name())
```

```cue title="CUE — generated"
outputs: hpa: {
    apiVersion: {
        if context.clusterVersion.minor < 23 { "autoscaling/v2beta2" }
        if context.clusterVersion.minor >= 23 { "autoscaling/v2" }
    }
    kind: "HorizontalPodAutoscaler"
    metadata: name: context.name
}
```

### ConditionalStruct -- Conditional Output Block

Emit an entire named sub-struct only when a condition is true, with complex conditional fields inside. This is needed when `If/EndIf` would still emit an empty struct `{}`:

```go title="conditional_struct.go"
replConfig := defkit.Object("replicationConfiguration")

output := defkit.NewResource("v1alpha1", "S3").
    Set("spec.region", region).
    ConditionalStruct(replConfig.IsSet(), "spec.replicationConfiguration", func(b *defkit.OutputStructBuilder) {
        b.SetIf(defkit.PathExists("parameter.replicationConfiguration.role"),
            "role",
            defkit.Reference("parameter.replicationConfiguration.role"))
        b.SetIf(existingResources.Eq(false),
            "destinationBucket",
            defkit.Plus(nameWithPrefix, defkit.Lit("-replica")))
    })
```

<details>
<summary>Generated CUE</summary>

```cue
output: {
    apiVersion: "v1alpha1"
    kind: "S3"
    spec: {
        region: parameter.region
    }
}
if parameter["replicationConfiguration"] != _|_ {
    output: spec: {
        replicationConfiguration: {
            if parameter.replicationConfiguration.role != _|_ {
                role: parameter.replicationConfiguration.role
            }
            if parameter.existingResources == false {
                destinationBucket: "tenant-" + parameter.governance.tenantName + "-" + parameter.name + "-replica"
            }
        }
    }
}
```

</details>

:::caution
Use `ConditionalStruct` instead of `If/EndIf` when the entire struct should be absent from the output when the condition is false. `If/EndIf` guards individual fields but still emits the parent struct as an empty `{}`.
:::

## Field Setters

### `.Set()` / `.SetIf()` / `.SpreadIf()`

- `.Set(path, value)` — always sets the field.
- `.SetIf(cond, path, value)` — wraps the assignment in an `if cond` guard.
- `.SpreadIf(cond, path, value)` — spreads a map value into a path conditionally.

```go title="Go — defkit"
image       := defkit.String("image")
annotations := defkit.StringKeyMap("annotations")
labels      := defkit.StringKeyMap("labels")

job := defkit.NewResource("batch/v1", "Job").
    Set("spec.template.spec.containers[0].image", image).
    SetIf(annotations.IsSet(),
        "spec.template.metadata.annotations", annotations).
    SpreadIf(labels.IsSet(),
        "spec.template.metadata.labels", labels)
```

```cue title="CUE — generated"
spec: template: spec: containers: [{
    image: parameter.image
}]
if parameter["annotations"] != _|_ {
    spec: template: metadata: annotations: parameter.annotations
}
if parameter["labels"] != _|_ {
    spec: template: metadata: labels: parameter.labels
}
```

### `.If(cond)` ... `.EndIf()`

Wraps multiple consecutive `.Set()` calls in a single CUE `if cond { ... }` block. Use when several fields should only be set together under the same condition.

```go title="Go — defkit"
cpu    := defkit.String("cpu")
memory := defkit.String("memory")

job := defkit.NewResource("batch/v1", "Job").
    If(cpu.IsSet()).
        Set("spec.template.spec.containers[0].resources.limits.cpu", cpu).
        Set("spec.template.spec.containers[0].resources.requests.cpu", cpu).
    EndIf().
    If(memory.IsSet()).
        Set("spec.template.spec.containers[0].resources.limits.memory", memory).
        Set("spec.template.spec.containers[0].resources.requests.memory", memory).
    EndIf()
```

```cue title="CUE — generated"
if parameter["cpu"] != _|_ {
    spec: template: spec: containers: [{
        resources: {
            limits:   { cpu: parameter.cpu }
            requests: { cpu: parameter.cpu }
        }
    }]
}
if parameter["memory"] != _|_ {
    spec: template: spec: containers: [{
        resources: {
            limits:   { memory: parameter.memory }
            requests: { memory: parameter.memory }
        }
    }]
}
```

## Array Builders

### `defkit.NewArray()` / `defkit.NewArrayElement()`

`defkit.NewArray()` builds a CUE list literal. Chain `.Item(elem)` for always-present elements, `.ItemIf(cond, elem)` for conditional elements, and `.ForEachGuarded(cond, param, template)` to append elements for each value in an array parameter.

`defkit.NewArrayElement()` builds one element object using `.Set()` and `.SetIf()`.

```go title="Go — defkit"
mem := defkit.Struct("mem").Optional()
podCustomMetrics := defkit.Array("podCustomMetrics").Optional()

cpuMetric := defkit.NewArrayElement().
    Set("type", defkit.Lit("Resource")).
    Set("resource", defkit.NewArrayElement().
        Set("name", defkit.Lit("cpu")).
        Set("target", defkit.NewArrayElement().
            Set("type", defkit.Lit("Utilization")).
            Set("averageUtilization", defkit.Reference("parameter.cpu.value"))))

memMetric := defkit.NewArrayElement().
    Set("type", defkit.Lit("Resource")).
    Set("resource", defkit.NewArrayElement().
        Set("name", defkit.Lit("memory")))

customElem := defkit.NewArrayElement().
    Set("name", defkit.Reference("m.name")).
    Set("value", defkit.Reference("m.value"))

metrics := defkit.NewArray().
    Item(cpuMetric).
    ItemIf(mem.IsSet(), memMetric).
    ForEachGuarded(podCustomMetrics.IsSet(), podCustomMetrics, customElem)
```

```cue title="CUE — generated"
[
    {
        type: "Resource"
        resource: {
            name: "cpu"
            target: {
                type: "Utilization"
                averageUtilization: parameter.cpu.value
            }
        }
    },
    if parameter["mem"] != _|_ {
        type: "Resource"
        resource: { name: "memory" }
    },
    if parameter["podCustomMetrics"] != _|_ for m in parameter.podCustomMetrics {
        name: m.name
        value: m.value
    },
]
```

### `defkit.ArrayConcat(left, right Value)`

Concatenates a built array with another value using CUE's `+` operator.

```go title="Go — defkit"
extraMounts := defkit.Array("extraVolumeMounts").Optional()

mounts := defkit.ArrayConcat(
    defkit.NewArray().Item(
        defkit.NewArrayElement().
            Set("name",      defkit.Lit("data")).
            Set("mountPath", defkit.Lit("/data")),
    ),
    defkit.ParamRef("extraVolumeMounts"),
)
```

```cue title="CUE — generated"
volumeMounts: [{
    name:      "data"
    mountPath: "/data"
}] + parameter.extraVolumeMounts
```

### Combining Entry Types

The real power of `ArrayBuilder` is mixing all entry types in a single array:

```go title="Go — defkit"
metrics := defkit.NewArray().
    Item(cpuMetric).
    ItemIf(mem.IsSet(), memMetric).
    ForEachGuarded(podCustomMetrics.IsSet(), podCustomMetrics, customElem)
```

```cue title="CUE — generated"
metrics: [
    {
        type: "Resource"
        resource: { name: "cpu", target: { ... } }
    },
    if parameter["mem"] != _|_ {
        type: "Resource"
        resource: { name: "memory" }
    },
    if parameter["podCustomMetrics"] != _|_ for m in parameter.podCustomMetrics {
        name: m.name
        value: m.value
    },
]
```

## ForEachWith / ItemBuilder

See [ForEachWith / ItemBuilder](./foreach-item-builder.md) for the per-element builder pattern.

## List Comprehensions

### `defkit.Each(param)` / `defkit.From(param)` / `defkit.ForEachIn(expr)`

Three ways to build CUE list comprehensions from array parameters.

- `defkit.Each()` — iterates a parameter and maps each item using `.Map(FieldMap)`.
- `defkit.From()` — supports chained transformations: `.Filter(cond)`, `.Map(FieldMap)`, `.Dedupe(field)`, `.Guard(cond)`.
- `defkit.ForEachIn()` — iterates a `LetVariable` (for let-bound arrays) using `.MapFields(FieldMap)`.

```go title="Go — defkit"
volumes    := defkit.List("volumes")
privileges := defkit.Array("privileges").Optional()
privRef    := defkit.LetVariable("_privileges")

mountMap := defkit.Each(volumes).Map(defkit.FieldMap{
    "mountPath": defkit.FieldRef("mountPath"),
    "name":      defkit.FieldRef("name"),
})

filtered := defkit.From(privileges).
    Filter(defkit.FieldEquals("scope", "cluster")).
    Guard(privileges.IsSet())

rules := defkit.ForEachIn(privRef).MapFields(defkit.FieldMap{
    "verbs":     defkit.FieldRef("verbs"),
    "resources": defkit.FieldRef("resources"),
})
```

```cue title="CUE — generated"
// defkit.Each
[for v in parameter.volumes {
    mountPath: v.mountPath
    name:      v.name
}]

// defkit.From with filter + guard
if parameter["privileges"] != _|_ {
    [for p in parameter.privileges if p.scope == "cluster" { p }]
}

// defkit.ForEachIn (iterates let variable)
[for r in _privileges {
    verbs:     r.verbs
    resources: r.resources
}]
```

## Field Helpers

### `defkit.FieldRef(name)` / `defkit.FieldMap{}` / `defkit.FieldEquals(field, value)`

- `defkit.FieldRef(name)` — references the named field from the current iteration element.
- `defkit.FieldMap` — a `map[string]Value` specifying field-to-value mappings for comprehension output.
- `defkit.FieldEquals(field, value)` — produces a filter predicate for `defkit.From().Filter()`.

```go title="Go — defkit"
defkit.FieldRef("name")
defkit.FieldRef("mountPath")

defkit.FieldMap{
    "verbs":           defkit.FieldRef("verbs"),
    "apiGroups":       defkit.FieldRef("apiGroups"),
    "nonResourceURLs": defkit.FieldRef("nonResourceURLs"),
}

privileges := defkit.Array("privileges").Optional()
filtered := defkit.From(privileges).
    Filter(defkit.FieldEquals("scope", "cluster"))
```

```cue title="CUE — generated"
[for item in list {
    name:      item.name
    mountPath: item.mountPath
}]

[for r in list {
    verbs:           r.verbs
    apiGroups:       r.apiGroups
    nonResourceURLs: r.nonResourceURLs
}]

[for p in parameter.privileges if p.scope == "cluster" { p }]
```

## Helper Builder

### `tpl.Helper(name string)`

Builds a CUE `let` variable by transforming an array parameter into a derived list. The helper variable is injected into the template header block and can be referenced via `defkit.LetVariable(name)`.

Chain: `.FromFields(param, keys...)` → `.Pick(fields...)` / `.PickIf(cond, field)` → `.Build()`.

```go title="Go — defkit"
volumeMounts := defkit.Object("volumeMounts")

mountsArray := tpl.Helper("mountsArray").
    FromFields(volumeMounts, "pvc", "configMap", "secret", "emptyDir", "hostPath").
    Pick("name", "mountPath").
    PickIf(defkit.ItemFieldIsSet("subPath"), "subPath").
    Build()

deployment.Set("spec.template.spec.containers[0].volumeMounts", mountsArray)
```

```cue title="CUE — generated"
let mountsArray = [
    for _, v in parameter.volumeMounts
    if v.type == "pvc" || v.type == "configMap" || ... {
        name:      v.name
        mountPath: v.mountPath
        if v.subPath != _|_ { subPath: v.subPath }
    }
]

spec: template: spec: containers: [{
    volumeMounts: mountsArray
}]
```

### `tpl.AddLetBinding(name string, value Value)`

Injects a CUE `let name = expr` binding directly into the template header.

```go title="Go — defkit"
privileges := defkit.Array("privileges").Optional()

tpl.AddLetBinding("_clusterPrivileges",
    defkit.From(privileges).
        Filter(defkit.FieldEquals("scope", "cluster")).
        Guard(privileges.IsSet()))

tpl.AddLetBinding("_namespacePrivileges",
    defkit.From(privileges).
        Filter(defkit.FieldEquals("scope", "namespace")).
        Guard(privileges.IsSet()))

clusterPrivsRef := defkit.LetVariable("_clusterPrivileges")
namespacePrivsRef := defkit.LetVariable("_namespacePrivileges")
```

```cue title="CUE — generated"
let _clusterPrivileges = [
    if parameter["privileges"] != _|_ for p in parameter.privileges
    if p.scope == "cluster" { p }
]

let _namespacePrivileges = [
    if parameter["privileges"] != _|_ for p in parameter.privileges
    if p.scope == "namespace" { p }
]
```
