---
title: Collection Parameter Types
---

Collection parameters represent multi-value fields — lists, arrays, and maps. They compose with scalar and struct types to express rich schema shapes.

## `defkit.Array()` with `.Of()`

A typed list where every element matches the given parameter type. Chain `.Of()` with any scalar, struct, or complex type. Use when items have a defined schema.

```go title="Go — defkit"
envItem := defkit.Struct("envItem").WithFields(
    defkit.String("name"),
    defkit.String("value").Optional(),
)
envs := defkit.Array("env").Of(envItem)
```

```cue title="CUE — generated"
env?: [...{
    name:   string
    value?: string
}]
```

For arrays of scalars, pass a scalar param as the element type:

```go title="Go — defkit"
// Array of strings
tags := defkit.Array("tags").Of(defkit.String(""))

// Array of structs
mounts := defkit.Array("volumeMounts").Of(
    defkit.Struct("").WithFields(
        defkit.String("name"),
        defkit.String("mountPath"),
        defkit.Bool("readOnly").Default(false),
    ),
)
```

```cue title="CUE — generated"
tags?: [...string]

volumeMounts?: [...{
    name:      string
    mountPath: string
    readOnly:  *false | bool
}]
```

## `defkit.StringList()`

A shorthand for `Array("x").Of(String)`. Optional by default.

```go title="Go — defkit"
args    := defkit.StringList("args")
secrets := defkit.StringList("secrets")
```

```cue title="CUE — generated"
args?:    [...string]
secrets?: [...string]
```

## `defkit.List()`

An untyped list (`[...]`). Use when items are heterogeneous or the schema is provided externally.

```go title="Go — defkit"
objects := defkit.List("objects")
```

```cue title="CUE — generated"
objects: [...]
```

## `defkit.StringKeyMap()`

A map with arbitrary string keys and string values. Maps directly to the CUE `[string]: string` constraint. Useful for labels, annotations, or environment variable maps.

```go title="Go — defkit"
labels      := defkit.StringKeyMap("labels")
annotations := defkit.StringKeyMap("annotations")
```

```cue title="CUE — generated"
labels?:      [string]: string
annotations?: [string]: string
```

## `defkit.Map()` with `.ValueType()` / `.ValueTypeUnion()`

A generic map parameter with configurable value types. Use `StringKeyMap` for the common string-to-string case. `.ValueType()` sets a single value type; `.ValueTypeUnion()` specifies a union of allowed value types.

```go title="Go — defkit"
// String-valued map
defkit.Map("labels").ValueType("string")

// Mixed-type values
defkit.Map("annotations").ValueTypeUnion("string", "int")

// DynamicMap convenience
defkit.DynamicMap("env").ValueType("string")
defkit.DynamicMap("mixed").ValueTypeUnion("string", "null")
```

```cue title="CUE — generated"
labels?:      [string]: string
annotations?: [string]: string | int
env?:         [string]: string
mixed?:       [string]: string | null
```

:::info
`defkit.Map()` without `.ValueType()` generates `{...}` — an open struct with any fields. Prefer `StringKeyMap` or `Map().ValueType()` for more specific CUE constraints.
:::

## Array Constraints

Apply `.MinItems(n)` and `.MaxItems(n)` to enforce element count bounds on `Array` and `List` parameters.

```go title="Go — defkit"
ports := defkit.Array("ports").MinItems(1).MaxItems(10)
```

```cue title="CUE — generated"
ports?: [...] & list.MinItems(1) & list.MaxItems(10)
```
