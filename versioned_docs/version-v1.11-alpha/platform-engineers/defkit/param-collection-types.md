---
title: Collection Parameter Types
---

Collection parameters represent multi-value fields — lists, arrays, and maps. They compose with scalar and struct types to express rich schema shapes.

### Collection Constructors

| Constructor | CUE Type | Notes |
|---|---|---|
| `Array(name)` | `[...]` | Generic, use `.Of(type)` |
| `StringList(name)` | `[...string]` | Shorthand |
| `IntList(name)` | `[...int]` | Shorthand |
| `List(name)` | `[...]` | Untyped open array |
| `Map(name)` | `[string]: T` | Use `.Of(type)` |
| `Object(name)` | `{...}` | Open struct |
| `StringKeyMap(name)` | `[string]: string` | Shorthand |
| `DynamicMap()` | `[string]: T` | Dynamic value type |

## `defkit.Array()` with `.Of()`

A typed list where every element matches the given parameter type. Chain `.Of()` with any scalar, struct, or complex type. Use when items have a defined schema.

### Array / List Chain Methods

| Method | Description |
|---|---|
| `.Of(elemType ParamType)` | Sets the element type for the array. Generates CUE `[...string]`, `[...int]`, etc. Use shorthand constructors `StringList()`/`IntList()` for common cases. |
| `.WithFields(fields ...Param)` | Defines the array as an array of structs with named fields. Generates CUE `[...{ port: int, name?: string }]`. |
| `.WithSchema(schema string)` | Sets a raw CUE string as the element schema. Escape hatch for complex element types. |
| `.WithSchemaRef(ref string)` | References an external CUE schema definition for elements (e.g. `"#VolumeSpec"`). |
| `.MinItems(n)` / `.MaxItems(n)` | Sets minimum/maximum array length as schema constraints. Enforced at CUE validation time. |
| `.LenEq(n)` / `.LenGt(n)` / `.LenGte(n)` / `.LenLt(n)` / `.LenLte(n)` | Returns conditions on the array's length. Unlike `MinItems()`/`MaxItems()` which are schema constraints, these create runtime conditions for `If()`/`SetIf()`. |
| `.Contains(val) Condition` | Returns a condition checking if the array contains a specific value. |
| `.IsEmpty()` / `.IsNotEmpty()` | Returns conditions checking if the array has zero / non-zero elements. |
| `.NotEmpty()` | Adds a non-empty constraint to each string element. Changes `[...string]` to `[...(string & !="")]`. Only applies to string-typed arrays. |
| `.OfEnum(values ...string)` | Creates an array where each element must be one of the listed string values. Generates CUE `[...("value1" \| "value2")]`. |
| `.Validators(validators ...*Validator)` | Attaches cross-field validation rules to the array's element struct. |

```go title="Go — defkit"
envs := defkit.Array("env").Optional().WithFields(
    defkit.String("name"),
    defkit.String("value").Optional(),
)
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
tags := defkit.Array("tags").Of(defkit.ParamTypeString)

// Array of structs — use .WithFields() with Param constructors
mounts := defkit.Array("volumeMounts").Optional().WithFields(
    defkit.String("name"),
    defkit.String("mountPath"),
    defkit.Bool("readOnly").Default(false),
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
objects?: [...]
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

## `defkit.Map()` with `.Of()`

A generic map parameter with a configurable value type. Use `StringKeyMap` for the common string-to-string case. Use `.Of(paramType)` to set the value type.

### Map / Object Chain Methods

| Method | Description |
|---|---|
| `.Of(valueType ParamType)` | Sets the value type for map entries. Generates CUE `[string]: string`, `[string]: int`, etc. |
| `.WithFields(fields ...Param)` | Defines the map as a structured object with named fields. Use when the object has a known schema. |
| `.Field(fieldPath string)` | Returns a `*ParamFieldRef` for accessing a nested field within this map. The ref can be used in conditions and as values in `Set()` calls. |
| `.HasKey(key string) Condition` | Returns a condition checking whether a specific key exists in the map at runtime. |
| `.LenEq(n)` / `.LenGt(n)` / `.IsEmpty()` / `.IsNotEmpty()` | Returns conditions on the number of entries in the map. |
| `.Closed()` | Closes the map so only declared fields are allowed — no additional keys. |
| `.Validators(validators ...*Validator)` | Attaches cross-field validation rules that run against the map's fields. |
| `.ConditionalFields(branches ...*ConditionalBranch)` | Adds fields that appear conditionally based on other field values. Build branches with `WhenParam(cond).Params(...)`. |

```go title="Go — defkit"
// String-valued map
defkit.Map("labels").Of(defkit.ParamTypeString)

// Open map (no typed value)
defkit.Map("annotations")
```

```cue title="CUE — generated"
labels?:      [string]: string
annotations?: {...}
```

:::info
`defkit.Map()` without `.Of()` generates `{...}` — an open struct with any fields. Prefer `StringKeyMap` or `Map().Of()` for more specific CUE constraints.
:::

## `defkit.DynamicMap()`

A special map type that replaces the **entire** `parameter` block with a dynamic map. Unlike `Map()`, it is not a named field — it sets the whole parameter schema to `[string]: T`. Use `.ValueType()` for a single type or `.ValueTypeUnion()` for a union string.

```go title="Go — defkit"
defkit.DynamicMap().ValueType(defkit.ParamTypeString)
defkit.DynamicMap().ValueTypeUnion("string | null")
```

```cue title="CUE — generated"
parameter: [string]: string
parameter: [string]: string | null
```

## Array Constraints

Apply `.MinItems(n)` and `.MaxItems(n)` to enforce element count bounds on `Array` and `List` parameters.

```go title="Go — defkit"
ports := defkit.Array("ports").MinItems(1).MaxItems(10)
```

```cue title="CUE — generated"
ports?: list.MinItems(1) & list.MaxItems(10) & [...]
```
