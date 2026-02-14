---
title: Templates and Resources
---

This page is a deep dive into the Template and Resource builder APIs, expression types, and the collections system.

:::tip
Before reading this section, make sure you've read [Component Definitions](./components.md) for an overview of how templates work in practice.
:::

## The Template Object

The `Template` is the context object passed to the template function. It manages output resources, patches, and helpers.

```go title="template.go"
comp := defkit.NewComponent("test").
    Template(func(tpl *defkit.Template) {
        // tpl is the template context
    })
```

### Template Methods

| Method | Description |
|:-------|:-----------|
| `tpl.Output(resource)` | Set the primary output resource |
| `tpl.Output()` | Get the current primary output |
| `tpl.Outputs("name", resource)` | Add an auxiliary output resource |
| `tpl.Outputs("name")` | Get an existing auxiliary output |
| `tpl.OutputsIf(cond, "name", resource)` | Add a conditional auxiliary output |
| `tpl.Patch()` | Get the patch builder (for traits) |
| `tpl.PatchStrategy("strategy")` | Set patch strategy (e.g., `"retainKeys"`) |

## The Resource Builder

`NewResource` creates a Kubernetes resource builder:

```go title="resource.go"
deploy := defkit.NewResource("apps/v1", "Deployment").
    Set("metadata.name", defkit.VelaCtx().Name()).
    Set("spec.replicas", replicas).
    Set("spec.template.spec.containers[0].image", image)
```

### Path Syntax

| Syntax | Meaning | Example |
|:-------|:--------|:--------|
| `a.b.c` | Nested field access | `"metadata.name"` |
| `a[0]` | Array index | `"spec.containers[0]"` |
| `a[key]` | Bracket access | `"metadata.annotations[app.io/name]"` |

## Values and Literals

Values are things you can assign to fields. There are several types:

### Literal Values

```go
defkit.Lit("hello")    // string literal
defkit.Lit(42)         // int literal
defkit.Lit(true)       // bool literal
defkit.Lit(0.5)        // float literal
```

### Parameter References

Parameters themselves are values -- you pass them directly to `.Set()`:

```go
image := defkit.String("image")
deploy.Set("spec.containers[0].image", image)  // generates: parameter.image
```

Or use `ParamRef` for string-based references:

```go
deploy.Set("metadata.name", defkit.ParamRef("name"))  // generates: parameter.name
```

### Context References

```go
vela := defkit.VelaCtx()
deploy.Set("metadata.name", vela.Name())         // generates: context.name
deploy.Set("metadata.namespace", vela.Namespace()) // generates: context.namespace
```

## Conditional Operations

### SetIf -- Conditional Field

Set a field only when a condition is true:

```go
cpu := defkit.String("cpu").Optional()
deploy.SetIf(cpu.IsSet(), "spec.resources.limits.cpu", cpu)
```

### If/EndIf -- Conditional Block

Group multiple fields under a single condition:

```go
enabled := defkit.Bool("enabled")
cond := defkit.Eq(enabled, defkit.Lit(true))

deploy.If(cond).
    Set("spec.replicas", defkit.Lit(3)).
    Set("metadata.labels.ha", defkit.Lit("true")).
EndIf()
```

### SpreadIf -- Conditional Map Spread

Spread all entries from a map into a field:

```go
labels := defkit.Object("labels")
deploy.SpreadIf(labels.IsSet(), "metadata.labels", labels)
```

### VersionIf -- Conditional API Version

Set the API version based on cluster version:

```go
deploy := defkit.NewResourceWithConditionalVersion("CronJob").
    VersionIf(
        defkit.Lt(defkit.VelaCtx().ClusterVersion().Minor(), defkit.Lit(25)),
        "batch/v1beta1",
    )
```

## Expression Types

Expressions are used in conditions and comparisons.

### Comparison Expressions

```go
defkit.Eq(left, right)   // left == right
defkit.Ne(left, right)   // left != right
defkit.Lt(left, right)   // left < right
defkit.Le(left, right)   // left <= right
defkit.Gt(left, right)   // left > right
defkit.Ge(left, right)   // left >= right
```

### Logical Expressions

```go
defkit.And(cond1, cond2)          // cond1 && cond2
defkit.Or(cond1, cond2)           // cond1 || cond2
defkit.Not(cond)                   // !cond
defkit.And(cond1, cond2, cond3)   // supports multiple conditions
```

### Parameter Conditions

Parameters provide built-in condition methods:

```go
param.IsSet()       // param != _|_ (param exists)
param.NotSet()      // param == _|_ (param absent)
param.Eq(value)     // param == value
param.Gt(value)     // param > value
// ... and more (see Parameter Types)
```

## Collections API

The collections API transforms list parameters into Kubernetes resource arrays.

### Each -- Transform a List

```go
ports := defkit.List("ports")

containerPorts := defkit.Each(ports).
    Filter(defkit.FieldEquals("expose", true)).
    Map(defkit.FieldMap{
        "containerPort": defkit.FieldRef("port"),
        "name":          defkit.FieldRef("name"),
    }).
    Pick("containerPort", "name")

deploy.Set("spec.template.spec.containers[0].ports", containerPorts)
```

### Collection Operations

| Operation | Description | Example |
|:----------|:-----------|:--------|
| `.Filter(pred)` | Keep items matching a predicate | `.Filter(defkit.FieldEquals("expose", true))` |
| `.Map(fieldMap)` | Transform each item | `.Map(defkit.FieldMap{"port": defkit.FieldRef("port")})` |
| `.Pick(fields...)` | Select specific fields | `.Pick("port", "name")` |
| `.Rename(old, new)` | Rename a field | `.Rename("port", "containerPort")` |
| `.Wrap(key)` | Wrap each value in an object | `.Wrap("name")` -- `"x"` becomes `{name: "x"}` |
| `.Flatten()` | Flatten nested arrays | `.Flatten()` |
| `.DefaultField(name, value)` | Add a default field | `.DefaultField("name", defkit.Format("port-%v", defkit.FieldRef("port")))` |

### Field References

| Function | Description |
|:---------|:-----------|
| `defkit.FieldRef("name")` | Reference a field from the source item |
| `defkit.F("name")` | Shorthand alias for `FieldRef` |
| `defkit.LitField("value")` | A literal value (not from source) |
| `defkit.Format("fmt", args...)` | Formatted string with field references |
| `defkit.Nested(fieldMap)` | Create a nested object |
| `defkit.Optional("name")` | Optional field reference (may be absent) |

### Predicates

```go
defkit.FieldEquals("expose", true)   // item.expose == true
defkit.FieldExists("items")          // item.items != _|_
```

## Multi-Source Collections

`FromFields` combines items from multiple named fields within a struct:

```go
volumeMounts := defkit.Object("volumeMounts")

volumes := defkit.FromFields(volumeMounts, "pvc", "configMap", "secret").
    MapBySource(map[string]defkit.FieldMap{
        "pvc": {
            "name":                  defkit.FieldRef("name"),
            "persistentVolumeClaim": defkit.Nested(defkit.FieldMap{"claimName": defkit.FieldRef("claimName")}),
        },
        "configMap": {
            "name":      defkit.FieldRef("name"),
            "configMap": defkit.Nested(defkit.FieldMap{"name": defkit.FieldRef("cmName")}),
        },
    }).
    Dedupe("name")
```

### Multi-Source Operations

| Operation | Description |
|:----------|:-----------|
| `.MapBySource(mappings)` | Apply different transformations per source field |
| `.Pick(fields...)` | Select specific fields from all sources |
| `.Dedupe(key)` | Remove duplicates based on a key field |

## Array Builder

The Array Builder constructs CUE arrays where items have different inclusion rules -- some are always present, some are conditional, and some come from iteration. This is distinct from the Collections API, which *transforms* existing arrays. The Array Builder *constructs* new arrays from scratch.

### Item -- Always-Present Entry

```go title="static_item.go"
cpuMetric := defkit.NewArrayElement().
    Set("type", defkit.Lit("Resource")).
    Set("resource", defkit.NewArrayElement().
        Set("name", defkit.Lit("cpu")))

metrics := defkit.NewArray().Item(cpuMetric)
```

<details>
<summary>Generated CUE output</summary>

```cue
metrics: [{
    type: "Resource"
    resource: name: "cpu"
}]
```

</details>

### ItemIf -- Conditional Entry

Include an item only when a condition is true:

```go title="conditional_item.go"
mem := defkit.Struct("mem").Fields(...).Optional()

memMetric := defkit.NewArrayElement().
    Set("type", defkit.Lit("Resource")).
    Set("resource", defkit.NewArrayElement().
        Set("name", defkit.Lit("memory")))

metrics := defkit.NewArray().
    Item(cpuMetric).
    ItemIf(mem.IsSet(), memMetric)
```

<details>
<summary>Generated CUE output</summary>

```cue
metrics: [
    { type: "Resource", resource: name: "cpu" },
    if parameter.mem != _|_ {
        { type: "Resource", resource: name: "memory" }
    },
]
```

</details>

### ForEach -- Iterated Entries

Produce one item per element in a source array:

```go title="foreach_item.go"
customMetric := defkit.NewArrayElement().
    Set("type", defkit.Lit("Pods")).
    Set("pods", defkit.NewArrayElement().
        Set("metric", defkit.NewArrayElement().
            Set("name", defkit.Reference("m.name"))))

metrics := defkit.NewArray().
    ForEach(podCustomMetrics, customMetric)
```

<details>
<summary>Generated CUE output</summary>

```cue
metrics: [
    for m in parameter.podCustomMetrics {
        type: "Pods"
        pods: metric: name: m.name
    },
]
```

</details>

### ForEachGuarded -- Guarded Iteration

When the source array is optional, wrap the `for` loop with an existence check to avoid iterating over bottom (`_|_`):

```go title="guarded_item.go"
metrics := defkit.NewArray().
    ForEachGuarded(podCustomMetrics.IsSet(), podCustomMetrics, customMetric)
```

<details>
<summary>Generated CUE output</summary>

```cue
metrics: [
    if parameter.podCustomMetrics != _|_ for m in parameter.podCustomMetrics {
        type: "Pods"
        pods: metric: name: m.name
    },
]
```

</details>

### ForEachWith -- Complex Per-Item Logic

When iterated items need conditionals, let bindings, or default values internally, use `ForEachWith` with a callback:

```go title="complex_foreach.go"
ports := defkit.Array("ports").WithFields(...)

modernPorts := defkit.NewArray().ForEachWith(ports, func(item *defkit.ItemBuilder) {
    v := item.Var()
    item.Set("port", v.Field("port"))
    item.Set("targetPort", v.Field("port"))

    // If user provided a name, use it
    item.IfSet("name", func() {
        item.Set("name", v.Field("name"))
    })

    // Otherwise, generate a name with a CUE default
    item.IfNotSet("name", func() {
        nameRef := item.Let("_name",
            defkit.Plus(defkit.Lit("port-"), defkit.StrconvFormatInt(v.Field("port"), 10)))
        item.SetDefault("name", nameRef, "string")
    })
})
```

<details>
<summary>Generated CUE output</summary>

```cue
ports: [for v in parameter.ports {
    port:       v.port
    targetPort: v.port
    if v.name != _|_ {
        name: v.name
    }
    if v.name == _|_ {
        _name: "port-" + strconv.FormatInt(v.port, 10)
        name:  *_name | string
    }
}]
```

</details>

#### ItemBuilder Methods

| Method | Description |
|:-------|:-----------|
| `item.Var()` | Get an `IterVarBuilder` to reference the iteration variable |
| `item.Var().Field("name")` | Reference a field on the iteration variable (`v.name`) |
| `item.Var().Ref()` | Reference the iteration variable itself (`v`) |
| `item.Set(field, value)` | Unconditional field assignment |
| `item.If(cond, fn)` | Conditional block with arbitrary condition |
| `item.IfSet(field, fn)` | Conditional block: `if v.field != _|_` |
| `item.IfNotSet(field, fn)` | Conditional block: `if v.field == _|_` |
| `item.Let(name, value)` | Private binding (`_name: expr`), returns a reference |
| `item.SetDefault(field, value, type)` | CUE default: `field: *value \| type` |
| `item.FieldExists(field)` | Condition: `v.field != _|_` |
| `item.FieldNotExists(field)` | Condition: `v.field == _|_` |

### Combining Entry Types

The real power of `ArrayBuilder` is mixing all entry types in a single array. Here is the HPA trait's metrics array:

```go title="hpa.go"
metrics := defkit.NewArray().
    Item(cpuMetric).                                                         // always present
    ItemIf(mem.IsSet(), memMetric).                                          // only if mem param is set
    ForEachGuarded(podCustomMetrics.IsSet(), podCustomMetrics, customMetric)  // one per custom metric
```

<details>
<summary>Generated CUE output</summary>

```cue
metrics: [
    {
        type: "Resource"
        resource: { name: "cpu", target: { ... } }
    },
    if parameter.mem != _|_ {
        {
            type: "Resource"
            resource: { name: "memory", target: { ... } }
        }
    },
    if parameter.podCustomMetrics != _|_ for m in parameter.podCustomMetrics {
        type: "Pods"
        pods: { metric: name: m.name, target: { ... } }
    },
]
```

</details>

### ArrayConcat -- Concatenate Arrays

Concatenate a built array with a parameter reference using `+`:

```go title="array_concat.go"
mounts := defkit.ArrayConcat(
    defkit.NewArray().Item(
        defkit.NewArrayElement().
            Set("name", defkit.Lit("data")).
            Set("mountPath", defkit.Lit("/data")),
    ),
    defkit.ParamRef("extraVolumeMounts"),
)
```

<details>
<summary>Generated CUE output</summary>

```cue
volumeMounts: [{
    name:      "data"
    mountPath: "/data"
}] + parameter.extraVolumeMounts
```

</details>

### Array Builder Methods Summary

| Method | Description |
|:-------|:-----------|
| `NewArray()` | Create a new array builder |
| `.Item(elem)` | Add an always-present item |
| `.ItemIf(cond, elem)` | Add a conditional item |
| `.ForEach(source, elem)` | Add iterated items |
| `.ForEachGuarded(guard, source, elem)` | Add guarded iterated items |
| `.ForEachWith(source, fn)` | Add iterated items with complex per-item logic |
| `.ForEachWithVar(varName, source, fn)` | Same as `ForEachWith` with custom iteration variable name |
| `ArrayConcat(left, right)` | Concatenate two array values with `+` |

## CUE Import Functions

defkit wraps common CUE standard library functions. These auto-detect the needed import:

```go
// strconv.FormatInt(parameter.port, 10)
defkit.StrconvFormatInt(port, 10)

// strings.ToLower(parameter.name)
defkit.StringsToLower(name)
```

You can also add imports explicitly for any CUE package:

```go
comp.WithImports("strconv", "strings", "list", "math")
```

## What's Next

- [Health and Status](./health-and-status.md) -- Composable health and status expressions
- [Placement](./placement.md) -- Multi-cluster placement constraints
- [Testing](./testing.md) -- Unit testing templates and resources
