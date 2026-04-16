---
title: Raw CUE Blocks
---

When the fluent builder cannot express the required CUE structure, defkit provides escape hatches to inject raw CUE strings at specific positions in the generated template.

## `tpl.SetRawHeaderBlock()` / `tpl.SetRawOutputsBlock()`

`SetRawHeaderBlock` injects raw CUE at the top of the template body — used for CUE `let` bindings and import aliases that the fluent builder can't express. `SetRawOutputsBlock` injects raw CUE into the outputs section — used for conditional outputs with complex CUE logic (list comprehensions, conditional blocks).

Applies to: **All Definition Types**

```go title="Go — defkit"
// Raw header: let bindings at template top
tpl.SetRawHeaderBlock(`let nameSuffix = {
    if parameter.name != _|_ {"-" + parameter.name}
    if parameter.name == _|_ {""}
}

let serviceMetaName = {
    if parameter.existingServiceName != _|_ {parameter.existingServiceName}
    if parameter.existingServiceName == _|_ {context.name + nameSuffix}
}`)

// Raw outputs: complex conditional output block
tpl.SetRawOutputsBlock(`if (parameter.existingServiceName == _|_) {
    outputs: service: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: name: "\(serviceMetaName)"
        spec: ports: [
            for k, v in parameter.http { port: v }
        ]
    }
}`)
```

```cue title="CUE — generated position"
// SetRawHeaderBlock → injected at TOP of template
let nameSuffix = { ... }
let serviceMetaName = { ... }

output: { ... }        // defkit-generated output

// SetRawOutputsBlock → injected AFTER output block
if (parameter.existingServiceName == _|_) {
    outputs: service: { ... }
}
```

## `tpl.SetRawPatchBlock()`

Injects a raw CUE string as the entire `patch` block for a trait template. Use when the fluent patch builder cannot express the required structure.

Applies to: **Trait**

```go title="Go — defkit"
tpl.SetRawPatchBlock(`patch: spec: template: spec: {
    containers: [{
        name: parameter.containerName
        env: parameter.env
    }]
}`)
```

## `defkit.Reference(cueExpr string)`

Embeds a raw CUE expression as a `Value` that can be passed to `.Set()`, `.SetIf()`, or any other method accepting a `Value`. Use when you need to reference a CUE path, variable, or expression that defkit does not model as a typed `*Param`.

```go title="Go — defkit"
// Reference a CUE path directly
defkit.Reference("parameter.cpu.value")

// Reference a loop variable field
defkit.NewArrayElement().
    Set("name", defkit.Reference("m.name")).
    Set("value", defkit.Reference("m.value"))
```

## `defkit.Lit(value)`

Wraps a Go literal (string, int, bool) as a `Value` for use in `.Set()` calls or condition expressions. Generates a CUE literal — quoted strings, bare integers, or booleans.

```go title="Go — defkit"
resource.Set("spec.type", defkit.Lit("ClusterIP"))
resource.Set("spec.replicas", defkit.Lit(1))
resource.Set("spec.paused", defkit.Lit(false))
```

```cue title="CUE — generated"
spec: type:     "ClusterIP"
spec: replicas: 1
spec: paused:   false
```

## `.RawCUE()` — Definition-Level Raw Template

Injects a raw CUE string as the entire template body of a component definition, bypassing the fluent resource builder entirely. Use when the CUE logic cannot be expressed with the builder DSL (e.g., highly dynamic object iteration). Mutually exclusive with `.Template()`.

Applies to: **Component**

```go title="Go — defkit"
rawBody := `
    outputs: {
        for i, obj in parameter.objects {
            "object-\(i)": obj
        }
    }
`

return defkit.NewComponent("k8s-objects").
    AutodetectWorkload().
    Params(objects).
    RawCUE(rawBody)   // bypasses .Template()
```

```cue title="Raw CUE body injected verbatim"
// The string is placed directly into the
// generated CUE definition file.
// You get full CUE power but lose the
// type-safe builder DSL.
//
// Use RawCUE only when the fluent builder
// cannot express what you need.
```

## When to Use Raw CUE vs the Fluent API

| Situation | Recommended approach |
|---|---|
| Standard field assignments and conditions | Fluent API (`.Set()`, `.SetIf()`, `.If()`) |
| CUE `let` bindings for reuse | `tpl.AddLetBinding()` or `tpl.SetRawHeaderBlock()` |
| List comprehensions (`for k, v in ...`) | `tpl.SetRawOutputsBlock()` or `tpl.SetRawPatchBlock()` |
| Import aliases in CUE templates | `tpl.SetRawHeaderBlock()` |
| Referencing loop variables (`v.field`) | `defkit.Reference("v.field")` |
| Literal values in Set calls | `defkit.Lit(value)` |

:::caution
Raw CUE blocks bypass defkit's type checking and path validation. Prefer the fluent API wherever possible — raw blocks are harder to refactor and may silently produce invalid CUE if the expression string contains errors.
:::
