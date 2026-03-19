---
title: Parameter Chain Methods
---

All parameter constructors return `*Param` — chain these methods to configure validation, defaults, and metadata. Methods are composable in any order.

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
image: string
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
```

```cue title="CUE — generated"
name?: string & =~"^[a-z]+$"
slug?: string & strings.MinRunes(1) & strings.MaxRunes(63)
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
