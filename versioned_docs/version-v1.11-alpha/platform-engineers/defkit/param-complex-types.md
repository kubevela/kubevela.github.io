---
title: Complex Parameter Types
---

Complex types compose multiple fields or variant shapes into a single parameter. They cover nested objects and discriminated unions.

## `defkit.Struct()`

A named struct parameter with typed fields. Use `.WithFields()` with `defkit.Field()` constructors to specify the schema. Commonly used as a named top-level parameter for structured sub-objects.

### StructField Methods (via `Field(name, type)`)

| Method | Description |
|---|---|
| `.Required()` / `.Optional()` | Marks the field within the struct as required (`field!: type`) or optional (`field?: type`). |
| `.Default(value)` | Sets a default value for the field. Generates `*value \| type`. |
| `.Description(desc)` | Sets the field's description shown in `vela show`. Generates `// +usage=desc`. |
| `.Nested(s *StructParam)` | Makes this field's type a nested struct with its own fields, creating hierarchical parameter schemas. |
| `.WithSchemaRef(ref)` | References an external CUE type definition for this field (e.g. `"#VolumeConfig"`). |
| `.Values(values ...string)` | Restricts this string field to a fixed set of enum values. Generates `field: "a" \| "b"`. |
| `.Of(elemType ParamType)` | Sets the element type when this field is an array type. Generates `field: [...string]`. |

```go title="Go — defkit"
resources := defkit.Struct("resources").WithFields(
    defkit.Field("cpu",    defkit.ParamTypeString).Default("100m"),
    defkit.Field("memory", defkit.ParamTypeString).Default("128Mi"),
    defkit.Field("gpu",    defkit.ParamTypeInt).Optional(),
).Description("Resource requirements")
```

```cue title="CUE — generated"
// +usage=Resource requirements
resources?: {
    cpu:    *"100m"  | string
    memory: *"128Mi" | string
    gpu?:   int
}
```

To create an **array of structs**, use `Array.WithFields()` directly — pass `Param` constructors (not `Field()`):

```go title="Go — defkit"
ports := defkit.Array("ports").Optional().WithFields(
    defkit.Int("containerPort"),
    defkit.String("protocol").Values("TCP", "UDP").Default("TCP"),
    defkit.String("name").Optional(),
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

A discriminated union — the parameter must match exactly one of the declared variant schemas. The **param name** becomes the CUE enum field; `.Variants()` lists the allowed values and their associated fields. Generates a CUE enum field plus conditional `if` blocks for each variant's fields at the same schema level.

`.Discriminator(field)` is available for tooling/metadata purposes but does not affect CUE output — the param name is always used as the enum field name.

### OneOf / Variant / ClosedUnion / DynamicMap

**OneOfParam** (discriminated union): `.Discriminator(field)` names the field that selects the variant. `.Variants(variants...)` defines the possible shapes, each built with `Variant(name).WithFields(...)`. Standard modifiers: `Default()`, `Required()`, `Optional()`, `Description()`.

**Variant**: `Variant(name string)` starts a variant definition. `.WithFields(fields ...*StructField)` sets the fields visible when this variant is selected.

**ClosedUnionParam**: Models a parameter that must match one of several fixed struct shapes (without a discriminator). `.Options(options ...*ClosedStructOption)` defines the allowed shapes, each built with `ClosedStruct().WithFields(...)`. Generates a closed struct disjunction: `close({a: string}) | close({b: int})`.

**DynamicMapParam**: A map parameter where the value type is specified at build time. `.ValueType(t ParamType)` sets a simple value type. `.ValueTypeUnion(union string)` sets a raw CUE union type string for complex cases.

```go title="Go — defkit"
storage := defkit.OneOf("storage").Variants(
    defkit.Variant("pvc").WithFields(
        defkit.Field("size", defkit.ParamTypeString),
        defkit.Field("storageClass", defkit.ParamTypeString).Optional(),
    ),
    defkit.Variant("emptyDir").WithFields(
        defkit.Field("sizeLimit", defkit.ParamTypeString).Optional(),
    ),
)

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
storage?: "pvc" | "emptyDir"
if storage == "pvc" {
    size?:         string
    storageClass?: string
}
if storage == "emptyDir" {
    sizeLimit?: string
}

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
// Field also supports modifiers:
defkit.Field("name",  defkit.ParamTypeString)
defkit.Field("port",  defkit.ParamTypeInt).Default(8080)
defkit.Field("debug", defkit.ParamTypeBool).Default(false)
```

```cue title="CUE — generated"
name?:  string
port:   *8080  | int
debug:  *false | bool
```
