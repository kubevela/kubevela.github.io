---
title: Scalar Parameter Types
---

Scalar parameters define single-value fields in a definition's parameter schema. Each constructor returns a `*Param` that maps directly to a CUE primitive type and can be chained with modifiers like `.Optional()`, `.Default()`, and `.Description()`.

## `defkit.String()`

A UTF-8 string parameter. Non-optional by default — the field is emitted as `field: string`. Use `.Optional()` to make the field absent-capable (`field?: string`).

```go title="Go — defkit"
image   := defkit.String("image")              // non-optional (default)
tag     := defkit.String("tag").Default("latest")
comment := defkit.String("comment").Optional() // explicitly optional
```

```cue title="CUE — generated"
image:    string
tag:      *"latest" | string
comment?: string
```

## `defkit.Int()`

A 64-bit integer parameter. Supports `.Min(n)` and `.Max(n)` for inclusive range constraints.

```go title="Go — defkit"
replicas := defkit.Int("replicas").Default(1).Min(1).Max(50)
port     := defkit.Int("port")
```

```cue title="CUE — generated"
replicas: *1 | int >=1 & <=50
port:     int
```

## `defkit.Bool()`

A boolean parameter. `.Default(true)` or `.Default(false)` sets the CUE default value.

```go title="Go — defkit"
enable := defkit.Bool("enable").Default(true)
debug  := defkit.Bool("debug").Default(false)
```

```cue title="CUE — generated"
enable: *true  | bool
debug:  *false | bool
```

## `defkit.Float()`

A floating-point number parameter. Supports `.Min(f)` and `.Max(f)` for range constraints. Generates the CUE `float` type.

```go title="Go — defkit"
ratio  := defkit.Float("ratio").Default(0.5).Min(0.0).Max(1.0)
weight := defkit.Float("weight")
```

```cue title="CUE — generated"
ratio:  *0.5 | float >=0 & <=1
weight: float
```

## `defkit.Enum()`

A string parameter constrained to a fixed set of allowed values. Use `.Values()` — not `.Enum()` — to specify the allowed set (current convention as of defkit API update).

```go title="Go — defkit"
// Use .Values(), not .Enum() — current convention
pullPolicy := defkit.Enum("imagePullPolicy").
    Values("Always", "Never", "IfNotPresent").
    Default("IfNotPresent")
```

```cue title="CUE — generated"
imagePullPolicy: *"IfNotPresent" | "Always" | "Never" | "IfNotPresent"
```

:::tip
Combine `.Values()` with `.Default()` to pre-select one of the allowed values. The default appears first in the CUE disjunction with the `*` marker.
:::
