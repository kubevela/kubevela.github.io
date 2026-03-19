---
title: Complex Parameter Types
---

Complex types compose multiple fields or variant shapes into a single parameter. They cover nested objects, discriminated unions, and closed struct disjunctions.

## `defkit.Struct()`

An inline struct type with named fields. Conventionally used as the element type inside `Array.Of()`. Can nest other parameter types including other Structs.

```go title="Go — defkit"
ports := defkit.Array("ports").Optional().WithFields(
    defkit.Field("containerPort", defkit.ParamTypeInt),
    defkit.Field("protocol", defkit.ParamTypeString).Values("TCP", "UDP").Default("TCP"),
    defkit.Field("name", defkit.ParamTypeString).Optional(),
)
```

```cue title="CUE — generated"
ports?: [...{
    containerPort?: int
    protocol:       *"TCP" | "UDP"
    name?:          string
}]
```

## `defkit.Object()`

A structured object with a known set of named fields. Use `.WithFields()` to specify the field parameter definitions. Prefer `Struct` when used as an element type inside `Array.Of()`.

```go title="Go — defkit"
resources := defkit.Object("resources").WithFields(
    defkit.Object("limits").WithFields(
        defkit.String("cpu").Default("500m"),
        defkit.String("memory").Default("256Mi"),
    ),
    defkit.Object("requests").WithFields(
        defkit.String("cpu").Default("100m"),
        defkit.String("memory").Default("128Mi"),
    ),
)
```

```cue title="CUE — generated"
resources?: {
    limits?: {
        cpu:    *"500m"  | string
        memory: *"256Mi" | string
    }
    requests?: {
        cpu:    *"100m"  | string
        memory: *"128Mi" | string
    }
}
```

## `defkit.Map()`

A generic map parameter with configurable value types. Use `StringKeyMap` for the common string-to-string case. `Map` is more flexible but generates a less specific CUE type.

```go title="Go — defkit"
labels      := defkit.Map("labels").Description("Labels to apply")
annotations := defkit.Map("annotations").Optional()
```

```cue title="CUE — generated"
labels?:      {...}
annotations?: {...}
```

## `defkit.OneOf()`

A discriminated union — the parameter must match exactly one of the declared variant schemas. Use `.Discriminator(field)` to specify the distinguishing field name and `.Variants()` to list the variant schemas. Maps to a CUE disjunction of struct types.

```go title="Go — defkit"
// With Discriminator
storage := defkit.OneOf("storage").
    Discriminator("type").
    Variants(
        defkit.Variant("pvc").WithFields(
            defkit.Field("size", defkit.ParamTypeString),
            defkit.Field("storageClass", defkit.ParamTypeString).Optional(),
        ),
        defkit.Variant("emptyDir").WithFields(
            defkit.Field("sizeLimit", defkit.ParamTypeString).Optional(),
        ),
    )

// Simple variant union
source := defkit.OneOf("source").Variants(
    defkit.Variant("git").WithFields(
        defkit.Field("url", defkit.ParamTypeString),
        defkit.Field("branch", defkit.ParamTypeString).Default("main"),
    ),
    defkit.Variant("image").WithFields(
        defkit.Field("ref", defkit.ParamTypeString),
    ),
)
```

```cue title="CUE — generated"
// With Discriminator — generates enum disjunction + conditional blocks
storage?: "pvc" | "emptyDir"
if storage == "pvc" {
    size?:         string
    storageClass?: string
}
if storage == "emptyDir" {
    sizeLimit?: string
}

// Simple variant union
source?: "git" | "image"
if source == "git" {
    url?:    string
    branch:  *"main" | string
}
if source == "image" {
    ref?: string
}
```

## ParamType Constants and `defkit.Field()`

`defkit.Field(name, paramType)` creates a named field for use inside `Struct.WithFields()`. `paramType` is one of the `ParamType*` constants. This is an alternative to calling constructors like `defkit.String(name)` directly and is useful when building struct schemas programmatically.

| Constant | CUE Type |
|---|---|
| `defkit.ParamTypeString` | `string` |
| `defkit.ParamTypeInt` | `int` |
| `defkit.ParamTypeBool` | `bool` |
| `defkit.ParamTypeFloat` | `float` |

```go title="Go — defkit"
resources := defkit.Struct("resources").WithFields(
    defkit.Field("cpu",    defkit.ParamTypeString).Default("100m"),
    defkit.Field("memory", defkit.ParamTypeString).Default("128Mi"),
    defkit.Field("gpu",    defkit.ParamTypeInt).Optional(),
).Description("Resource requirements")

// Field also supports modifiers:
defkit.Field("name",  defkit.ParamTypeString)
defkit.Field("port",  defkit.ParamTypeInt).Default(8080)
defkit.Field("debug", defkit.ParamTypeBool).Default(false)
```

```cue title="CUE — generated"
// +usage=Resource requirements
resources?: {
    cpu:    *"100m"  | string
    memory: *"128Mi" | string
    gpu?:   int
}

name:   string
port:   *8080  | int
debug:  *false | bool
```
