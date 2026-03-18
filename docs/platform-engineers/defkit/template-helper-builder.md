---
title: Helper Builder
---

The helper builder allows you to compute derived CUE `let` variables from array parameters — filtering, picking fields, and applying conditionals — without writing raw CUE strings.

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
    if parameter.privileges != _|_ {
        for p in parameter.privileges
        if p.scope == "cluster" { p }
    }
]

let _namespacePrivileges = [
    if parameter.privileges != _|_ {
        for p in parameter.privileges
        if p.scope == "namespace" { p }
    }
]
```

## `defkit.LetVariable(name)`

References a previously registered let binding by name. Use the string returned from `tpl.Helper().Build()` or the name passed to `tpl.AddLetBinding()` as the argument.

```go title="Go — defkit"
mountsArray := tpl.Helper("mountsArray"). /* ... */ .Build()

// Reference the let variable in any Set call
deployment.Set("spec.template.spec.containers[0].volumeMounts",
    defkit.LetVariable("mountsArray"))
```

:::tip
Use `tpl.Helper()` when transforming an array parameter by type discriminator (e.g., volume types). Use `tpl.AddLetBinding()` with `defkit.From()` when filtering by a field value (e.g., scope, category).
:::
