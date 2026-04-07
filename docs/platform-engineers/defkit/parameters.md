---
title: Parameter Types
---

This page is a comprehensive reference for all parameter types available in defkit.

:::tip
Parameters define the configurable properties that end users provide in their Application YAML. See [Getting Started](./overview.md) for context on how parameters are used.
:::

## Scalar Types

### String

```go
defkit.String("image").Required().Description("Container image")
defkit.String("tag").Default("latest").Description("Image tag")
defkit.String("name")  // optional by default
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `image: string` | `String("image").Required()` |
| `tag: *"latest" \| string` | `String("tag").Default("latest")` |
| `name?: string` | `String("name")` |

### Int

```go
defkit.Int("replicas").Default(1).Description("Number of replicas")
defkit.Int("port").Required()
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `replicas: *1 \| int` | `Int("replicas").Default(1)` |
| `port: int` | `Int("port").Required()` |

### Bool

```go
defkit.Bool("enabled").Default(true)
defkit.Bool("debug").Default(false)
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `enabled: *true \| bool` | `Bool("enabled").Default(true)` |
| `debug: *false \| bool` | `Bool("debug").Default(false)` |

### Float

```go
defkit.Float("ratio").Default(0.5).Description("Scale ratio")
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `ratio: *0.5 \| float` | `Float("ratio").Default(0.5)` |

## Array Types

### StringList / IntList

Convenience constructors for typed arrays:

```go
defkit.StringList("cmd").Description("Commands")
defkit.IntList("ports")
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `cmd?: [...string]` | `StringList("cmd")` |
| `ports?: [...int]` | `IntList("ports")` |

### List (Untyped)

An array that accepts any element type:

```go
defkit.List("env").Description("Environment variables")
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `env?: [..._]` | `List("env")` |

### List with Fields (Typed Array)

An array of structured objects:

```go
defkit.List("ports").WithFields(
    defkit.Int("port").Required(),
    defkit.String("name"),
    defkit.Enum("protocol").Values("TCP", "UDP").Default("TCP"),
)
```

<details>
<summary>Generated CUE</summary>

```cue
ports?: [...{
    port: int
    name?: string
    protocol: *"TCP" | "UDP"
}]
```

</details>

### OpenArray

An untyped open array parameter:

```go
defkit.OpenArray("items")
```

## Map Types

### Map

A map with configurable value types:

```go
defkit.Map("labels").Description("Labels to apply")
defkit.Map("annotations").Optional()
```

### StringKeyMap

A string-to-string map (common for Kubernetes labels/annotations):

```go
defkit.StringKeyMap("labels").Description("Labels")
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `labels?: [string]: string` | `StringKeyMap("labels")` |

### Object

An open-ended object (accepts any fields):

```go
defkit.Object("config").Description("Configuration object")
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `config?: {...}` | `Object("config")` |

### DynamicMap

A map where the entire parameter is a dynamic key-value structure:

```go
defkit.DynamicMap().ValueType("string")
defkit.DynamicMap().ValueTypeUnion("string", "int")
```

## Struct Types

### Struct with Fields

A structured parameter with named, typed fields:

```go
defkit.Struct("resources").Fields(
    defkit.Field("cpu", defkit.ParamTypeString).Default("100m"),
    defkit.Field("memory", defkit.ParamTypeString).Default("128Mi"),
).Description("Resource limits")
```

<details>
<summary>Generated CUE</summary>

```cue
// +usage=Resource limits
resources?: {
    cpu: *"100m" | string
    memory: *"128Mi" | string
}
```

</details>

### Field Options

```go
defkit.Field("name", defkit.ParamTypeString).Required()
defkit.Field("port", defkit.ParamTypeInt).Default(8080)
defkit.Field("labels", defkit.ParamTypeString).Description("Pod labels")
```

### OpenStruct

Accepts any fields without schema validation:

```go
defkit.OpenStruct()
```

## Union Types

### Enum

A parameter restricted to a set of allowed string values:

```go
defkit.Enum("protocol").Values("TCP", "UDP", "SCTP").Default("TCP")
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `protocol: *"TCP" \| "UDP" \| "SCTP"` | `Enum("protocol").Values("TCP", "UDP", "SCTP").Default("TCP")` |

### OneOf (Discriminated Union)

A parameter that accepts one of several variant shapes:

```go
defkit.OneOf("storage").
    Discriminator("type").
    Variants(
        defkit.Variant("pvc").Fields(
            defkit.Field("size", defkit.ParamTypeString).Required(),
            defkit.Field("storageClass", defkit.ParamTypeString),
        ),
        defkit.Variant("emptyDir").Fields(
            defkit.Field("sizeLimit", defkit.ParamTypeString),
        ),
    )
```

## Parameter Modifiers

All parameter types support these common modifiers:

| Modifier | Description | Example |
|:---------|:-----------|:--------|
| `.Required()` | Must be provided | `String("image").Required()` |
| `.Optional()` | Can be omitted (default) | `String("tag").Optional()` |
| `.Default(value)` | Default value when omitted | `Int("replicas").Default(1)` |
| `.Description(text)` | Documentation for the parameter | `String("image").Description("Container image")` |

### Numeric Constraints

```go
defkit.Int("replicas").Default(1).Min(1).Max(100)
defkit.Float("ratio").Min(0.0).Max(1.0)
```

### String Constraints

```go
defkit.String("name").Pattern("^[a-z]+$")
defkit.String("name").MinLen(1).MaxLen(63)
defkit.String("name").NotEmpty()                    // string & !=""
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `name: string & =~"^[a-z]+$"` | `String("name").Pattern("^[a-z]+$")` |
| `name: string & !=""` | `String("name").NotEmpty()` |

:::tip
For negative regex constraints (CUE `!~`), use a [Validator](#validators) with `LocalField().Matches()` instead of an inline type constraint. For example, to reject strings ending with a hyphen: `Validate("must not end with -").FailWhen(LocalField("region").Matches(".*-$"))`.
:::

### Array Constraints

```go
defkit.Array("ports").MinItems(1).MaxItems(10)
defkit.StringList("origins").NotEmpty()                                        // [...(string & !="")]
defkit.Array("methods").OfEnum("GET", "POST", "PUT", "DELETE")                 // [...("GET" | "POST" | ...)]
defkit.Array("methods").OfEnum("GET", "POST").NonEmpty("at least one method")  // + if len == 0 { error }
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `origins?: [...(string & !="")]` | `StringList("origins").NotEmpty()` |
| `methods?: [...("GET" \| "POST")]` | `Array("methods").OfEnum("GET", "POST")` |

- **`NotEmpty()`** -- constrains each *element* to be non-empty (`!=""`). Same as `StringParam.NotEmpty()` but applied at the element level.
- **`NonEmpty(msg)`** -- validates the *array itself* has at least one item. Named `NonEmpty` (not `NotEmpty`) because `NotEmpty()` is already taken for the element constraint and Go does not support method overloading.
- **`OfEnum(values...)`** -- constrains each element to one of the given values.

### Map Constraints

```go
defkit.Object("governance").Closed()  // close({...}) -- rejects extra fields
```

## Validators

Validators express cross-field validation rules using the CUE `_validate*` block pattern. They emit:

```cue
_validateName: {
    "error message": true
    if <failCondition> {
        "error message": false
    }
}
```

Validators can be attached at three levels:
- **Component-level** -- `defkit.NewComponent(...).Validators(...)`
- **Inside structs** -- `defkit.Object(...).Validators(...)`
- **Inside array elements** -- `defkit.Array(...).Validators(...)`

### Validate / FailWhen / WithName

The core validator builder chain:

```go title="basic_validator.go"
defkit.Validate("tenantName must not end with a hyphen").  // error message
    WithName("_validateTenantName").                        // CUE variable name
    FailWhen(defkit.LocalField("tenantName").Matches(".*-$"))  // condition that triggers failure
```

<details>
<summary>Generated CUE</summary>

```cue
_validateTenantName: {
    "tenantName must not end with a hyphen": true
    if tenantName =~ ".*-$" {
        "tenantName must not end with a hyphen": false
    }
}
```

</details>

### OnlyWhen -- Guarded Validator

A guarded validator is only active when a condition is true. The entire block is wrapped in an `if` guard:

```go title="guarded_validator.go"
defkit.Validate("versioningEnabled must be true when replication is set").
    WithName("_validateVersioning").
    OnlyWhen(defkit.Or(
        defkit.LocalField("replicationConfiguration").IsSet(),
        defkit.LocalField("objectLock").IsSet(),
    )).
    FailWhen(defkit.LocalField("versioningEnabled").Eq(false))
```

<details>
<summary>Generated CUE</summary>

```cue
if replicationConfiguration != _|_ || objectLock != _|_ {
    _validateVersioning: {
        "versioningEnabled must be true when replication is set": true
        if versioningEnabled == false {
            "versioningEnabled must be true when replication is set": false
        }
    }
}
```

</details>

### MapParam.Validators -- Validators Inside Structs

Attach validators to an `Object` parameter. They are emitted inside the struct:

```go title="governance_validators.go"
governance := defkit.Object("governance").Closed().
    WithFields(
        defkit.String("tenantName").NotEmpty(),
        defkit.String("departmentCode").NotEmpty(),
    ).
    Validators(
        defkit.Validate("tenantName must not end with a hyphen").
            WithName("_validateTenantName").
            FailWhen(defkit.LocalField("tenantName").Matches(".*-$")),
        defkit.Validate("departmentCode must be numeric").
            WithName("_validateDeptCode").
            FailWhen(defkit.Not(defkit.LocalField("departmentCode").Matches("^[0-9]+$"))),
    )
```

<details>
<summary>Generated CUE</summary>

```cue
governance: close({
    tenantName: string & !=""
    departmentCode: string & !=""
    _validateTenantName: {
        "tenantName must not end with a hyphen": true
        if tenantName =~ ".*-$" {
            "tenantName must not end with a hyphen": false
        }
    }
    _validateDeptCode: {
        "departmentCode must be numeric": true
        if !(departmentCode =~ "^[0-9]+$") {
            "departmentCode must be numeric": false
        }
    }
})
```

</details>

### ArrayParam.Validators -- Validators Inside Array Elements

Validators on arrays are emitted inside each element struct:

```go title="lifecycle_validators.go"
defkit.Array("lifecycleRules").Optional().
    WithFields(
        defkit.String("id").Optional().NotEmpty(),
        defkit.Array("expiration").Optional().WithFields(...),
        defkit.Array("transition").Optional().WithFields(...),
    ).
    Validators(
        defkit.Validate("id is required").
            WithName("_validateId").
            FailWhen(defkit.LocalField("id").NotSet()),
        defkit.Validate("at least one sub-rule is required").
            WithName("_validateLifecycleRules").
            FailWhen(defkit.And(
                defkit.LocalField("expiration").NotSet(),
                defkit.LocalField("transition").NotSet(),
            )),
    )
```

<details>
<summary>Generated CUE</summary>

```cue
lifecycleRules?: [...{
    id?: string & !=""
    expiration?: [...]
    transition?: [...]
    _validateId: {
        "id is required": true
        if id == _|_ {
            "id is required": false
        }
    }
    _validateLifecycleRules: {
        "at least one sub-rule is required": true
        if expiration == _|_ && transition == _|_ {
            "at least one sub-rule is required": false
        }
    }
}]
```

</details>

### Component-Level Validators

Validators attached to the component are emitted at the top level of the `parameter:` block:

```go title="component_validators.go"
name := defkit.String("name").NotEmpty()

defkit.NewComponent("my-component").
    Params(name).
    Validators(
        defkit.Validate("name is too long").
            WithName("_validateNameLength").
            FailWhen(defkit.LenOf(defkit.Plus(
                defkit.Lit("prefix-"), name,
            )).Gt(63)),
    )
```

### Mutual Exclusion Pattern

A common pattern: two fields where exactly one must be set:

```go title="mutual_exclusion.go"
defkit.Array("Statement").WithFields(
    defkit.Object("Principal").Optional(),
    defkit.Object("NotPrincipal").Optional(),
).Validators(
    defkit.Validate("Either Principal or NotPrincipal is required").
        WithName("_validatePrincipalRequired").
        FailWhen(defkit.And(
            defkit.LocalField("Principal").NotSet(),
            defkit.LocalField("NotPrincipal").NotSet(),
        )),
    defkit.Validate("Principal and NotPrincipal cannot both be set").
        WithName("_validatePrincipalExclusive").
        FailWhen(defkit.And(
            defkit.LocalField("Principal").IsSet(),
            defkit.LocalField("NotPrincipal").IsSet(),
        )),
)
```

### Nested Field and Array Index Access

`LocalField` supports dot-path and array index syntax for cross-field checks across nested structures:

```go title="nested_field_access.go"
// Check a nested field inside a struct
defkit.Validate("Principal must have at least one AWS entry").
    WithName("_validatePrincipalAWS").
    OnlyWhen(defkit.And(
        defkit.LocalField("Principal").IsSet(),
        defkit.LocalField("Principal.AWS").IsSet(),
    )).
    FailWhen(defkit.LocalField("Principal.AWS").IsEmpty())

// Check a field inside the first element of an array
defkit.Validate("transition days must be less than expiration days").
    WithName("_validateTransitionDays").
    OnlyWhen(defkit.LocalField("days").IsSet()).
    FailWhen(defkit.And(
        defkit.LocalField("expiration").IsSet(),
        defkit.LocalField("expiration").LenGt(0),
        defkit.LocalField("expiration[0].days").IsSet(),
        defkit.LocalField("days").Gte(defkit.LocalField("expiration[0].days")),
    ))
```

### Date Comparison with TimeParse

For CUE `time.Parse()` comparisons between date fields:

```go title="date_comparison.go"
defkit.Validate("expiration date must be later than transition date").
    WithName("_validateDateOrder").
    OnlyWhen(defkit.LocalField("date").IsSet()).
    FailWhen(defkit.And(
        defkit.LocalField("expiration").IsSet(),
        defkit.LocalField("expiration").LenGt(0),
        defkit.LocalField("expiration[0].date").IsSet(),
        defkit.TimeParse("2006-01-02T15:04:05Z", defkit.LocalField("date")).Gte(
            defkit.TimeParse("2006-01-02T15:04:05Z", defkit.LocalField("expiration[0].date"))),
    ))
```

<details>
<summary>Generated CUE</summary>

```cue
if date != _|_ {
    _validateDateOrder: {
        "expiration date must be later than transition date": true
        if expiration != _|_ && len(expiration) > 0 && expiration[0].date != _|_ && time.Parse("2006-01-02T15:04:05Z", date) >= time.Parse("2006-01-02T15:04:05Z", expiration[0].date) {
            "expiration date must be later than transition date": false
        }
    }
}
```

</details>

### String Length Validation with LenOf

Validate the length of concatenated strings:

```go title="length_validation.go"
name := defkit.String("name").NotEmpty()

defkit.Validate("combined name must be under 64 characters").
    WithName("_validateNameLength").
    OnlyWhen(existingResources.Eq(false)).
    FailWhen(defkit.LenOf(defkit.Plus(
        defkit.Lit("tenant-"),
        defkit.Reference("parameter.governance.tenantName"),
        defkit.Lit("-"),
        name,
    )).Gt(63))
```

<details>
<summary>Generated CUE</summary>

```cue
if parameter.existingResources == false {
    _validateNameLength: {
        "combined name must be under 64 characters": true
        if len("tenant-" + parameter.governance.tenantName + "-" + parameter.name) > 63 {
            "combined name must be under 64 characters": false
        }
    }
}
```

</details>

### LocalField Reference Summary

| Method | Generated CUE | Description |
|:-------|:-------------|:-----------|
| `LocalField("x").IsSet()` | `x != _\|_` | Field exists |
| `LocalField("x").NotSet()` | `x == _\|_` | Field absent |
| `LocalField("x").Eq("v")` | `x == "v"` | Equality |
| `LocalField("x").Ne("v")` | `x != "v"` | Inequality |
| `LocalField("x").Matches("pat")` | `x =~ "pat"` | Regex match |
| `LocalField("x").IsEmpty()` | `len(x) == 0` | Empty collection |
| `LocalField("x").LenEq(n)` | `len(x) == n` | Length equals |
| `LocalField("x").LenGt(n)` | `len(x) > n` | Length greater than |
| `LocalField("a").Gte(LocalField("b"))` | `a >= b` | Field-to-field comparison |
| `LocalField("a.b").IsSet()` | `a.b != _\|_` | Nested dot-path |
| `LocalField("a[0].b").IsSet()` | `a[0].b != _\|_` | Array index path |

:::caution
`LocalField` is for use inside validators attached to `MapParam.Validators()` or `ArrayParam.Validators()`. For template-level conditions (in `SetIf`, `If/EndIf`), use normal parameter references like `defkit.Bool("enabled").IsSet()`.
:::

## Conditional Parameters

Parameters can change shape -- different fields, different defaults, different optionality -- based on a discriminator value. Use `ConditionalParams` for top-level blocks and `MapParam.ConditionalFields()` for fields inside a struct.

### Top-Level Conditional Blocks

```go title="conditional_params.go"
existingResources := defkit.Bool("existingResources").Default(false)

comp := defkit.NewComponent("my-component").
    Params(existingResources, name).
    ConditionalParams(defkit.ConditionalParams(
        defkit.WhenParam(existingResources.Eq(false)).Params(
            defkit.Bool("forceDestroy").Default(false),
            defkit.Enum("encryption").Default("AES256").Values("AES256", "aws:kms"),
        ).Validators(
            defkit.Validate("invalid encryption config").
                FailWhen(someCondition),
        ),
        defkit.WhenParam(existingResources.Eq(true)).Params(
            defkit.Bool("forceDestroy").Optional(),
            defkit.Enum("encryption").Optional().Values("AES256", "aws:kms"),
        ),
    ))
```

<details>
<summary>Generated CUE</summary>

```cue
parameter: {
    existingResources: *false | bool
    name?: string
    if existingResources == false {
        forceDestroy: *false | bool
        encryption: *"AES256" | "aws:kms"
        _validateEncryption: { ... }
    }
    if existingResources == true {
        forceDestroy?: bool
        encryption?: "AES256" | "aws:kms"
    }
}
```

</details>

### Conditional Fields Inside a Struct

Use `MapParam.ConditionalFields()` when the conditional fields are inside an optional struct:

```go title="conditional_fields.go"
objectLock := defkit.Object("objectLock").Optional().
    ConditionalFields(
        defkit.WhenParam(existingResources.Eq(false)).Params(
            defkit.Int("retentionDays").Optional().Default(45).Min(1),
            defkit.Enum("retentionMode").Optional().Default("GOVERNANCE").
                Values("GOVERNANCE", "COMPLIANCE"),
        ),
        defkit.WhenParam(existingResources.Eq(true)).Params(
            defkit.Int("retentionDays").Min(1),
            defkit.Enum("retentionMode").Values("GOVERNANCE", "COMPLIANCE"),
        ),
    )
```

## Parameters as Expressions

Parameters are not just value holders -- they are expression builders that can be used in conditions and computations.

### Existence Checks

```go
cpu := defkit.String("cpu").Optional()

// Check if parameter was provided
cpu.IsSet()    // true when parameter has a value
cpu.NotSet()   // true when parameter is absent
```

### Comparison Conditions

```go
replicas := defkit.Int("replicas")

replicas.Eq(3)          // replicas == 3
replicas.Ne(0)          // replicas != 0
replicas.Gt(1)          // replicas > 1
replicas.Gte(1)         // replicas >= 1
replicas.Lt(100)        // replicas < 100
replicas.Lte(100)       // replicas <= 100
```

### Arithmetic Expressions

```go
port := defkit.Int("port")

port.Add(1)    // port + 1
port.Sub(1)    // port - 1
port.Mul(2)    // port * 2
port.Div(2)    // port / 2
```

### String Expressions

```go
name := defkit.String("name")

name.Concat("-suffix")   // name + "-suffix"
name.Prepend("prefix-")  // "prefix-" + name
```

### Struct Field Access

Access nested fields within struct parameters:

```go
config := defkit.Struct("config").Fields(
    defkit.Field("enabled", defkit.ParamTypeBool).Default(true),
    defkit.Field("port", defkit.ParamTypeInt).Default(8080),
)

config.Field("enabled")            // reference to config.enabled
config.Field("enabled").IsSet()    // check if config.enabled exists
config.Field("port").Eq(8080)      // config.port == 8080
```

### Boolean Conditions

```go
enabled := defkit.Bool("enabled")

enabled.IsTrue()     // parameter.enabled == true
enabled.IsFalse()    // parameter.enabled == false
```

### String Conditions

```go
env := defkit.String("env")

env.Contains("prod")       // strings.Contains(parameter.env, "prod")
env.StartsWith("staging")  // strings.HasPrefix(parameter.env, "staging")
env.In("dev", "staging", "prod")  // parameter.env in set
```

## CUE Generation Summary

| Go Type | Generated CUE (Required) | Generated CUE (Optional) | With Default |
|:--------|:------------------------|:------------------------|:------------|
| `String` | `name: string` | `name?: string` | `name: *"value" \| string` |
| `Int` | `name: int` | `name?: int` | `name: *1 \| int` |
| `Bool` | `name: bool` | `name?: bool` | `name: *true \| bool` |
| `Float` | `name: float` | `name?: float` | `name: *0.5 \| float` |
| `StringList` | `name: [...string]` | `name?: [...string]` | -- |
| `IntList` | `name: [...int]` | `name?: [...int]` | -- |
| `List` | `name: [..._]` | `name?: [..._]` | -- |
| `StringKeyMap` | `name: [string]: string` | `name?: [string]: string` | -- |
| `Object` | `name: {...}` | `name?: {...}` | -- |
| `Enum` | `name: "A" \| "B"` | `name?: "A" \| "B"` | `name: *"A" \| "B"` |

## What's Next

- [Templates and Resources](./templates-and-resources.md) -- How parameters are used in templates
- [Component Definitions](./components.md) -- Building components with parameters
