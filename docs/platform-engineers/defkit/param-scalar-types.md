---
title: Parameters
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

A definition's parameters become its `parameter: { ... }` block: the fields an Application sets. This page covers every parameter constructor (scalars, collections, structs and unions), the chain methods they share, and the conditions they produce for `.SetIf()` and `.If()`. Worked examples for each are at the end.

## Scalar types

Scalar parameters define single-value fields in a definition's parameter schema. Each constructor returns a `*Param` that maps directly to a CUE primitive type and can be chained with modifiers like `.Optional()`, `.Default()`, and `.Description()`.

### Scalar constructors

| Constructor | CUE Type | Notes |
|---|---|---|
| `String(name)` | `string` | |
| `Int(name)` | `int` | |
| `Bool(name)` | `bool` | |
| `Float(name)` | `float` | |
| `Enum(name)` | `"a" \| "b"` | Use `.Values()` |

### `defkit.String()`

A UTF-8 string parameter.

How a parameter is declared decides whether the user has to set it. This holds for every type on this page:

| You write | CUE emits | If the user leaves it out |
|---|---|---|
| `defkit.String("x")` (bare) | `x: string` | Mandatory: the Application is refused with an incomplete value for `x` |
| `defkit.String("x").Optional()` | `x?: string` | Allowed; guard reads with `.IsSet()` |
| `defkit.String("x").Default("foo")` | `x: *"foo" \| string` | Allowed; the default is used |
| `defkit.String("x").Required()` | `x!: string` | Refused, even when a default is set: the user must set it explicitly |

#### Chain Methods

| Method | Description |
|---|---|
| `.Values(values ...string)` | Restricts the parameter to a fixed set of allowed values (closed enum). Generates CUE `"first" \| "second"`. To set a default, chain `.Default()` separately. |
| `.OpenEnum()` | Used after `Values()` to allow any string in addition to the listed values. Generates `*"info" \| "debug" \| string`. |
| `.Pattern(regex)` | Adds a regex constraint the string must match. Use for formats like IP addresses, DNS names, or semantic versions. |
| `.MinLen(n)` / `.MaxLen(n)` | Sets minimum/maximum length constraints on the string value. |
| `.NotEmpty()` | Adds a constraint that the string must not be `""`. `Required()` only checks that the field is present. |
| `.Concat(suffix) Value` | Returns a Value that appends a suffix to this parameter's runtime value. Generates CUE `parameter.name + "suffix"`. |
| `.Prepend(prefix) Value` | Returns a Value that prepends a prefix to this parameter's runtime value. Generates CUE `"prefix" + parameter.name`. |
| `.Contains(substr) Condition` | Returns a condition checking if the value contains the substring. Generates `strings.Contains(parameter.name, "substr")`. |
| `.Matches(pattern) Condition` | Returns a condition checking if the value matches a regex pattern. Generates CUE `parameter.name =~ "pattern"`. |
| `.StartsWith(prefix)` / `.EndsWith(suffix)` | Returns conditions checking if the value starts/ends with the given string. Generates `strings.HasPrefix(...)` / `strings.HasSuffix(...)`. |
| `.In(values ...string) Condition` | Returns a condition checking if the value is one of the listed strings. Unlike `Values()` which constrains the schema, `In()` creates a runtime condition for `If()`/`SetIf()`. |
| `.LenEq(n)` / `.LenGt(n)` / `.LenGte(n)` / `.LenLt(n)` / `.LenLte(n)` | Returns conditions on the string's length. Generates `len(parameter.name) == n`, `> n`, etc. |

### `defkit.Int()`

A 64-bit integer parameter. Supports `.Min(n)` and `.Max(n)` for inclusive range constraints.

#### Chain Methods

| Method | Description |
|---|---|
| `.Min(n int)` / `.Max(n int)` | Sets minimum/maximum value constraints. Generates CUE `>=n` / `<=n` bounds. Use for parameters like `replicas` (min 1) or ports (1-65535). |
| `.In(values ...int) Condition` | Returns a condition checking if the parameter equals any of the listed values. Generates an OR chain. Use in conditional logic, not schema constraints. |
| `.Add(val)` / `.Sub(val)` / `.Mul(val)` / `.Div(val)` | Returns a Value performing arithmetic on this parameter's runtime value. Generates CUE `parameter.name + val`, etc. Use in `Set()` calls for computed fields. |

### `defkit.Bool()`

A boolean parameter. `.Default(true)` or `.Default(false)` sets the CUE default value.

#### Chain Methods

| Method | Description |
|---|---|
| `.IsTrue() Condition` | Returns a condition that is true when this boolean parameter is `true`. Generates CUE `parameter.name`. The most common way to branch on a boolean flag. |
| `.IsFalse() Condition` | Returns a condition that is true when this boolean parameter is `false`. Generates CUE `!parameter.name`. |

### `defkit.Float()`

A floating-point number parameter. Supports `.Min(f)` and `.Max(f)` for range constraints. Generates `float`, or `number` once `.Min()` or `.Max()` is set.

Same chain methods as IntParam: `.Min(n float64)` sets a lower bound, `.Max(n float64)` sets an upper bound, `.In(values ...float64)` creates a membership condition. Use for parameters like ratios, thresholds, or percentages.

### `defkit.Enum()`

A string parameter constrained to a fixed set of allowed values. Use `.Values()` to list the allowed values.

:::tip
Combine `.Values()` with `.Default()` to pre-select one of the allowed values. The default appears first in the CUE disjunction with the `*` marker.
:::

## Collection types

Collection parameters hold more than one value: lists of scalars or structs, and maps.

### Which type do I use?

| Need | Use | CUE |
|---|---|---|
| A flat list of strings or integers | `StringList`, `IntList` | `[...string]`, `[...int]` |
| A list of structs with a known shape, or a length limit | `Array(...).WithFields(...)`, `.MinItems()` / `.MaxItems()` | `[...{port: int, name?: string}]` |
| A list whose elements vary, or whose schema is defined elsewhere | `List(...)`, with `.WithSchema()` / `.WithSchemaRef()` if needed | `[...]` |
| String keys and string values, such as labels and annotations | `StringKeyMap` | `[string]: string` |
| String keys with values of another type | `Map(...).Of(valueType)` | `[string]: int` |
| An object with known fields | `Map(...).WithFields(...)` | `{logLevel: string, outputFormat?: string}` |
| The whole `parameter` block as a map with free-form keys | `DynamicMap()` | `parameter: [string]: string` |

### Array Constructors

| Constructor | CUE type | Description |
|---|---|---|
| `defkit.StringList(name string) *ArrayParam` | `[...string]` | Shorthand for `Array(name).Of(ParamTypeString)`. Use for flat string lists (tags, secret names, command-line arguments). |
| `defkit.IntList(name string) *ArrayParam` | `[...int]` | Shorthand for `Array(name).Of(ParamTypeInt)`. Use for flat integer lists (port allowlists, retry counts). |
| `defkit.Array(name string) *ArrayParam` | `[...]` | Generic array. Chain `.Of(elemType)` for typed scalar elements, `.WithFields(...)` for struct elements, or `.MinItems(n)` / `.MaxItems(n)` for length constraints. |
| `defkit.List(name string) *ArrayParam` | `[...]` | Alias for `Array(name)` without an element type. Use when elements are heterogeneous or the schema is provided externally via `.WithSchema()` / `.WithSchemaRef()`. |

### `ArrayParam` Chain Methods

| Method | Description |
|---|---|
| `.Of(elemType ParamType) *ArrayParam` | Sets the element type. Generates `[...string]`, `[...int]`, etc. Omit to produce an open-typed array `[...]`. |
| `.WithFields(fields ...Param) *ArrayParam` | Declares a struct schema for each element. Generates `[...{ port: int, name?: string }]`. Pass any typed `*Param` constructors as fields. Use when elements have a known, named shape. |
| `.WithSchema(schema string) *ArrayParam` | Sets a raw CUE string as the element schema. Escape hatch for complex element types not expressible via `.WithFields()`. |
| `.WithSchemaRef(ref string) *ArrayParam` | References an external CUE definition for elements (e.g. `"#VolumeSpec"`). The helper definition must be declared separately via `tpl.Helper()`. |
| `.MinItems(n int) *ArrayParam` | Emits `list.MinItems(n)` as a schema constraint. The `list` import is added for you. |
| `.MaxItems(n int) *ArrayParam` | Emits `list.MaxItems(n)` as a schema constraint. The `list` import is added for you. |

### `ArrayParam` Runtime Condition Methods

These methods produce `Condition` values for use with `.SetIf()`, `.If()`/`.EndIf()`, `.OutputsIf()`, and `placement` predicates. They do not affect the generated CUE schema; they control template logic.

| Method | CUE generated | Description |
|---|---|---|
| `.IsSet() Condition` | `parameter["x"] != _|_` | True when the parameter was supplied by the user. The most common guard for optional arrays. |
| `.IsNotEmpty() Condition` | `len(parameter.x) > 0` | True when the array is supplied AND has at least one element. |
| `.IsEmpty() Condition` | `parameter["x"] == _|_ \|\| len(parameter.x) == 0` | True when absent or empty. Renders as two `if` blocks. |
| `.LenEq(n int) Condition` | `len(parameter.x) == n` | Exact length match. `LenEq(0)` is equivalent to `IsEmpty()`. |
| `.LenGt(n int) Condition` | `len(parameter.x) > n` | Length strictly greater than `n`. |
| `.LenGte(n int) Condition` | `len(parameter.x) >= n` | Length greater than or equal to `n`. |
| `.LenLt(n int) Condition` | `len(parameter.x) < n` | Length strictly less than `n`. |
| `.LenLte(n int) Condition` | `len(parameter.x) <= n` | Length less than or equal to `n`. |
| `.Contains(val any) Condition` | `list.Contains(parameter.x, val)` | True when the array contains the given value. |

:::tip
`.LenEq()`, `.LenGt()`, etc. on `ArrayParam` are *runtime conditions* for template logic. They are different from `.MinItems()` / `.MaxItems()`, which are *schema constraints* that appear in the `parameter:` block and are enforced by CUE validation when a user submits an Application.
:::

### Map Constructors

| Constructor | CUE type | Description |
|---|---|---|
| `defkit.StringKeyMap(name string) *StringKeyMapParam` | `[string]: string` | The most concise map type. Keys and values are both strings. Use for labels, annotations, and any free-form string dictionary. |
| `defkit.Map(name string) *MapParam` | `{...}` or `[string]: T` | General-purpose map. Use `.Of(valueType)` to produce `[string]: T`, or `.WithFields(...)` to declare a struct with known fields. Without either, generates an open struct `{...}`. |

:::caution
`defkit.Map("x")` without `.Of()` or `.WithFields()` generates `{...}`, an open struct that accepts any fields. This provides no schema enforcement. Prefer `StringKeyMap` for string dictionaries or `Map().Of()` / `Map().WithFields()` for typed structures.
:::

### `MapParam` Chain Methods

| Method | Description |
|---|---|
| `.Of(valueType ParamType) *MapParam` | Sets the value type. Generates `[string]: string`, `[string]: int`, etc. Makes the parameter behave like a typed dictionary. |
| `.WithFields(fields ...Param) *MapParam` | Declares a struct schema with named fields. Generates `{ logLevel: string, outputFormat?: string }`. Use when the object's shape is known and fixed. |
| `.WithSchema(schema string) *MapParam` | Sets a raw CUE string as the map structure. Escape hatch for complex schemas. |
| `.WithSchemaRef(ref string) *MapParam` | References an external CUE definition. The helper must be declared separately. |
| `.OfObject(fields ...Param) *MapParam` | Sets the shape of each value under a user-chosen key: `[string]: {...}`, like Go's `map[string]SomeStruct`. |
| `.OfSchemaRef(ref string) *MapParam` | Points each value under a user-chosen key at a helper definition: `[string]: #Ref`. |
| `.Field(fieldPath string) *ParamFieldRef` | Returns a `*ParamFieldRef` for accessing a named field within this map. The ref can be passed to `.Set()` / `.SetIf()` as a value, or used with `.IsSet()` as a condition guard. |

### `MapParam` Runtime Condition Methods

| Method | CUE generated | Description |
|---|---|---|
| `.IsSet() Condition` | `parameter["x"] != _|_` | True when the map was supplied. |
| `.IsNotEmpty() Condition` | `len(parameter.x) > 0` | True when the map is present and contains at least one entry. |
| `.IsEmpty() Condition` | `parameter["x"] == _|_ \|\| len(parameter.x) == 0` | True when absent or empty. Renders as two `if` blocks. |
| `.HasKey(key string) Condition` | `parameter.x.key != _|_` | True when the map contains the named key. |
| `.LenEq(n int) Condition` | `len(parameter.x) == n` | Exact entry count. `LenEq(0)` is equivalent to `IsEmpty()`. |
| `.LenGt(n int) Condition` | `len(parameter.x) > n` | Entry count strictly greater than `n`. |

### `DynamicMap`

`defkit.DynamicMap()` replaces the **entire** `parameter` block with a dynamic map. Unlike `Map()`, it is not a named field: it sets the whole parameter schema to `[string]: T`. Use it in traits where user input is a flat key-value dictionary (for example a label-patch trait).

| Method | Description |
|---|---|
| `defkit.DynamicMap() *DynamicMapParam` | Creates a dynamic map parameter. The generated CUE sets `parameter: [string]: T`. |
| `.ValueType(t ParamType) *DynamicMapParam` | Sets the value type. Generates `[string]: string`, `[string]: int`, etc. |
| `.ValueTypeUnion(union string) *DynamicMapParam` | Sets a union value type string. Generates `[string]: string \| null`. |

:::tip
`DynamicMap` is the only collection type that changes the shape of the entire `parameter` block rather than adding one named field. It cannot be combined with other `Param` constructors in the same `.Params(...)` call.
:::

## Structs, objects and unions

Complex parameter types compose multiple fields or variant shapes into a single parameter. Use `Struct` when you need a named top-level sub-object with a typed, fixed set of fields (and access via `.Field()` refs in templates); `Object` as the fluent alias for the same concept when building nested configs; `OneOf` with `Variant` for discriminated unions where a selector field determines which set of sibling fields is active; `ClosedUnion` with `ClosedStruct` when the union shape must be fully closed (no extra fields permitted) and there is no single discriminator key; `Field` with `ParamType*` constants to declare typed fields inside `Struct.WithFields()` programmatically. All these types participate in the standard parameter chain (`Required()`, `Optional()`, `Description()`) and integrate with `SetIf` conditions through `.IsSet()`, `.Eq()`, and `.Field()` field references.

### `defkit.Struct()` and `defkit.Field()`

| Method | Description |
|---|---|
| `defkit.Struct(name string) *StructParam` | Creates a named struct parameter with typed, fixed fields. Generates a nested CUE struct `name: { ... }` (`name?:` after `.Optional()`, `name!:` after `.Required()`). Chain `.WithFields(...)` to declare each field. |
| `*StructParam.WithFields(fields ...*StructField) *StructParam` | Adds field definitions to the struct. Fields are created with `defkit.Field(name, paramType)` and its modifier chain. |
| `*StructParam.Required() *StructParam` | Marks the struct as required (`name!:`). |
| `*StructParam.Optional() *StructParam` | Marks the struct as optional (`name?:`). Without either modifier the field has no marker, so the Application has to set it. |
| `*StructParam.Description(desc string) *StructParam` | Sets the usage comment shown in `vela show`. Generates `// +usage=desc`. |
| `*StructParam.WithSchemaRef(ref string) *StructParam` | References an external CUE type definition instead of inline fields (e.g. `"#ResourceSpec"`). The helper must be declared separately via `tpl.Helper()`. |
| `*StructParam.Field(fieldPath string) *ParamFieldRef` | Returns a reference to a nested field within this struct for use in `.Set()` / `.SetIf()` value positions (e.g. `resources.Field("cpu")` → `parameter.resources.cpu`). |

#### `defkit.Field()` and `StructField` methods

| Method | Description |
|---|---|
| `defkit.Field(name string, fieldType ParamType) *StructField` | Creates a typed field for use inside `Struct.WithFields()`. `fieldType` is one of the `ParamType*` constants. |
| `*StructField.Required() *StructField` | Marks the field as required (`field!: type`). |
| `*StructField.Optional() *StructField` | Marks the field as optional (`field?: type`). |
| `*StructField.Default(value any) *StructField` | Sets a default value. Generates `field: *value \| type`. |
| `*StructField.Description(desc string) *StructField` | Sets the field's usage comment. |
| `*StructField.Values(values ...string) *StructField` | Restricts a string field to a fixed enum. Generates `field: "a" \| "b"`. |
| `*StructField.Of(elemType ParamType) *StructField` | Sets the element type when this field holds an array (`[...string]`, `[...int]`, etc.). |
| `*StructField.Nested(s *StructParam) *StructField` | Makes the field's type a nested struct, creating hierarchical schemas. |
| `*StructField.WithSchemaRef(ref string) *StructField` | References an external CUE type definition for this field. |

#### `ParamType*` constants

| Constant | CUE type |
|---|---|
| `defkit.ParamTypeString` | `string` |
| `defkit.ParamTypeInt` | `int` |
| `defkit.ParamTypeBool` | `bool` |
| `defkit.ParamTypeFloat` | `float` |

### `defkit.Object()`

`defkit.Object(name string) *MapParam` is a convenience alias for `defkit.Map(name)`. It is documented separately because it reads more naturally when representing a config object with a known, closed set of named fields. Use it in place of `Map` when the intent is a structured sub-object rather than a dictionary. It supports the full `MapParam` chain: `.WithFields(...)`, `.Of(valueType)`, `.WithSchema(schema)`, `.WithSchemaRef(ref)`, `.Field(fieldPath)`, `.Required()`, `.Optional()`, `.Description()`, condition methods (`.IsSet()`, `.IsNotEmpty()`, `.HasKey()`, `.LenEq()`, `.LenGt()`, `.IsEmpty()`).

:::tip Which one to use
For a fixed sub-object, use `Object(...).WithFields(String(...), Int(...))`. It takes the same constructors as top-level parameters, so each field gets the full chain (defaults, constraints, descriptions).

Use `Struct` with `Field` only when a field needs something `Field` has and the param constructors don't: `Nested`, `Of` or `WithSchemaRef` on the field.
:::

### `defkit.OneOf()` and `defkit.Variant()`

| Method | Description |
|---|---|
| `defkit.OneOf(name string) *OneOfParam` | Creates a discriminated union parameter. The parameter itself becomes the enum selector field. Generates `name: "variantA" \| "variantB"` (`name?:` after `.Optional()`) plus `if name == "variantA" { ... }` blocks for each variant's fields at the same schema level. |
| `*OneOfParam.Variants(variants ...*OneOfVariant) *OneOfParam` | Adds variant definitions. Each variant is built with `defkit.Variant(name).WithFields(...)`. |
| `*OneOfParam.Discriminator(field string) *OneOfParam` | Names the field used to distinguish variants. This is for tooling and metadata only; it does not change the generated CUE, where the param name is always the enum field name. |
| `*OneOfParam.Default(value string) *OneOfParam` | Sets the default variant name. Generates `name: *"variantA" \| "variantB"`. |
| `*OneOfParam.Required() *OneOfParam` | Marks the union as required. |
| `*OneOfParam.Optional() *OneOfParam` | Marks the union as optional. |
| `*OneOfParam.Description(desc string) *OneOfParam` | Sets the usage comment. |
| `defkit.Variant(name string) *OneOfVariant` | Starts a variant definition. Chain `.WithFields(...)` to declare the fields exposed when this variant is selected. |
| `*OneOfVariant.WithFields(fields ...*StructField) *OneOfVariant` | Declares the fields active when this variant is selected. Uses the same `*StructField` API as `Struct.WithFields()`. |

### `defkit.ClosedUnion()` and `defkit.ClosedStruct()`

| Method | Description |
|---|---|
| `defkit.ClosedUnion(name string) *ClosedUnionParam` | Creates a closed struct disjunction. Generates `name: close({...}) \| close({...})` (`name?:` after `.Optional()`). Use when there is no single discriminator key and the parameter must match exactly one of several fully-closed shapes. |
| `*ClosedUnionParam.Options(options ...*ClosedStructOption) *ClosedUnionParam` | Adds closed-struct alternatives. Each option is built with `defkit.ClosedStruct().WithFields(...)`. |
| `*ClosedUnionParam.Required() *ClosedUnionParam` | Marks the union as required. |
| `*ClosedUnionParam.Optional() *ClosedUnionParam` | Marks the union as optional. |
| `*ClosedUnionParam.Description(desc string) *ClosedUnionParam` | Sets the usage comment. |
| `defkit.ClosedStruct() *ClosedStructOption` | Creates one option in a closed disjunction. Chain `.WithFields(...)` to add fields. Extra fields not listed here are rejected by CUE. |
| `*ClosedStructOption.WithFields(fields ...*StructField) *ClosedStructOption` | Adds fields to this closed struct option. Uses the same `*StructField` API. |

:::caution
`OneOf` and `ClosedUnion` solve different modelling problems. `OneOf` requires a distinguishing enum value (the param itself) that selects which sibling fields appear: good for mutually exclusive modes (`"pvc"` vs `"emptyDir"`). `ClosedUnion` generates a CUE disjunction of fully-closed structs and CUE picks the alternative that matches: good for shape-based unions where the distinguishing field is part of the value itself (e.g. `ClusterIP` vs `NodePort` service specs). Give each option a field with a literal value, such as `Field("type", ParamTypeString).Values("ClusterIP")`. A default like `*"ClusterIP" | string` accepts any string, so CUE can't tell the options apart.
:::

## Chain methods and conditions

Every parameter constructor (`String`, `Int`, `Bool`, `Float`, `Enum`, `Array`, `Map`, `Object`, `StringKeyMap`) returns a typed pointer that can be chained with constraint, metadata, and expression methods before being passed to `.Params()`. This document covers the full chain-method surface: common metadata and presence modifiers shared by all parameter types; type-specific schema constraints (string pattern and length, numeric range, array item counts, map closed-struct); string and arithmetic expression methods that produce `Value` results for use in `.Set()`; and runtime condition methods that produce `Condition` results for use in `.SetIf()`, `.If()`, and `placement` predicates.

### Common chain methods

These methods are available on every parameter type via `baseParam`. They control the generated CUE field presence marker, default value, and documentation annotations.

| Method | CUE generated | Description |
|---|---|---|
| `.Required() *T` | `name!: type` | User must explicitly provide this field. Cannot be satisfied by defaults or merging. |
| `.Optional() *T` | `name?: type` | Field may be absent from input entirely. |
| `.Default(value) *T` | `name: *value \| type` | Sets a default. The parameter becomes non-optional at the CUE level (no `?` or `!`) unless combined with `.Optional()` / `.Required()`. |
| `.Description(desc string) *T` | `// +usage=desc` | Human-readable description shown in `vela show` and generated OpenAPI. |
| `.Short(s string) *T` | `// +short=s` | Single-letter CLI shorthand flag (e.g. `"i"` → `-i`). Available on `String`, `Int`, `Bool`, `Float`, `Enum`. |
| `.Ignore() *T` | `// +ignore` | Hides the field from the CLI (`vela show`, generated docs); it stays in the OpenAPI schema. Available on `String`, `Int`, `Bool`, `Float`, `Enum`. |

:::tip
A bare param with no modifier emits `name: type`, with no marker. CUE treats it as a regular field, so the Application has to set it (unless the param has a `.Default()`). Use `.Optional()` when the field may be left out, and `.Required()` when the user must always set it.
:::

### String constraints

Available on `*StringParam` (i.e. `defkit.String(...)`). These constraints appear inside the `parameter:` block and are enforced by CUE at apply time.

| Method | CUE generated | Description |
|---|---|---|
| `.Values(values ...string) *StringParam` | `"v1" \| "v2" \| ...` | Restricts the string to a fixed set of allowed values, producing a CUE string disjunction. |
| `.OpenEnum() *StringParam` | `"v1" \| "v2" \| string` | Like `.Values()` but keeps the enum open: any string is also accepted. Useful for well-known values plus user-defined ones. |
| `.Pattern(regex string) *StringParam` | `string & =~"regex"` | Requires the value to match a regular expression. |
| `.MinLen(n int) *StringParam` | `strings.MinRunes(n)` | Minimum UTF-8 rune count. The `"strings"` import is added to the generated CUE for you. |
| `.MaxLen(n int) *StringParam` | `strings.MaxRunes(n)` | Maximum UTF-8 rune count. The `"strings"` import is added for you. |

:::caution
There is no schema constraint for a negative regex (CUE `!~`) on the parameter itself: use a raw `.WithSchema()` string or a `defkit.CUEExpr` for that. To branch on a value that does not match a pattern in the template, use the `.NotMatches()` condition (see [`StringParam` conditions](#stringparam-conditions)).
:::

### Numeric constraints

Available on `*IntParam` and `*FloatParam`.

| Method | CUE generated | Description |
|---|---|---|
| `.Min(n) *T` | `int & >=n` or `float & >=n` | Inclusive lower bound. |
| `.Max(n) *T` | `int & <=n` or `float & <=n` | Inclusive upper bound. |

When combined with `.Default(v)` the disjunction reads `*v | int & >=n & <=n`.

### Array constraints

Available on `*ArrayParam`.

| Method | CUE generated | Description |
|---|---|---|
| `.MinItems(n int) *ArrayParam` | `list.MinItems(n) & [...]` | Minimum number of array elements. The `"list"` import is added to the generated CUE for you. |
| `.MaxItems(n int) *ArrayParam` | `list.MaxItems(n) & [...]` | Maximum number of array elements. The `"list"` import is added for you. |
| `.OfEnum(values ...string) *ArrayParam` | `[...("v1" \| "v2" \| ...)]` | Constrains each element to one of the given string values. |

### Map constraints

Available on `*MapParam` (and its alias `defkit.Object(...)`).

| Method | CUE generated | Description |
|---|---|---|
| `.Closed() *MapParam` | `close({...})` | Wraps the generated struct in CUE's `close()`, rejecting any extra fields not explicitly declared via `.WithFields()`. With `.OfObject()`, it closes each value instead: `[string]: close({...})`. |
| `.OfObject(fields ...Param) *MapParam` | `name: [string]: {...}` | Sets the shape of each value under a user-chosen key, like Go's `map[string]SomeStruct`. The fields keep their own defaults and constraints. `.WithFields()` describes one fixed object; `.OfObject()` describes every value. |
| `.OfSchemaRef(ref string) *MapParam` | `name: [string]: #Ref` | Points each value under a user-chosen key at a helper definition. `.WithSchemaRef()` applies the reference to the whole parameter instead. |

### String expressions

Available on `*StringParam`. These methods return a `Value` for use in `.Set()` / `.SetIf()` value positions; they do **not** affect the `parameter:` schema block.

| Method | CUE generated | Returns |
|---|---|---|
| `.Concat(suffix string) Value` | `parameter.name + "suffix"` | Value |
| `.Prepend(prefix string) Value` | `"prefix" + parameter.name` | Value |

:::tip
Neither `Concat` nor `Prepend` chains further: both return `Value`, not `*StringParam`. To concatenate two parameters together, use `defkit.Plus(...)` from the value-expression API.
:::

### Arithmetic expressions

Available on `*IntParam`. These return a `Value`.

| Method | CUE generated | Returns |
|---|---|---|
| `.Add(n int) Value` | `parameter.name + n` | Value |
| `.Sub(n int) Value` | `parameter.name - n` | Value |
| `.Mul(n int) Value` | `parameter.name * n` | Value |
| `.Div(n int) Value` | `parameter.name / n` | Value |

Arithmetic results are integer expressions. Do not assign them to Kubernetes fields that require a string (e.g. `env[].value`).

### Runtime conditions: presence

These methods produce `Condition` values for use in `.SetIf()`, `.If()`/`.EndIf()`, `.OutputsIf()`, and placement predicates. They are available on all parameter types via `baseParam`.

| Method | CUE generated | Description |
|---|---|---|
| `.IsSet() Condition` | `parameter["name"] != _|_` | True when the user supplied this parameter. The primary guard for optional params. |
| `.NotSet() Condition` | `parameter["name"] == _|_` | True when the parameter was omitted. |
| `.Eq(val any) Condition` | `parameter.name == val` | Equality comparison against a literal. |
| `.Ne(val any) Condition` | `parameter.name != val` | Inequality comparison. |
| `.Gt(val any) Condition` | `parameter.name > val` | Greater-than comparison. Meaningful for numeric params. |
| `.Gte(val any) Condition` | `parameter.name >= val` | Greater-than-or-equal. |
| `.Lt(val any) Condition` | `parameter.name < val` | Less-than comparison. |
| `.Lte(val any) Condition` | `parameter.name <= val` | Less-than-or-equal. |

### Runtime conditions: boolean, string, and collection predicates

#### `BoolParam` conditions

| Method | CUE generated | Description |
|---|---|---|
| `.IsTrue() Condition` | `if parameter.name` | Truthy guard, shorter and more idiomatic than `.Eq(true)`. |
| `.IsFalse() Condition` | `if !parameter.name` | Falsy guard, shorter than `.Eq(false)`. |

#### `StringParam` conditions

| Method | CUE generated | Description |
|---|---|---|
| `.In(values ...string) Condition` | `parameter.name == "v1" \|\| ...` | True when the value is one of the listed strings. |
| `.Matches(pattern string) Condition` | `parameter.name =~ "pattern"` | True when the value matches a regex. |
| `.NotMatches(pattern string) Condition` | `parameter.name !~ "pattern"` | True when the value does not match a regex. |
| `.Contains(substr string) Condition` | `strings.Contains(parameter.name, "sub")` | True when the string contains a substring. Requires `"strings"` import. |
| `.StartsWith(prefix string) Condition` | `strings.HasPrefix(parameter.name, "pfx")` | True when the string starts with a prefix. Requires `"strings"` import. |
| `.EndsWith(suffix string) Condition` | `strings.HasSuffix(parameter.name, "sfx")` | True when the string ends with a suffix. Requires `"strings"` import. |

#### `IntParam` and `FloatParam` conditions

| Method | CUE generated | Description |
|---|---|---|
| `.In(values ...T) Condition` | `parameter.name == v1 \|\| ...` | True when the value is one of the listed integers or floats. |

#### `ArrayParam` runtime conditions

These conditions are distinct from `.MinItems()`/`.MaxItems()` (schema constraints). They control template logic only.

| Method | CUE generated | Description |
|---|---|---|
| `.IsSet() Condition` | `parameter["x"] != _|_` | True when the array was supplied. |
| `.IsNotEmpty() Condition` | `len(parameter.x) > 0` | True when present and non-empty. |
| `.IsEmpty() Condition` | two `if` blocks: absent OR empty | True when absent or empty. Renders as two separate blocks because CUE cannot express `||` across a potentially-absent value. |
| `.LenEq(n int) Condition` | `len(parameter.x) == n` | Exact length. `LenEq(0)` is equivalent to `IsEmpty()`. |
| `.LenGt(n int) Condition` | `len(parameter.x) > n` | Length strictly greater than `n`. |
| `.LenGte(n int) Condition` | `len(parameter.x) >= n` | Length greater than or equal to `n`. |
| `.LenLt(n int) Condition` | `len(parameter.x) < n` | Length strictly less than `n`. |
| `.LenLte(n int) Condition` | `len(parameter.x) <= n` | Length less than or equal to `n`. |
| `.Contains(val any) Condition` | `list.Contains(parameter.x, val)` | True when the array contains the given value. Requires `"list"` import. |

#### `MapParam` / `StringKeyMap` runtime conditions

| Method | CUE generated | Description |
|---|---|---|
| `.IsSet() Condition` | `parameter["x"] != _|_` | True when the map was supplied. |
| `.IsNotEmpty() Condition` | `len(parameter.x) > 0` | True when present and non-empty. |
| `.IsEmpty() Condition` | two `if` blocks: absent OR empty | Same two-block rendering as `ArrayParam.IsEmpty()`. |
| `.HasKey(key string) Condition` | `parameter.x.key != _|_` | True when the map contains the named key. Available on `*MapParam` and `*StringKeyMapParam`. |
| `.LenEq(n int) Condition` | `len(parameter.x) == n` | Exact entry count. `LenEq(0)` equivalent to `IsEmpty()`. |
| `.LenGt(n int) Condition` | `len(parameter.x) > n` | Entry count greater than `n`. |

### Struct field access

`defkit.Struct(name)` and `defkit.Object(name)` / `defkit.Map(name)` expose a `.Field(fieldPath string)` method that returns a `*ParamFieldRef`. This can be used as a `Value` in `.Set()` positions or tested with `.IsSet()` and `.Eq()` in condition positions.

| Method | CUE generated | Description |
|---|---|---|
| `structParam.Field("x") *ParamFieldRef` | `parameter.struct.x` | Reference to a nested field. |
| `mapParam.Field("x") *ParamFieldRef` | `parameter.map.x` | Same as above for `Map`/`Object`. |
| `ref.IsSet() Condition` | `parameter.struct.x != _|_` | Presence check on the nested field. |
| `ref.Eq(val any) Condition` | `parameter.struct.x == val` | Equality check on the nested field. |
| `ref.Ne(val any) Condition` | `parameter.struct.x != val` | Inequality check. |

## Example: scalar parameters

The example below exercises every scalar type and most chain methods in a single ComponentDefinition. The sections above describe each method individually; this puts them together to show how the chain combinations interact and what CUE the generator emits.

A few patterns worth noting:

- **`Bool` always uses `Default(true|false)`** (or `Required()`), never `Optional()`. An optional Bool without a default has no usable value when omitted, and conditions like `IsTrue()`/`IsFalse()` silently degrade to bottom.
- **Non-string params (`Int`, `Bool`, `Float`, and arithmetic results) are wrapped in `defkit.Interpolation(p)`** when written into ConfigMap `data.*`. ConfigMap's `data` schema is `map[string]string`, and `Interpolation` renders as CUE `"\(parameter.p)"` to coerce the value into its string form. `String` and `Enum` params are passed through directly.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import (
	"github.com/oam-dev/kubevela/pkg/definition/defkit"
)

func init() {
	defkit.Register(ScalarShowcase())
}

// ScalarShowcase demonstrates all scalar parameter types and their chain method
// combinations: plain, with defaults, required, constraints, descriptions,
// short aliases, ignore, and conditional usage in the template. Optional() is
// shown on String/Int/Float; Bool uses Default(true|false) instead — an
// optional Bool without a default has no usable value when omitted.
//
// Non-string params (Bool, Int, Float, and Int/Float arithmetic results) are
// written into ConfigMap data.* via defkit.Interpolation(p), which renders as
// `"\(parameter.p)"` — CUE coerces the value into its string form so it
// satisfies ConfigMap's `data: map[string]string` schema. String and Enum
// params can be passed directly since they're already strings.
func ScalarShowcase() *defkit.ComponentDefinition {
	// ── String params ──────────────────────────────────────────────

	// Plain — bare string, no modifiers
	name := defkit.String("name")

	// Default + Description + Short alias
	image := defkit.String("image").
		Default("nginx:latest").
		Description("Container image").
		Short("i")

	// Required + NotEmpty — user must provide a non-empty value
	tag := defkit.String("tag").
		Required().
		Description("Image tag").
		NotEmpty()

	// Optional — explicitly optional
	comment := defkit.String("comment").
		Optional().
		Description("Freeform comment")

	// Pattern + MinLen + MaxLen — regex and length constraints
	hostname := defkit.String("hostname").
		Pattern("^[a-z0-9-]+$").
		MinLen(1).
		MaxLen(63).
		Description("RFC 1123 hostname")

	// Values (closed enum) + Default
	protocol := defkit.String("protocol").
		Values("TCP", "UDP", "SCTP").
		Default("TCP").
		Description("Network protocol")

	// Values + OpenEnum — extensible enum
	logLevel := defkit.String("logLevel").
		Values("debug", "info", "warn", "error").
		OpenEnum().
		Default("info").
		Description("Log level (extensible)")

	// Ignore — hidden from vela show
	internalNote := defkit.String("internalNote").
		Ignore().
		Description("Internal use only")

	// ── Int params ─────────────────────────────────────────────────

	// Plain — bare int
	port := defkit.Int("port")

	// Default + Min + Max + Description + Short
	replicas := defkit.Int("replicas").
		Default(1).
		Min(1).
		Max(100).
		Description("Replica count").
		Short("r")

	// Required
	maxRetries := defkit.Int("maxRetries").
		Required().
		Description("Max retry attempts")

	// Optional
	priority := defkit.Int("priority").
		Optional().
		Description("Scheduling priority")

	// ── Bool params ────────────────────────────────────────────────

	// Plain — bare bool
	enable := defkit.Bool("enable")

	// Default + Description
	debug := defkit.Bool("debug").
		Default(false).
		Description("Enable debug mode")

	// Required
	tls := defkit.Bool("tls").
		Required().
		Description("Force TLS")

	// Default(true) + Description — defaults to verbose mode on
	verbose := defkit.Bool("verbose").
		Default(true).
		Description("Verbose logging")

	// ── Float params ───────────────────────────────────────────────

	// Plain — bare float
	weight := defkit.Float("weight")

	// Default + Min + Max + Description
	ratio := defkit.Float("ratio").
		Default(0.5).
		Min(0.0).
		Max(1.0).
		Description("Traffic ratio")

	// Required
	threshold := defkit.Float("threshold").
		Required().
		Description("Alert threshold")

	// Optional
	cpuLimit := defkit.Float("cpuLimit").
		Optional().
		Description("CPU limit in cores")

	// ── Enum params ────────────────────────────────────────────────

	// Values + Default
	env := defkit.Enum("env").
		Values("dev", "staging", "prod").
		Default("dev").
		Description("Deployment environment")

	// Values + Required
	region := defkit.Enum("region").
		Values("us-east", "us-west", "eu-west").
		Required().
		Description("Cloud region")

	// ── Build the definition ───────────────────────────────────────

	return defkit.NewComponent("scalar-showcase").
		Description("Demonstrates all scalar parameter types and chain method combinations").
		Workload("v1", "ConfigMap").
		OmitWorkloadType().
		Params(
			// Strings
			name, image, tag, comment, hostname, protocol, logLevel, internalNote,
			// Ints
			port, replicas, maxRetries, priority,
			// Bools
			enable, debug, tls, verbose,
			// Floats
			weight, ratio, threshold, cpuLimit,
			// Enums
			env, region,
		).
		Template(func(tpl *defkit.Template) {
			vela := defkit.VelaCtx()

			cm := defkit.NewResource("v1", "ConfigMap").
				Set("metadata.name", vela.Name()).
				Set("metadata.namespace", vela.Namespace()).
				// ── Plain values ──
				Set("data.name", name).
				Set("data.image", image).
				Set("data.tag", tag).
				Set("data.hostname", hostname).
				Set("data.protocol", protocol).
				Set("data.logLevel", logLevel).
				Set("data.internalNote", internalNote).
				// Ints coerced to string via Interpolation — ConfigMap data is map[string]string
				Set("data.port", defkit.Interpolation(port)).
				Set("data.replicas", defkit.Interpolation(replicas)).
				Set("data.maxRetries", defkit.Interpolation(maxRetries)).
				// Bools coerced to string via Interpolation
				Set("data.enable", defkit.Interpolation(enable)).
				Set("data.debug", defkit.Interpolation(debug)).
				Set("data.tls", defkit.Interpolation(tls)).
				Set("data.verbose", defkit.Interpolation(verbose)).
				// Floats coerced to string via Interpolation
				Set("data.weight", defkit.Interpolation(weight)).
				Set("data.ratio", defkit.Interpolation(ratio)).
				Set("data.threshold", defkit.Interpolation(threshold)).
				// Strings (Enum has string base) — passed through directly
				Set("data.env", env).
				Set("data.region", region).
				// ── String expression: Prepend ──
				Set("data.fullImage", image.Prepend("registry.io/")).
				// ── String expression: Concat ──
				Set("data.imageWithTag", image.Concat(":v2")).
				// ── Int arithmetic — wrapped in Interpolation to coerce to string ──
				Set("data.maxReplicas", defkit.Interpolation(replicas.Add(5))).
				Set("data.halfReplicas", defkit.Interpolation(replicas.Div(2))).
				// ── Conditional on Bool.IsTrue ──
				SetIf(debug.IsTrue(), "data.debugEnabled", defkit.Lit("true")).
				// ── Conditional on Bool.IsFalse ──
				SetIf(verbose.IsFalse(), "data.quietMode", defkit.Lit("true")).
				// ── Conditional on String.In (runtime condition) ──
				SetIf(protocol.In("UDP", "SCTP"), "data.nonTcpProtocol", defkit.Lit("true")).
				// ── Conditional on Int.Gt ──
				SetIf(replicas.Gt(1), "data.multiReplica", defkit.Lit("true")).
				// ── Conditional on param IsSet / NotSet ──
				SetIf(comment.IsSet(), "data.comment", comment).
				SetIf(priority.IsSet(), "data.priority", defkit.Interpolation(priority)).
				SetIf(cpuLimit.IsSet(), "data.cpuLimit", defkit.Interpolation(cpuLimit))

			tpl.Output(cm)
		})
}
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
import (
	"strings"
)

"scalar-showcase": {
	type: "component"
	annotations: {}
	labels: {}
	description: "Demonstrates all scalar parameter types and chain method combinations"
	attributes: {
		workload: {
			definition: {
				apiVersion: "v1"
				kind:       "ConfigMap"
			}
		}
	}
}
template: {
	output: {
		apiVersion: "v1"
		kind:       "ConfigMap"
		metadata: {
			name: context.name
			namespace: context.namespace
		}
		data: {
			name: parameter.name
			image: parameter.image
			tag: parameter.tag
			hostname: parameter.hostname
			protocol: parameter.protocol
			logLevel: parameter.logLevel
			internalNote: parameter.internalNote
			port: "\(parameter.port)"
			replicas: "\(parameter.replicas)"
			maxRetries: "\(parameter.maxRetries)"
			enable: "\(parameter.enable)"
			debug: "\(parameter.debug)"
			tls: "\(parameter.tls)"
			verbose: "\(parameter.verbose)"
			weight: "\(parameter.weight)"
			ratio: "\(parameter.ratio)"
			threshold: "\(parameter.threshold)"
			env: parameter.env
			region: parameter.region
			fullImage: "registry.io/" + parameter.image
			imageWithTag: parameter.image + ":v2"
			maxReplicas: "\(parameter.replicas + 5)"
			halfReplicas: "\(parameter.replicas / 2)"
			if !parameter.verbose {
				quietMode: "true"
			}
			if parameter.debug {
				debugEnabled: "true"
			}
			if parameter.protocol == "UDP" || parameter.protocol == "SCTP" {
				nonTcpProtocol: "true"
			}
			if parameter.replicas > 1 {
				multiReplica: "true"
			}
			if parameter["comment"] != _|_ {
				comment: parameter.comment
			}
			if parameter["cpuLimit"] != _|_ {
				cpuLimit: "\(parameter.cpuLimit)"
			}
			if parameter["priority"] != _|_ {
				priority: "\(parameter.priority)"
			}
		}
	}
	parameter: {
		name: string
		// +usage=Container image
		// +short=i
		image: *"nginx:latest" | string
		// +usage=Image tag
		tag!: string & !=""
		// +usage=Freeform comment
		comment?: string
		// +usage=RFC 1123 hostname
		hostname: string & =~"^[a-z0-9-]+$" & strings.MinRunes(1) & strings.MaxRunes(63)
		// +usage=Network protocol
		protocol: *"TCP" | "UDP" | "SCTP"
		// +usage=Log level (extensible)
		logLevel: *"info" | "debug" | "warn" | "error" | string
		// +ignore
		// +usage=Internal use only
		internalNote: string
		port: int
		// +usage=Replica count
		// +short=r
		replicas: *1 | int & >=1 & <=100
		// +usage=Max retry attempts
		maxRetries!: int
		// +usage=Scheduling priority
		priority?: int
		enable: bool
		// +usage=Enable debug mode
		debug: *false | bool
		// +usage=Force TLS
		tls!: bool
		// +usage=Verbose logging
		verbose: *true | bool
		weight: float
		// +usage=Traffic ratio
		ratio: *0.5 | number & >=0 & <=1
		// +usage=Alert threshold
		threshold!: float
		// +usage=CPU limit in cores
		cpuLimit?: float
		// +usage=Deployment environment
		env: *"dev" | "staging" | "prod"
		// +usage=Cloud region
		region!: "us-east" | "us-west" | "eu-west"
	}
}
```

</TabItem>
</Tabs>

## Example: collections

Let's build a `collection-types-demo` component with one parameter of each collection type:

- `tags`: a `StringList`. The template reads `tags[0]`, so it guards with `.IsNotEmpty()`; `.IsSet()` would also be true for `tags: []`, and the index would fail.
- `allowedPorts`: an `IntList`.
- `ports`: an `Array().WithFields(...)` limited to 1-20 items with `.MinItems(1).MaxItems(20)`, rendered as container ports and filtered onto the Service.
- `labels`: a `StringKeyMap`, set on the Deployment.
- `annotations`: a `Map().Of(ParamTypeString)`, the same CUE shape as `StringKeyMap`.
- `config`: a `Map().WithFields(...)`, read with `config.Field("logLevel")` into a pod label.

Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func CollectionTypesDemo() *defkit.ComponentDefinition {
    tags := defkit.StringList("tags").
        Optional().
        Description("Arbitrary string tags attached to the workload")

    allowedPorts := defkit.IntList("allowedPorts").
        Optional().
        Description("Allowlist of port numbers")

    ports := defkit.Array("ports").
        WithFields(
            defkit.Int("port"),
            defkit.String("name").Optional(),
            defkit.Bool("expose").Default(false),
        ).
        MinItems(1).
        MaxItems(20).
        Optional().
        Description("Container ports; set expose=true to publish via Service")

    labels := defkit.StringKeyMap("labels").
        Optional().
        Description("Metadata labels spread onto the Deployment")

    annotations := defkit.Map("annotations").
        Of(defkit.ParamTypeString).
        Optional().
        Description("Metadata annotations; identical CUE shape to StringKeyMap")

    config := defkit.Map("config").
        WithFields(
            defkit.String("logLevel").Default("info"),
            defkit.String("outputFormat").Optional(),
        ).
        Optional().
        Description("Structured config object with known fields")

    return defkit.NewComponent("collection-types-demo").
        Description("Demonstrates StringList, IntList, Array, List, StringKeyMap, Map, and DynamicMap parameter constructors with their runtime conditions").
        Workload("apps/v1", "Deployment").
        Params(tags, allowedPorts, ports, labels, annotations, config).
        Template(collectionTypesDemoTemplate).
        WithImports("list")
}

func collectionTypesDemoTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()

    tags         := defkit.StringList("tags")
    _             = defkit.IntList("allowedPorts")
    ports        := defkit.Array("ports").WithFields(
        defkit.Int("port"),
        defkit.String("name").Optional(),
        defkit.Bool("expose").Default(false),
    )
    labels       := defkit.StringKeyMap("labels")
    annotations  := defkit.Map("annotations").Of(defkit.ParamTypeString)
    config       := defkit.Map("config").WithFields(
        defkit.String("logLevel"),
        defkit.String("outputFormat").Optional(),
    )

    containerPorts := defkit.NewArray().ForEachWith(ports, func(item *defkit.ItemBuilder) {
        v := item.Var()
        item.Set("containerPort", v.Field("port"))
        item.IfSet("name", func() { item.Set("name", v.Field("name")) })
    })

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        SetIf(labels.IsSet(), "metadata.labels", labels).
        SetIf(annotations.IsSet(), "metadata.annotations", annotations).
        SetIf(config.IsSet(), "spec.template.metadata.labels[log-level]", config.Field("logLevel")).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        SetIf(tags.IsNotEmpty(), "spec.template.metadata.labels[tags]", defkit.ParamRef("tags[0]")).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", defkit.Lit("nginx:stable")).
        SetIf(ports.IsSet(), "spec.template.spec.containers[0].ports", containerPorts)

    tpl.Output(dep)

    svc := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        Set("spec.ports", defkit.NewArray().ForEachWithGuardedFiltered(
            ports.IsSet(),
            defkit.FieldEquals("expose", true),
            ports,
            func(item *defkit.ItemBuilder) {
                v := item.Var()
                item.Set("port", v.Field("port"))
                item.Set("targetPort", v.Field("port"))
                item.IfSet("name", func() { item.Set("name", v.Field("name")) })
            }))
    tpl.OutputsIf(ports.IsSet(), "service", svc)
}

func init() { defkit.Register(CollectionTypesDemo()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
import (
  "list"
)

"collection-types-demo": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Demonstrates StringList, IntList, Array, List, StringKeyMap, Map, and DynamicMap parameter constructors with their runtime conditions"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
      }
      type: "deployments.apps"
    }
  }
}
template: {
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: {
      name: context.name
      if parameter["annotations"] != _|_ {
        annotations: parameter.annotations
      }
      if parameter["labels"] != _|_ {
        labels: parameter.labels
      }
    }
    spec: {
      template: {
        metadata: {
          labels: {
            "app.oam.dev/component": context.name
            if parameter["config"] != _|_ {
              "log-level": parameter.config.logLevel
            }
            if parameter["tags"] != _|_ if len(parameter["tags"]) > 0 {
              "tags": parameter.tags[0]
            }
          }
        }
        spec: {
          containers: [{
            name:  context.name
            image: "nginx:stable"
            if parameter["ports"] != _|_ {
              ports: [for v in parameter.ports {
                containerPort: v.port
                if v.name != _|_ { name: v.name }
              }]
            }
          }]
        }
      }
      selector: matchLabels: "app.oam.dev/component": context.name
    }
  }
  outputs: {
    if parameter["ports"] != _|_ {
      service: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: name: context.name
        spec: {
          selector: "app.oam.dev/component": context.name
          ports: [
            if parameter["ports"] != _|_ for v in parameter.ports if v.expose == true {
              port:       v.port
              targetPort: v.port
              if v.name != _|_ { name: v.name }
            },
          ]
        }
      }
    }
  }
  parameter: {
    // +usage=Arbitrary string tags attached to the workload
    tags?: [...string]
    // +usage=Allowlist of port numbers
    allowedPorts?: [...int]
    // +usage=Container ports; set expose=true to publish via Service
    ports?: list.MinItems(1) & list.MaxItems(20) & [...{
      port:    int
      name?:   string
      expose:  *false | bool
    }]
    // +usage=Metadata labels spread onto the Deployment
    labels?: [string]: string
    // +usage=Metadata annotations; identical CUE shape to StringKeyMap
    annotations?: [string]: string
    // +usage=Structured config object with known fields
    config?: {
      logLevel:      *"info" | string
      outputFormat?: string
    }
  }
}
```

</TabItem>
<TabItem value="application" label="Application YAML">

```yaml title="collection-types-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: collection-types-app
  namespace: default
spec:
  components:
    - name: collection-types
      type: collection-types-demo
      properties:
        tags:
          - backend
          - v2
        allowedPorts:
          - 8080
          - 9090
        ports:
          - port: 8080
            name: http
            expose: true
          - port: 9090
            name: metrics
            expose: false
        labels:
          env: staging
          team: platform
        annotations:
          owner: platform-team
        config:
          logLevel: debug
          outputFormat: json
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

### Apply and verify

Apply the definition and the Application YAML above against a live cluster:

```shell
vela def apply ./generated-cue/components/collection-types-demo.cue
vela up -f collection-types-app.yaml
vela status collection-types-app --namespace default
```

```
NAME                   COMPONENT          TYPE                    PHASE     HEALTHY   STATUS   AGE
collection-types-app   collection-types   collection-types-demo   running   true               3m14s
```

Once the Application reaches `running`, inspect the rendered resources to confirm each collection type. Output below was captured live against a k3d cluster:

```shell
$ kubectl get deployment collection-types -n default \
    -o jsonpath='{.spec.template.spec.containers[0].ports}' \
  | python3 -m json.tool
[
    {
        "containerPort": 8080,
        "name": "http",
        "protocol": "TCP"
    },
    {
        "containerPort": 9090,
        "name": "metrics",
        "protocol": "TCP"
    }
]

$ kubectl get service collection-types -n default \
    -o jsonpath='{.spec.ports}' \
  | python3 -m json.tool
[
    {
        "name": "http",
        "port": 8080,
        "protocol": "TCP",
        "targetPort": 8080
    }
]

$ kubectl get deployment collection-types -n default \
    -o jsonpath='labels={.metadata.labels.env},{.metadata.labels.team} pod-labels={.spec.template.metadata.labels}'
labels=staging,platform pod-labels={"app.oam.dev/component":"collection-types","log-level":"debug","tags":"backend"}
```

What to check:

- The pod has the label `tags=backend`, from `tags[0]`. `tags: []` is skipped, not an index error, because `IsNotEmpty()` checks presence and length (`parameter["tags"] != _|_ if len(parameter["tags"]) > 0`).
- `allowedPorts` only shapes the schema: `[...int]` rejects a non-integer entry when the Application is applied.
- `ports` is limited by `list.MinItems(1) & list.MaxItems(20)` in the `parameter:` block.
- The Deployment has the labels `env=staging` and `team=platform`, from `labels`.
- The Deployment has the annotation `owner=platform-team`, from `annotations`, whose CUE is the same `[string]: string` as a `StringKeyMap`.
- The pod has the label `log-level=debug`: `config.Field("logLevel")` resolves to `parameter.config.logLevel`.
- The Service has only port `8080`. Port `9090` has `expose: false`, and `FieldEquals("expose", true)` filters it out.

Clean up afterwards:

```shell
vela delete collection-types-app --namespace default --yes
kubectl delete componentdefinition collection-types-demo -n vela-system
```

## Example: structs and unions

The `complex-types-demo` component exercises all four complex-type constructors in a single definition:

- `Struct("resources").WithFields(Field("cpu", ParamTypeString), Field("memory", ParamTypeString), Field("gpu", ParamTypeInt))` shows `Field`, `Default`, `Optional` and the `ParamType*` constants.
- `Object("config").WithFields(String("logLevel"), String("outputFormat"))` shows `Object` with the param constructors and `.Field()` access in the template.
- `OneOf("storage").Variants(Variant("emptyDir"), Variant("pvc"))` generates the enum selector plus conditional sibling fields.
- `ClosedUnion("endpoint").Options(ClosedStruct().WithFields(...), ClosedStruct().WithFields(...))` emits a closed struct disjunction, with a literal `type` in each option so CUE can tell them apart.

 Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func ComplexTypesDemo() *defkit.ComponentDefinition {
    resources := defkit.Struct("resources").
        Optional().
        Description("CPU and memory requirements for the container").
        WithFields(
            defkit.Field("cpu", defkit.ParamTypeString).Default("100m"),
            defkit.Field("memory", defkit.ParamTypeString).Default("128Mi"),
            defkit.Field("gpu", defkit.ParamTypeInt).Optional(),
        )

    config := defkit.Object("config").
        Optional().
        Description("Application configuration").
        WithFields(
            defkit.String("logLevel").Default("info"),
            defkit.String("outputFormat").Optional(),
        )

    storage := defkit.OneOf("storage").
        Optional().
        Description("Storage backend for the workload").
        Variants(
            defkit.Variant("emptyDir").WithFields(
                defkit.Field("sizeLimit", defkit.ParamTypeString).Optional(),
            ),
            defkit.Variant("pvc").WithFields(
                defkit.Field("size", defkit.ParamTypeString),
                defkit.Field("storageClass", defkit.ParamTypeString).Default("standard"),
            ),
        )

    endpoint := defkit.ClosedUnion("endpoint").
        Optional().
        Description("Endpoint exposure mode: either a ClusterIP or a NodePort").
        Options(
            defkit.ClosedStruct().WithFields(
                defkit.Field("type", defkit.ParamTypeString).Values("ClusterIP"),
                defkit.Field("port", defkit.ParamTypeInt),
            ),
            defkit.ClosedStruct().WithFields(
                defkit.Field("type", defkit.ParamTypeString).Values("NodePort"),
                defkit.Field("port", defkit.ParamTypeInt),
                defkit.Field("nodePort", defkit.ParamTypeInt).Optional(),
            ),
        )

    return defkit.NewComponent("complex-types-demo").
        Description("Demonstrates Struct, Object, OneOf/Variant, ClosedUnion/ClosedStruct, and Field/ParamType constants").
        Workload("apps/v1", "Deployment").
        Params(resources, config, storage, endpoint).
        Template(complexTypesDemoTemplate)
}

func complexTypesDemoTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()

    resources := defkit.Struct("resources").WithFields(
        defkit.Field("cpu", defkit.ParamTypeString),
        defkit.Field("memory", defkit.ParamTypeString),
        defkit.Field("gpu", defkit.ParamTypeInt).Optional(),
    )
    config := defkit.Object("config").WithFields(
        defkit.String("logLevel"),
        defkit.String("outputFormat").Optional(),
    )
    storage := defkit.OneOf("storage")

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", defkit.Lit("nginx:stable")).
        SetIf(resources.IsSet(), "spec.template.spec.containers[0].resources.requests.cpu",
            resources.Field("cpu")).
        SetIf(resources.IsSet(), "spec.template.spec.containers[0].resources.requests.memory",
            resources.Field("memory")).
        SetIf(config.IsSet(), "spec.template.metadata.labels[log-level]",
            config.Field("logLevel")).
        SetIf(storage.IsSet(), "spec.template.metadata.labels[storage-type]",
            storage)

    tpl.Output(dep)
}

func init() { defkit.Register(ComplexTypesDemo()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
"complex-types-demo": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Demonstrates Struct, Object, OneOf/Variant, ClosedUnion/ClosedStruct, and Field/ParamType constants"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
      }
      type: "deployments.apps"
    }
  }
}
template: {
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: name: context.name
    spec: {
      selector: matchLabels: "app.oam.dev/component": context.name
      template: {
        metadata: labels: {
          "app.oam.dev/component": context.name
          if parameter["config"] != _|_ {
            "log-level": parameter.config.logLevel
          }
          if parameter["storage"] != _|_ {
            "storage-type": parameter.storage
          }
        }
        spec: containers: [{
          name:  context.name
          image: "nginx:stable"
          if parameter["resources"] != _|_ {
            resources: requests: {
              cpu:    parameter.resources.cpu
              memory: parameter.resources.memory
            }
          }
        }]
      }
    }
  }
  parameter: {
    // +usage=CPU and memory requirements for the container
    resources?: {
      cpu:    *"100m" | string
      memory: *"128Mi" | string
      gpu?:   int
    }
    // +usage=Application configuration
    config?: {
      logLevel:      *"info" | string
      outputFormat?: string
    }
    // +usage=Storage backend for the workload
    storage?: "emptyDir" | "pvc"
    if storage == "emptyDir" {
      sizeLimit?: string
    }
    if storage == "pvc" {
      size:         string
      storageClass: *"standard" | string
    }

    // +usage=Endpoint exposure mode: either a ClusterIP or a NodePort
    endpoint?: close({
      type: "ClusterIP"
      port: int
    }) | close({
      type:      "NodePort"
      port:      int
      nodePort?: int
    })
  }
}
```

</TabItem>
<TabItem value="application" label="Application YAML">

```yaml title="complex-types-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: complex-types-app
  namespace: default
spec:
  components:
    - name: complex-types
      type: complex-types-demo
      properties:
        resources:
          cpu: "250m"
          memory: "256Mi"
        config:
          logLevel: debug
          outputFormat: json
        storage: pvc
        size: "10Gi"
        storageClass: standard
        endpoint:
          type: ClusterIP
          port: 8080
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

### Apply and verify

Apply the definition and the Application YAML above against a live cluster:

```shell
vela def apply ./generated-cue/components/complex-types-demo.cue
vela up -f complex-types-app.yaml
vela status complex-types-app --namespace default
```

```
About:

  Name:         complex-types-app
  Namespace:    default
  Healthy:      true
  Details:      running

Services:

  - Name: complex-types
    Cluster: local
    Namespace: default
    Type: complex-types-demo
    Health: true
    No trait applied
```

Once the Application reaches `running`, inspect the rendered Deployment to confirm that `resources`, `config`, and `storage` landed correctly. `endpoint` is a schema-only demonstration here; see the note after the captured output. Output below was captured live against a k3d cluster:

```shell
$ kubectl get deployment complex-types -n default \
    -o jsonpath='{.spec.template.spec.containers[0].resources}' \
  | python3 -m json.tool
{
    "requests": {
        "cpu": "250m",
        "memory": "256Mi"
    }
}

$ kubectl get deployment complex-types -n default \
    -o jsonpath='{.spec.template.metadata.labels}' \
  | python3 -m json.tool
{
    "app.oam.dev/component": "complex-types",
    "log-level": "debug",
    "storage-type": "pvc"
}

$ kubectl get deployment complex-types -n default \
    -o jsonpath='NAME={.metadata.name} READY={.status.readyReplicas}/{.status.replicas}'
NAME=complex-types READY=1/1
```

`resources.Field("cpu")` resolves to `parameter.resources.cpu` and lands `250m` in the container resource requests. `config.Field("logLevel")` resolves to `parameter.config.logLevel` and writes `log-level=debug` as a pod label. `storage: pvc` activates the `pvc` branch of the `OneOf` enum, making `size` and `storageClass` required and writing `storage-type=pvc` as a pod label via `storage.IsSet()`.

The `endpoint` `ClosedUnion` parameter is **schema-only** in this template. The Application's `endpoint: { type: ClusterIP, port: 8080 }` is validated against the closed disjunction, but `complexTypesDemoTemplate` never reads it, so it doesn't appear on the rendered Deployment. `ClosedUnionParam` has no `.Field()` accessor like `Struct.Field()` and `Object.Field()`, because each option can declare a different set of fields. To read an inner value in a template, use `defkit.Reference("parameter.endpoint.type")`.

Because each option has a literal `type`, an `endpoint` that mixes the two shapes is refused. Change the Application to:

```yaml
        endpoint:
          type: ClusterIP
          port: 8080
          nodePort: 30080
```

and `vela up` fails, with CUE reporting why neither option matches:

```
parameter.endpoint: 2 errors in empty disjunction:
parameter.endpoint.nodePort: field not allowed
parameter.endpoint.type: conflicting values "NodePort" and "ClusterIP"
```

Clean up afterwards:

```shell
vela delete complex-types-app --namespace default --yes
kubectl delete componentdefinition complex-types-demo -n vela-system
```

## Example: chain methods

The `chain-methods-demo` component exercises every table in this document. From **Common chain methods**: `image.Required().Short("i").Description(...)` and `readOnly.Default(false)`. From **String constraints**: `appName.Optional().Pattern(...).MinLen(1).MaxLen(48)` and `env.Values("dev","staging","prod").Default("dev")`. From **Numeric constraints**: `replicas.Default(1).Min(1).Max(20)`. From **Array constraints**: `ports.MinItems(1).MaxItems(10)`. From **String expressions**: `appName.Concat("-svc")` and `appName.Prepend("platform-")`. From **Arithmetic expressions**: `replicas.Add(10)` lands in `spec.minReadySeconds`. From **Runtime conditions**: `labels.IsSet()`, `readOnly.IsTrue()`, `readOnly.IsFalse()`, `ports.IsSet()`, `appName.IsSet()`, `env.In(...)`, `env.StartsWith(...)`, `env.Contains(...)`, `env.EndsWith(...)`. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func ChainMethodsDemo() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Required().
        Short("i").
        Description("Container image reference (e.g. nginx:1.25)")

    appName := defkit.String("appName").
        Optional().
        Pattern("^[a-z][a-z0-9-]*$").
        MinLen(1).
        MaxLen(48).
        Description("Application name; must match ^[a-z][a-z0-9-]*$")

    env := defkit.String("env").
        Values("dev", "staging", "prod").
        Default("dev").
        Description("Deployment environment")

    replicas := defkit.Int("replicas").
        Default(1).
        Min(1).
        Max(20).
        Description("Number of pod replicas")

    logLevel := defkit.Enum("logLevel").
        Values("debug", "info", "warn", "error").
        Default("info").
        Description("Log verbosity level")

    labels := defkit.StringKeyMap("labels").
        Optional().
        Description("Arbitrary metadata labels spread onto the Deployment")

    ports := defkit.Array("ports").
        WithFields(
            defkit.Int("port"),
            defkit.String("name").Optional(),
        ).
        MinItems(1).
        MaxItems(10).
        Optional().
        Description("Container ports; at least one required when provided")

    readOnly := defkit.Bool("readOnly").
        Default(false).
        Description("Mount root filesystem read-only")

    return defkit.NewComponent("chain-methods-demo").
        Description("Exercises chain methods across all parameter types").
        Workload("apps/v1", "Deployment").
        Params(image, appName, env, replicas, logLevel, labels, ports, readOnly).
        Template(chainMethodsDemoTemplate).
        WithImports("list", "strings")
}

func chainMethodsDemoTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()

    image   := defkit.String("image")
    appName := defkit.String("appName")
    env     := defkit.String("env")
    replicas := defkit.Int("replicas")
    labels  := defkit.StringKeyMap("labels")
    ports   := defkit.Array("ports").WithFields(
        defkit.Int("port"),
        defkit.String("name").Optional(),
    )
    readOnly := defkit.Bool("readOnly")

    containerPorts := defkit.NewArray().ForEachWith(ports, func(item *defkit.ItemBuilder) {
        v := item.Var()
        item.Set("containerPort", v.Field("port"))
        item.IfSet("name", func() { item.Set("name", v.Field("name")) })
    })

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.replicas", replicas).
        Set("spec.minReadySeconds", replicas.Add(10)).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        SetIf(labels.IsSet(),   "metadata.labels", labels).
        SetIf(appName.IsSet(),  "spec.template.metadata.labels[app-name]", appName.Concat("-svc")).
        SetIf(appName.IsSet(),  "spec.template.metadata.labels[prefixed-name]", appName.Prepend("platform-")).
        SetIf(env.In("staging", "prod"),  "spec.template.metadata.labels[tier]",         defkit.Lit("production")).
        SetIf(env.StartsWith("dev"),      "spec.template.metadata.labels[env-class]",    defkit.Lit("non-prod")).
        SetIf(env.Contains("prod"),       "spec.template.metadata.labels[is-prod]",      defkit.Lit("true")).
        SetIf(env.EndsWith("ing"),        "spec.template.metadata.labels[is-transient]", defkit.Lit("true")).
        Set("spec.template.spec.containers[0].name",  vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        SetIf(readOnly.IsTrue(),  "spec.template.spec.containers[0].securityContext.readOnlyRootFilesystem", defkit.Lit(true)).
        SetIf(readOnly.IsFalse(), "spec.template.spec.containers[0].securityContext.readOnlyRootFilesystem", defkit.Lit(false)).
        SetIf(ports.IsSet(), "spec.template.spec.containers[0].ports", containerPorts).
        Set("spec.template.spec.containers[0].resources.requests.cpu", defkit.Lit("100m")).
        Set("spec.template.spec.containers[0].resources.limits.cpu",   defkit.Lit("200m"))

    tpl.Output(dep)
}

func init() { defkit.Register(ChainMethodsDemo()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
import (
  "list"
  "strings"
)

"chain-methods-demo": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Exercises chain methods across all parameter types"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
      }
      type: "deployments.apps"
    }
  }
}
template: {
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: {
      name: context.name
      if parameter["labels"] != _|_ {
        labels: parameter.labels
      }
    }
    spec: {
      replicas:        parameter.replicas
      minReadySeconds: parameter.replicas + 10
      selector: matchLabels: "app.oam.dev/component": context.name
      template: {
        metadata: labels: {
          "app.oam.dev/component": context.name
          if parameter.env == "staging" || parameter.env == "prod" {
            "tier": "production"
          }
          if parameter["appName"] != _|_ {
            "app-name":      parameter.appName + "-svc"
            "prefixed-name": "platform-" + parameter.appName
          }
          if strings.Contains(parameter.env, "prod") {
            "is-prod": "true"
          }
          if strings.HasPrefix(parameter.env, "dev") {
            "env-class": "non-prod"
          }
          if strings.HasSuffix(parameter.env, "ing") {
            "is-transient": "true"
          }
        }
        spec: containers: [{
          name:  context.name
          image: parameter.image
          if !parameter.readOnly {
            securityContext: readOnlyRootFilesystem: false
          }
          if parameter.readOnly {
            securityContext: readOnlyRootFilesystem: true
          }
          resources: {
            requests: cpu: "100m"
            limits:   cpu: "200m"
          }
          if parameter["ports"] != _|_ {
            ports: [for v in parameter.ports {
              containerPort: v.port
              if v.name != _|_ { name: v.name }
            }]
          }
        }]
      }
    }
  }
  parameter: {
    // +usage=Container image reference (e.g. nginx:1.25)
    // +short=i
    image!: string
    // +usage=Application name; must match ^[a-z][a-z0-9-]*$
    appName?: string & =~"^[a-z][a-z0-9-]*$" & strings.MinRunes(1) & strings.MaxRunes(48)
    // +usage=Deployment environment
    env: *"dev" | "staging" | "prod"
    // +usage=Number of pod replicas
    replicas: *1 | int & >=1 & <=20
    // +usage=Log verbosity level
    logLevel: *"info" | "debug" | "warn" | "error"
    // +usage=Arbitrary metadata labels spread onto the Deployment
    labels?: [string]: string
    // +usage=Container ports; at least one required when provided
    ports?: list.MinItems(1) & list.MaxItems(10) & [...{
      port:  int
      name?: string
    }]
    // +usage=Mount root filesystem read-only
    readOnly: *false | bool
  }
}
```

</TabItem>
<TabItem value="application" label="Application YAML">

```yaml title="chain-methods-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: chain-methods-app
  namespace: default
spec:
  components:
    - name: chain-methods
      type: chain-methods-demo
      properties:
        image: nginx:1.25
        appName: my-service
        env: staging
        replicas: 3
        logLevel: debug
        labels:
          team: platform
        ports:
          - port: 8080
            name: http
          - port: 9090
            name: metrics
        readOnly: false
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

### Apply and verify

Apply the definition and the Application YAML above against a live cluster:

```shell
vela def apply ./generated-cue/components/chain-methods-demo.cue
vela up -f chain-methods-app.yaml
vela status chain-methods-app --namespace default
```

```
About:

  Name:       chain-methods-app
  Namespace:  default
  Healthy:    true
  Details:    running

Services:

  - Name: chain-methods
    Cluster: local
    Namespace: default
    Type: chain-methods-demo
    Health: true
    No trait applied
```

Inspect the rendered Deployment to confirm that each chain method produced the expected output. The output below was captured live against a k3d cluster:

```shell
$ kubectl get deployment chain-methods -n default \
    -o jsonpath='{.spec.template.metadata.labels}' \
  | python3 -m json.tool
{
    "app-name": "my-service-svc",
    "app.oam.dev/component": "chain-methods",
    "is-transient": "true",
    "prefixed-name": "platform-my-service",
    "tier": "production"
}

$ kubectl get deployment chain-methods -n default \
    -o jsonpath='replicas={.spec.replicas} minReadySeconds={.spec.minReadySeconds} readOnly={.spec.template.spec.containers[0].securityContext.readOnlyRootFilesystem}'
replicas=3 minReadySeconds=13 readOnly=false

$ kubectl get deployment chain-methods -n default \
    -o jsonpath='NAME={.metadata.name} READY={.status.readyReplicas}/{.status.replicas}'
NAME=chain-methods READY=3/3
```

`env.In("staging","prod")` fires for `env=staging` and writes `tier=production`. `appName.Concat("-svc")` produces `app-name=my-service-svc` and `appName.Prepend("platform-")` produces `prefixed-name=platform-my-service`. `env.EndsWith("ing")` fires for `staging` and writes `is-transient=true`. `replicas=3` with `.Add(10)` yields `minReadySeconds=13`. `ports.MinItems(1).MaxItems(10)` is enforced by the CUE schema at apply time; both ports land as `containerPort` entries in the rendered Deployment.

Clean up afterwards:

```shell
vela delete chain-methods-app --namespace default --yes
kubectl delete componentdefinition chain-methods-demo -n vela-system
```

## Related

- [ComponentDefinition](./definition-component.md): define workload types
- [Resource Builder](./resource-builder.md): `NewResource`, `Set`, `SetIf`, array builders
- [ForEachWith / ItemBuilder](./collections-api.md#per-item-builder-foreachwith): per-element builder pattern
- [Value Expressions](./value-expressions.md): `Lit`, `Reference`, `ParamRef`, comparison and logical operators
