---
title: Helper Builder
---

The helper builder allows you to compute derived CUE `let` variables from array parameters — filtering, picking fields, and applying conditionals — without writing raw CUE strings.

### HelperBuilder Chain Methods

| Method | Description |
|---|---|
| `.From(source Value)` | Sets the source collection to iterate over (e.g. a parameter array). |
| `.FromFields(source, fields...)` | Uses multiple named fields from a single source object. Each field is iterated separately and results combined. |
| `.FromArray(ab *ArrayBuilder)` | Uses an ArrayBuilder directly as the helper's collection. |
| `.FromHelper(helper *HelperVar)` | Chains from another helper's output for multi-step transformations. |
| `.Guard(cond)` | Adds a guard prefix: `[if cond for v in source { ... }]`. Evaluates to empty when false. |
| `.Each(fn func(Value) Value)` | Applies a transformation function to each item. |
| `.Pick(fields...)` | Selects only the named fields from each item. |
| `.PickIf(cond, field)` | Conditionally includes a field when the condition is true. |
| `.Map(mappings FieldMap)` | Transforms each item using a field mapping. |
| `.MapBySource(map[string]FieldMap)` | Applies different mappings depending on which source field the item came from (used with `FromFields()`). |
| `.Filter(pred)` / `.FilterCond(cond)` | Filters items using a predicate or general condition. |
| `.Wrap(key)` | Wraps each item under a new key name. |
| `.Rename(from, to)` | Renames a field in each item. |
| `.Dedupe(keyField)` | Removes duplicate items based on a key field. |
| `.DefaultField(field, default)` | Provides a default value for a field that might be missing. |
| `.AfterOutput()` | Places this helper after the `output:` block in generated CUE. Use when the helper references `context.output`. |
| `.Build() *HelperVar` | Finalizes the helper, registers it with the template, and returns a reference. |

### Helper Construction Helpers

| Function | Description |
|---|---|
| `HelperStruct(fields ...StructFieldDef)` | Constructs a CUE struct value for use inside helper `Each()` callbacks. |
| `HelperField(name, value Value)` | Defines an unconditional field within a `HelperStruct()`. |
| `HelperFieldIf(cond, name, value)` | Defines a conditional field. Generates `if cond { name: value }` inside the struct. |
| `Item() *ItemValue` | References the current iteration item inside `Each()`. Chain `.Get(field)` to access a field. |
| `ItemFieldIsSet(field) Condition` | Returns a condition checking if a field exists on the current item. Generates `v.field != _\|_`. |

### Helper Entry Points on `*Template`

Besides `tpl.Helper(name)` (the general-purpose builder detailed below), `*defkit.Template` exposes three specialized helper constructors for common transformation patterns:

| Method | Description |
|---|---|
| `tpl.Helper(name) *HelperBuilder` | General-purpose helper. Returns a `*HelperBuilder` you configure with the chain methods above, then finalize with `.Build()`. |
| `tpl.StructArrayHelper(name, source)` | Creates a helper that splits a struct parameter's fields into separate typed arrays — one array per field, named by the field. Use when the source parameter has heterogeneous typed sub-arrays (e.g. `volumeMounts: { pvc: [...], configMap: [...] }`). |
| `tpl.ConcatHelper(name, source)` | Creates a helper that concatenates arrays extracted from a `StructArrayHelper` (or similar multi-field source). Chain `.Fields(...)` to specify which fields to join. |
| `tpl.DedupeHelper(name, source)` | Creates a helper that deduplicates items from another helper by a key field. Chain `.ByKey("name")` to pick the dedup key. |

`StructArrayHelper` / `ConcatHelper` / `DedupeHelper` are compositional — typical usage is `StructArrayHelper` to split, `ConcatHelper` to recombine the subset you want, then `DedupeHelper` to collapse duplicates.

## `tpl.Helper(name)`

Builds a CUE `let` variable by transforming an array parameter into a derived list. The helper variable is injected into the template header block and can be referenced in resource `.Set()` calls as `defkit.LetVariable(name)`.

Chain:
1. `.FromFields(param, keys...)` — source parameter and discriminator field values to filter on
2. `.Pick(fields...)` — always include these fields in each output element
3. `.PickIf(cond, field)` — conditionally include a field per element
4. `.Build()` — finalize and register the let binding

Applies to: **Component**

```go title="Go — defkit"
volumeMounts := defkit.Object("volumeMounts")

// Build a derived array picking only mount-relevant fields
mountsArray := tpl.Helper("mountsArray").
    FromFields(volumeMounts, "pvc", "configMap", "secret", "emptyDir", "hostPath").
    Pick("name", "mountPath").
    PickIf(defkit.ItemFieldIsSet("subPath"), "subPath").
    Build()

// Use the helper result in a resource Set call
deployment.Set("spec.template.spec.containers[0].volumeMounts", mountsArray)
```

```cue title="CUE — generated"
// Helper injected as let binding in header
let mountsArray = [
    for _, v in parameter.volumeMounts
    if v.type == "pvc" || v.type == "configMap" || ... {
        name:      v.name
        mountPath: v.mountPath
        if v.subPath != _|_ { subPath: v.subPath }
    }
]

// Resource field using the helper
spec: template: spec: containers: [{
    volumeMounts: mountsArray
}]
```

## `tpl.AddLetBinding(name, value)`

Injects a CUE `let name = expr` binding directly into the template header. Use when the computation is based on a `defkit.From()` pipeline (filter, map, dedupe) and you want to reference the result multiple times via `defkit.LetVariable(name)`.

Applies to: **Component**, **Trait**

```go title="Go — defkit"
privileges := defkit.Array("privileges").Optional()

// Add let bindings for filtered sub-lists
tpl.AddLetBinding("_clusterPrivileges",
    defkit.From(privileges).
        Filter(defkit.FieldEquals("scope", "cluster")).
        Guard(privileges.IsSet()))

tpl.AddLetBinding("_namespacePrivileges",
    defkit.From(privileges).
        Filter(defkit.FieldEquals("scope", "namespace")).
        Guard(privileges.IsSet()))

// Reference the bindings later
clusterPrivsRef := defkit.LetVariable("_clusterPrivileges")
namespacePrivsRef := defkit.LetVariable("_namespacePrivileges")
```

```cue title="CUE — generated"
// Injected at template header
let _clusterPrivileges = [
    if parameter["privileges"] != _|_ for p in parameter.privileges
    if p.scope == "cluster" { p }
]

let _namespacePrivileges = [
    if parameter["privileges"] != _|_ for p in parameter.privileges
    if p.scope == "namespace" { p }
]
```

## `defkit.LetVariable(name)`

References a previously registered let binding by name. `tpl.Helper("name")...Build()` returns a `Value` you can use directly in `.Set()` calls. Use `defkit.LetVariable("name")` when you need to reference the same let binding at a different point in the code by its string name.

```go title="Go — defkit"
mountsArray := tpl.Helper("mountsArray"). /* ... */ .Build()

// Reference the let variable in any Set call
deployment.Set("spec.template.spec.containers[0].volumeMounts",
    defkit.LetVariable("mountsArray"))
```

:::tip
Use `tpl.Helper()` when transforming an array parameter by type discriminator (e.g., volume types). Use `tpl.AddLetBinding()` with `defkit.From()` when filtering by a field value (e.g., scope, category).
:::
