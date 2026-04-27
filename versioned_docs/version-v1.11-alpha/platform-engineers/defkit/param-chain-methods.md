---
title: Parameter Chain Methods
---

All parameter constructors return `*Param` — chain these methods to configure validation, defaults, and metadata. Methods are composable in any order.

### Common Methods (all param types)

Inherited from `baseParam` — available on every parameter type:

| Method | Description |
|---|---|
| `.Required()` | Marks the parameter as required. Users must explicitly provide a value. Generates CUE `name!: type`. |
| `.Optional()` | Marks the parameter as explicitly optional. The field can be omitted. Generates CUE `name?: type`. |
| `.Default(value)` | Sets a default value. Generates CUE `*value \| type`. Does not set the optional flag — parameters with defaults are implicitly optional at the CUE level. |
| `.Description(desc)` | Sets the human-readable description shown in `vela show`. Generates `// +usage=desc`. |
| `.Short(s)` | Sets a short alias (e.g. `"i"` for `"image"`). Generates `// +short=s`. |
| `.Ignore()` | Marks the parameter as ignored — appears in CUE schema but not in `vela show`. Generates `// +ignore`. |
| `.IsSet() Condition` | Returns a condition that is true when the user provided this parameter. Generates CUE `parameter["name"] != _\|_`. |
| `.NotSet() Condition` | Returns a condition that is true when the parameter was omitted. Generates CUE `parameter["name"] == _\|_`. |
| `.Eq(val) Condition` | Returns a condition comparing this parameter's value to a literal. Generates CUE `parameter.name == val`. |
| `.Ne(val)`, `.Gt(val)`, `.Gte(val)`, `.Lt(val)`, `.Lte(val)` | Additional comparison conditions generating `!=`, `>`, `>=`, `<`, `<=` respectively. |

## `.Optional()` / `.Required()`

Controls the CUE field presence marker. defkit uses a three-state model:

- **Bare param (no call)** — emits `field?: type`. Optional by default; the field may be absent.
- **`.Optional()`** — emits `field?: type`. Identical to bare param — use for readability.
- **`.Mandatory()`** — emits `field: type`. Non-optional; must have a value (defaults or merging can satisfy it).
- **`.Required()`** — emits `field!: type`. The user must explicitly provide the value; it cannot be satisfied by defaults or merging.

```go title="Go — defkit"
defkit.String("image")                   // optional by default — has ?
defkit.String("image").Mandatory()       // non-optional — no ?, no !
defkit.String("token").Required()        // user must explicitly set this
defkit.String("tag").Optional()          // same as bare param — has ?
defkit.String("tag").Default("latest")   // non-optional with default value
```

```cue title="CUE — generated"
image?:  string             // optional by default — has ?
image:   string             // .Mandatory() — non-optional, no ?, no !
token!:  string             // required — must be explicitly set
tag?:    string             // optional  — has ?
tag:     *"latest" | string // non-optional with default
```

## `.Default(value)`

Sets a default value. The CUE default marker (`*`) is placed before the value in the disjunction. Works with strings, ints, bools, and string slices.

```go title="Go — defkit"
defkit.String("tag").Default("latest")
defkit.Int("replicas").Default(1)
defkit.Bool("readOnly").Default(false)
```

```cue title="CUE — generated"
tag:      *"latest" | string
replicas: *1        | int
readOnly: *false    | bool
```

## `.Description()` / `.Short()`

`.Description()` adds a human-readable description shown in `vela show` and generated OpenAPI schemas. `.Short()` assigns a single-letter CLI shorthand flag (e.g., `-i` for image).

```go title="Go — defkit"
defkit.String("image").
    Short('i').
    Description("Container image reference (e.g. nginx:1.25)")
```

```cue title="CUE — generated annotation"
// +usage=Container image reference (e.g. nginx:1.25)
// +short=i
image?: string
```

## `.Values()`

Restricts an `Enum` parameter to the listed allowed values. Produces a CUE string disjunction. Combine with `.Default()` to set a pre-selected value.

```go title="Go — defkit"
defkit.Enum("policy").
    Values("Retain", "Delete", "Recycle").
    Default("Retain")
```

```cue title="CUE — generated"
policy: *"Retain" | "Delete" | "Recycle"
```

## `.Min()` / `.Max()`

Applies inclusive range constraints to `Int` and `Float` parameters. Generates CUE constraint expressions using `>=` and `<=` intersected with the base type.

```go title="Go — defkit"
defkit.Int("replicas").Default(1).Min(1).Max(100)
defkit.Int("timeout").Default(30).Min(5)
```

```cue title="CUE — generated"
replicas: *1  | int & >=1 & <=100
timeout:  *30 | int & >=5
```

## `.Ignore()`

Marks the parameter as internal — excluded from the generated CUE schema and will not appear in `vela show` or OpenAPI output. Use for deprecated fields or helper variables that exist only in Go for template composition.

```go title="Go — defkit"
// Deprecated field — excluded from CUE schema
port := defkit.Int("port").
    Ignore().
    Description("Deprecated field, please use ports instead")

return defkit.NewComponent("webservice").
    Params(image, port, ports).  // port excluded from schema
    Template(webserviceTemplate)
```

```cue title="CUE — generated"
// Only non-ignored params appear:
parameter: {
    image?: string
    ports?: [...]
    // port is omitted from schema
}
```

## String Constraints: `.Pattern()` / `.MinLen()` / `.MaxLen()`

`.Pattern()` restricts values to those matching a regular expression. `.MinLen()` and `.MaxLen()` enforce length bounds. All generate CUE constraint intersections.

```go title="Go — defkit"
name := defkit.String("name").Pattern("^[a-z]+$")
slug := defkit.String("slug").MinLen(1).MaxLen(63)
defkit.String("name").NotEmpty()                    // string & !=""
```

```cue title="CUE — generated"
name?: string & =~"^[a-z]+$"
slug?: string & strings.MinRunes(1) & strings.MaxRunes(63)
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `name: string & =~"^[a-z]+$"` | `String("name").Pattern("^[a-z]+$")` |
| `name: string & !=""` | `String("name").NotEmpty()` |

:::tip
For negative regex constraints (CUE `!~`), use a [Validator](#validators) with `LocalField().Matches()` instead of an inline type constraint. For example, to reject strings ending with a hyphen: `Validate("must not end with -").FailWhen(LocalField("region").Matches(".*-$"))`.
:::

## Array Constraints

```go
defkit.Array("ports").MinItems(1).MaxItems(10)
defkit.StringList("origins").NotEmpty()                                        // [...(string & !="")]
defkit.Array("methods").OfEnum("GET", "POST", "PUT", "DELETE")                 // [...("GET" | "POST" | ...)]
```

| Generated CUE | Go Definition |
|:-------------|:-------------|
| `origins?: [...(string & !="")]` | `StringList("origins").NotEmpty()` |
| `methods?: [...("GET" \| "POST")]` | `Array("methods").OfEnum("GET", "POST")` |

- **`NotEmpty()`** -- constrains each *element* to be non-empty (`!=""`). Same as `StringParam.NotEmpty()` but applied at the element level.
- **`OfEnum(values...)`** -- constrains each element to one of the given values.

:::tip
To validate that an array itself has at least one item, use a [Validator](#validators) on the parent struct or array:
```go
defkit.Array("corsRules").WithFields(
    defkit.Array("allowedMethods").OfEnum("GET", "POST"),
).Validators(
    defkit.Validate("at least one method required").
        FailWhen(defkit.LocalField("allowedMethods").IsEmpty()),
)
```
This keeps the framework generic — any validation logic can be expressed through `Validators()` without needing a dedicated method for each pattern.
:::

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

## Arithmetic Expressions: `.Add()` / `.Sub()` / `.Mul()` / `.Div()`

Arithmetic operations on numeric parameters. Returns a `Value` that can be passed to `.Set()` or used in further expressions. Generates CUE arithmetic operators.

```go title="Go — defkit"
port := defkit.Int("port")

// arithmetic expressions
port.Add(1)    // port + 1
port.Sub(1)    // port - 1
port.Mul(2)    // port * 2
port.Div(2)    // port / 2

deploy.Set("spec.healthPort", port.Add(1000))
```

```cue title="CUE — generated"
spec: healthPort: parameter.port + 1000
```

## String Expressions: `.Concat()` / `.Prepend()` / `.Contains()` / `.StartsWith()` / `.In()`

String manipulation and condition methods on string parameters. `.Concat()` / `.Prepend()` produce string concatenation values. `.Contains()`, `.StartsWith()`, and `.In()` produce boolean condition expressions usable in `.SetIf()` or `.If()` blocks.

```go title="Go — defkit"
name := defkit.String("name")
env  := defkit.String("env")

// concatenation values
name.Concat("-suffix")    // name + "-suffix"
name.Prepend("prefix-")   // "prefix-" + name

// condition expressions
env.Contains("prod")                    // strings.Contains(env, "prod")
env.StartsWith("staging")              // strings.HasPrefix(env, "staging")
env.In("dev", "staging", "prod")       // env in set

// use in conditional
deploy.SetIf(env.In("prod", "staging"), "metadata.labels.tier", defkit.Lit("production"))
```

```cue title="CUE — generated"
// Concat/Prepend
metadata: name: parameter.name + "-suffix"

// Contains condition
if strings.Contains(parameter.env, "prod") {
    metadata: labels: tier: "production"
}
```

## `param.IsSet()` / `param.NotSet()`

Boolean condition expressions for optional parameter presence checks. `.IsSet()` generates a CUE `!= _|_` guard; `.NotSet()` generates an `== _|_` guard. Both return a `Value` usable in `.SetIf()`, `.If()`, `defkit.And()`, etc. Applies to any parameter, including struct field references via `.Field()`.

```go title="Go — defkit"
tag     := defkit.String("tag").Optional()
volumes := defkit.Array("volumes").Optional()
mounts  := defkit.Array("volumeMounts").Optional()

// IsSet — emit field only when tag is provided
deploy.SetIf(tag.IsSet(), "spec.template.spec.containers[0].image",
    image.Concat(":").Concat(tag))

// NotSet — fallback when volumeMounts omitted
deploy.If(defkit.And(volumes.IsSet(), mounts.NotSet())).
    Set("spec.template.spec.volumeMounts", defkit.Lit("[]"))
```

```cue title="CUE — generated"
// IsSet guard
if parameter["tag"] != _|_ {
    spec: template: spec: containers: [{image: parameter.image + ":" + parameter.tag}]
}

// NotSet guard (combined And)
if parameter["volumes"] != _|_ && parameter["volumeMounts"] == _|_ {
    spec: template: spec: volumeMounts: []
}
```

## Struct Field Access: `.Field(name)`

Access nested fields within struct parameters for use in conditions or `.Set()` calls. Returns a `Value` that references the nested field path. Supports chained condition methods like `.IsSet()`, `.Eq()`, etc.

```go title="Go — defkit"
config := defkit.Struct("config").WithFields(
    defkit.Field("enabled", defkit.ParamTypeBool).Default(true),
    defkit.Field("port", defkit.ParamTypeInt).Default(8080),
)

// reference nested fields
config.Field("enabled")             // parameter.config.enabled
config.Field("enabled").IsSet()     // check if config.enabled is set
config.Field("port").Eq(8080)       // config.port == 8080

deploy.SetIf(config.Field("enabled").IsSet(),
    "spec.template.metadata.labels.enabled",
    config.Field("enabled"))
```

```cue title="CUE — generated"
if parameter.config.enabled != _|_ {
    spec: template: metadata: labels: enabled: parameter.config.enabled
}
```
