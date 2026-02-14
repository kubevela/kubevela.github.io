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
