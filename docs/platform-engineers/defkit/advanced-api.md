---
title: Advanced API Methods
---

Additional methods used in complex definitions — patch container fields, array builders, field transformations, and collection utilities.

## Patch Container Fields

### `defkit.PatchField()`

Defines a single patch field for container mutation. Chain: `.Strategy(strategy)` (retainKeys, merge, replace), `.NotEmpty()` (reject empty values), `.Description(text)`.

Applies to: **Trait**

```go title="Go — defkit"
defkit.PatchField("image").Strategy("retainKeys").Description("Container image")
```

```cue title="CUE — generated"
// +patchStrategy=retainKeys
image: string
```

### `defkit.PatchFields()`

Groups multiple `PatchField` definitions into a config used in `PatchContainerConfig`.

Applies to: **Trait**

```go title="Go — defkit"
defkit.PatchFields(
    defkit.PatchField("image").Strategy("retainKeys"),
    defkit.PatchField("resources"),
)
// Used with:
tpl.UsePatchContainer(defkit.PatchContainerConfig{
    PatchFields: defkit.PatchFields(...),
})
```

```cue title="CUE — generated"
#PatchParams: {
  image?:     string
  resources?: {...}
}
```

## Resource-Producing Traits

Traits can create new resources (e.g., a Service) instead of patching the workload. Use `tpl.Outputs()` inside the trait template — the same method used in component templates — to emit auxiliary resources.

Applies to: **Trait**

```go title="Go — defkit"
trait := defkit.NewTrait("expose").
    Description("Expose workload via Service").
    AppliesTo("deployments.apps").
    Stage("PostDispatch").
    Params(
        defkit.Int("port").Default(80).Description("Service port"),
        defkit.String("type").Default("ClusterIP").Description("Service type"),
    ).
    Template(func(tpl *defkit.Template) {
        service := defkit.NewResource("v1", "Service").
            Set("metadata.name", defkit.VelaCtx().Name()).
            Set("spec.type", defkit.ParamRef("type")).
            Set("spec.ports[0].port", defkit.ParamRef("port"))
        tpl.Outputs("service", service)
    })
```

```cue title="CUE — generated"
expose: {
    type: "trait"
    annotations: {}
    description: "Expose workload via Service"
    attributes: {
        podDisruptive: false
        stage:         "PostDispatch"
        appliesToWorkloads: ["deployments.apps"]
    }
}
template: {
    outputs: service: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: name: context.name
        spec: {
            type: parameter.type
            ports: [{
                port: parameter.port
            }]
        }
    }
    parameter: {
        // +usage=Service port
        port: *80 | int
        // +usage=Service type
        type: *"ClusterIP" | string
    }
}
```

## Reading Component Context

Traits can inspect the component's output resource using `ContextOutput()`. `.Field(path)` accesses a nested field for use in patches or conditions. `.HasPath(path)` returns a boolean condition — true if the path exists in the output.

Applies to: **Trait**

```go title="Go — defkit"
ref := defkit.ContextOutput()

templateRef := defkit.ContextOutput().Field("spec.template")

hasTemplate := defkit.ContextOutput().HasPath("spec.template")

patch := defkit.NewPatchResource()
patch.If(hasTemplate).
    Set("spec.template.metadata.labels.app", defkit.Lit("test")).
    EndIf()
```

```cue title="CUE — generated"
// .HasPath("spec.template")
context.output.spec.template != _|_

// .Field("spec.template")
context.output.spec.template
```

## Array Builders

### `defkit.NewArray().Item()` / `defkit.NewArrayElement()`

Builds a CUE array literal with explicit items. Use when you need to construct an array value inline (not iterate over params). `NewArrayElement` builds a single object element supporting the same `.Set()`, `.SetIf()` methods as `NewResource`.

```go title="Go — defkit"
defkit.NewArray().Item(
    defkit.NewArrayElement().Set("kind", defkit.Lit("ServiceAccount")),
)

vela := defkit.VelaCtx()
defkit.NewArrayElement().
    Set("name", vela.Name()).
    Set("namespace", vela.Namespace())
```

```cue title="CUE — generated"
[{kind: "ServiceAccount"}]

{name: context.name, namespace: context.namespace}
```

### `defkit.OpenArray()`

Parameter type for an array with open schema (no element type constraint).

```go title="Go — defkit"
defkit.OpenArray("items")
```

```cue title="CUE — generated"
items: [...{...}]
```

### `defkit.DynamicMap()`

Replaces the entire `parameter` block with a dynamic map. When a definition uses `DynamicMap`, the `parameter` schema becomes `[string]: T` rather than a named-field struct.

```go title="Go — defkit"
defkit.DynamicMap().ValueTypeUnion("string | null")
```

```cue title="CUE — generated"
parameter: [string]: string | null
```

## Field Reference & Transformation

### `defkit.ParameterField()` / `defkit.ParamPath()`

`ParameterField` returns the value at a dot-notation path inside `parameter`. `ParamPath` returns a reference that supports `.IsSet()` as a condition.

Applies to: **Template**

```go title="Go — defkit"
defkit.ParameterField("strategy.type")
defkit.ParamPath("podAffinity.required").IsSet()
```

```cue title="CUE — generated"
parameter.strategy.type
parameter.podAffinity.required != _|_
```

### `defkit.FieldRef()`

Inside a `ForEachIn` / `From` iteration context, references a field of the current element by name.

Applies to: **Template**

```go title="Go — defkit"
defkit.ForEachIn(constraints).MapFields(defkit.FieldMap{
    "maxSkew": defkit.FieldRef("maxSkew"),
})
```

```cue title="CUE — generated"
[for v in parameter.constraints {
    maxSkew: v.maxSkew
}]
```

### `defkit.ForEachIn()`

Transforms an array parameter by mapping each element's fields. Returns a CUE list comprehension.

Applies to: **Template**

```go title="Go — defkit"
defkit.ForEachIn(constraints).MapFields(defkit.FieldMap{
    "maxSkew":           defkit.FieldRef("maxSkew"),
    "topologyKey":       defkit.FieldRef("topologyKey"),
    "whenUnsatisfiable": defkit.FieldRef("whenUnsatisfiable"),
})
```

```cue title="CUE — generated"
[for v in parameter.constraints {
    maxSkew:           v.maxSkew
    topologyKey:       v.topologyKey
    whenUnsatisfiable: v.whenUnsatisfiable
}]
```

### `defkit.From()`

Similar to `ForEachIn` but with filter and guard support. `.Filter(cond)` filters elements, `.Guard(cond)` wraps the whole expression in an if-guard.

Applies to: **Template**

```go title="Go — defkit"
defkit.From(privileges).
    Filter(defkit.FieldEquals("scope", "cluster")).
    Guard(privileges.IsSet())
```

```cue title="CUE — generated"
if parameter["privileges"] != _|_ {
    [for v in parameter.privileges
     if v.scope == "cluster" { v }]
}
```

### `defkit.LenGt()`

Returns a condition that is true when the length of an array expression is greater than `n`.

Applies to: **Template**

```go title="Go — defkit"
defkit.LenGt(clusterPrivsRef, 0)
```

```cue title="CUE — generated"
len(_clusterPrivileges) > 0
```
