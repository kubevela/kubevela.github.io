---
title: Scalar Parameter Types
---

Scalar parameters define single-value fields in a definition's parameter schema. Each constructor returns a `*Param` that maps directly to a CUE primitive type and can be chained with modifiers like `.Optional()`, `.Default()`, and `.Description()`.

### Scalar Constructors

| Constructor | CUE Type | Notes |
|---|---|---|
| `String(name)` | `string` | |
| `Int(name)` | `int` | |
| `Bool(name)` | `bool` | |
| `Float(name)` | `float` | |
| `Enum(name)` | `"a" \| "b"` | Use `.Values()` |

## `defkit.String()`

A UTF-8 string parameter. Optional by default — the field is emitted as `field?: string`. Use `.Default(v)` to emit a non-optional field with a default (`field: *v | string`), or `.Mandatory()` for a non-optional field without a default (`field: string`).

### Chain Methods

| Method | Description |
|---|---|
| `.Values(values ...string)` | Restricts the parameter to a fixed set of allowed values (closed enum). Generates CUE `"first" \| "second"`. To set a default, chain `.Default()` separately. |
| `.OpenEnum()` | Used after `Values()` to allow any string in addition to the listed values. Generates `*"info" \| "debug" \| string`. |
| `.Pattern(regex)` | Adds a regex constraint the string must match. Use for formats like IP addresses, DNS names, or semantic versions. |
| `.MinLen(n)` / `.MaxLen(n)` | Sets minimum/maximum length constraints on the string value. |
| `.NotEmpty()` | Adds a constraint that the string must not be `""`. Stricter than `Required()` which only ensures the field is present. |
| `.Concat(suffix) Value` | Returns a Value that appends a suffix to this parameter's runtime value. Generates CUE `parameter.name + "suffix"`. |
| `.Prepend(prefix) Value` | Returns a Value that prepends a prefix to this parameter's runtime value. Generates CUE `"prefix" + parameter.name`. |
| `.Contains(substr) Condition` | Returns a condition checking if the value contains the substring. Generates `strings.Contains(parameter.name, "substr")`. |
| `.Matches(pattern) Condition` | Returns a condition checking if the value matches a regex pattern. Generates CUE `parameter.name =~ "pattern"`. |
| `.StartsWith(prefix)` / `.EndsWith(suffix)` | Returns conditions checking if the value starts/ends with the given string. Generates `strings.HasPrefix(...)` / `strings.HasSuffix(...)`. |
| `.In(values ...string) Condition` | Returns a condition checking if the value is one of the listed strings. Unlike `Values()` which constrains the schema, `In()` creates a runtime condition for `If()`/`SetIf()`. |
| `.LenEq(n)` / `.LenGt(n)` / `.LenGte(n)` / `.LenLt(n)` / `.LenLte(n)` | Returns conditions on the string's length. Generates `len(parameter.name) == n`, `> n`, etc. |

```go title="Go — defkit"
image   := defkit.String("image")              // optional by default
tag     := defkit.String("tag").Default("latest")
comment := defkit.String("comment").Optional() // explicitly optional
```

```cue title="CUE — generated"
image?:   string
tag:      *"latest" | string
comment?: string
```

## `defkit.Int()`

A 64-bit integer parameter. Supports `.Min(n)` and `.Max(n)` for inclusive range constraints.

### Chain Methods

| Method | Description |
|---|---|
| `.Min(n int)` / `.Max(n int)` | Sets minimum/maximum value constraints. Generates CUE `>=n` / `<=n` bounds. Use for parameters like `replicas` (min 1) or ports (1-65535). |
| `.In(values ...int) Condition` | Returns a condition checking if the parameter equals any of the listed values. Generates an OR chain. Use in conditional logic, not schema constraints. |
| `.Add(val)` / `.Sub(val)` / `.Mul(val)` / `.Div(val)` | Returns a Value performing arithmetic on this parameter's runtime value. Generates CUE `parameter.name + val`, etc. Use in `Set()` calls for computed fields. |

```go title="Go — defkit"
replicas := defkit.Int("replicas").Default(1).Min(1).Max(50)
port     := defkit.Int("port")
```

```cue title="CUE — generated"
replicas: *1 | int & >=1 & <=50
port?:    int
```

## `defkit.Bool()`

A boolean parameter. `.Default(true)` or `.Default(false)` sets the CUE default value.

### Chain Methods

| Method | Description |
|---|---|
| `.IsTrue() Condition` | Returns a condition that is true when this boolean parameter is `true`. Generates CUE `parameter.name`. The most common way to branch on a boolean flag. |
| `.IsFalse() Condition` | Returns a condition that is true when this boolean parameter is `false`. Generates CUE `!parameter.name`. |

```go title="Go — defkit"
enable := defkit.Bool("enable").Default(true)
debug  := defkit.Bool("debug").Default(false)
```

```cue title="CUE — generated"
enable: *true  | bool
debug:  *false | bool
```

## `defkit.Float()`

A floating-point number parameter. Supports `.Min(f)` and `.Max(f)` for range constraints. Generates the CUE `number` type.

Same chain methods as IntParam: `.Min(n float64)` sets a lower bound, `.Max(n float64)` sets an upper bound, `.In(values ...float64)` creates a membership condition. Use for parameters like ratios, thresholds, or percentages.

```go title="Go — defkit"
ratio  := defkit.Float("ratio").Default(0.5).Min(0.0).Max(1.0)
weight := defkit.Float("weight")
```

```cue title="CUE — generated"
ratio:   *0.5 | number & >=0 & <=1
weight?: number
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
imagePullPolicy: *"IfNotPresent" | "Always" | "Never"
```

:::tip
Combine `.Values()` with `.Default()` to pre-select one of the allowed values. The default appears first in the CUE disjunction with the `*` marker.
:::
