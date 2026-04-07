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

Validators express cross-field validation rules using the CUE `_validate*` block pattern. They can be attached at three levels: component-level, inside structs (`MapParam`), or inside array elements (`ArrayParam`).

### Basic Validator

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
})
```

</details>

### Guarded Validator

Use `OnlyWhen()` to make a validator active only when a condition is true:

```go title="conditional_validator.go"
defkit.Validate("versioningEnabled must be true when replication is set").
    WithName("_validateVersioning").
    OnlyWhen(defkit.LocalField("replicationConfiguration").IsSet()).
    FailWhen(defkit.LocalField("versioningEnabled").Eq(false))
```

### LocalField References

`LocalField(name)` creates a reference to a sibling field in the current struct scope -- without the `parameter.` prefix that normal parameter references use. It supports dot-paths and array indexing:

```go
defkit.LocalField("tenantName").Matches(".*-$")            // tenantName =~ ".*-$"
defkit.LocalField("tenantName").IsSet()                     // tenantName != _|_
defkit.LocalField("tenantName").NotSet()                    // tenantName == _|_
defkit.LocalField("tenantName").Eq("admin")                 // tenantName == "admin"
defkit.LocalField("Principal.AWS").IsEmpty()                 // len(Principal.AWS) == 0
defkit.LocalField("expiration[0].date").IsSet()             // expiration[0].date != _|_
defkit.LocalField("days").Gte(defkit.LocalField("other"))   // days >= other
```

:::caution
`LocalField` is for use inside validators attached to `MapParam.Validators()` or `ArrayParam.Validators()`. For template-level conditions (in `SetIf`, `If/EndIf`), use normal parameter references like `defkit.Bool("enabled").IsSet()`.
:::

### Validator on Array Elements

Validators on `ArrayParam` are emitted inside each element struct:

```go title="lifecycle_validators.go"
defkit.Array("lifecycleRules").Optional().
    WithFields(
        defkit.Enum("status").Default("Enabled").Values("Enabled", "Disabled"),
        defkit.Array("expiration").Optional().WithFields(...),
        defkit.Array("transition").Optional().WithFields(...),
    ).
    Validators(
        defkit.Validate("at least one sub-rule is required").
            WithName("_validateLifecycleRules").
            FailWhen(defkit.And(
                defkit.LocalField("expiration").NotSet(),
                defkit.LocalField("transition").NotSet(),
            )),
    )
```

### Component-Level Validators

Validators can also be attached directly to the component definition:

```go title="component_validators.go"
defkit.NewComponent("my-component").
    Params(name, region).
    Validators(
        defkit.Validate("name is too long").
            WithName("_validateNameLength").
            FailWhen(defkit.LenOf(defkit.Plus(
                defkit.Lit("prefix-"), name,
            )).Gt(63)),
    )
```

### Expression Helpers for Validators

| Helper | Description | Example |
|:-------|:-----------|:--------|
| `LenOf(value).Gt(n)` | Length of an expression > n | `LenOf(Plus(Lit("a"), name)).Gt(63)` |
| `LenOf(value).Eq(n)` | Length of an expression == n | `LenOf(list).Eq(0)` |
| `TimeParse(layout, field).Gte(other)` | Compare parsed dates | `TimeParse("2006-...", LocalField("date")).Gte(...)` |
| `CUEExpr(raw)` | Raw CUE expression (escape hatch) | `CUEExpr("len(x) > 0")` |

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
