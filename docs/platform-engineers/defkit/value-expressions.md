---
title: Value Expressions
---

Value expressions are deferred-evaluation constructors and condition builders. Values compile into CUE expressions — they are not evaluated immediately in Go.

## Value Constructors

### `defkit.Lit(v)` — Literal Values

Produces a CUE literal value (string, int, or bool).

```go title="Go — defkit"
defkit.Lit("Resource")   // string literal
defkit.Lit(80)           // int literal
defkit.Lit(true)         // bool literal
```

```cue title="CUE — generated"
type: "Resource"
port: 80
enabled: true
```

### `defkit.Reference(path)` — Raw CUE Reference

Emits a raw CUE path. Use for context fields, output fields, or CUE expressions that the fluent API doesn't cover.

```go title="Go — defkit"
defkit.Reference("m.name")
defkit.Reference("context.output.spec")
defkit.Reference("json.Unmarshal(req.body)")
```

```cue title="CUE — generated"
name: m.name
spec: context.output.spec
result: json.Unmarshal(req.body)
```

### `defkit.Interpolation(parts...)` — String Interpolation

Builds a CUE string interpolation expression from mixed literals and parameter references.

```go title="Go — defkit"
vela := defkit.VelaCtx()
name := defkit.String("name")

clusterScopedName := defkit.Interpolation(
    vela.Namespace(),
    defkit.Lit(":"),
    name,
)
```

```cue title="CUE — generated"
"\(context.namespace):\(parameter.name)"
```

### `defkit.ParameterField(path)` / `defkit.ParamPath(path)`

Both produce a `parameter.path` reference for nested parameter fields not captured by a `*Param` variable. `ParamPath` additionally supports `.IsSet()` as a condition.

```go title="Go — defkit"
strategyType     := defkit.ParameterField("strategy.type")
maxSurge         := defkit.ParameterField("strategy.rollingStrategy.maxSurge")
affinityRequired := defkit.ParamPath("podAffinity.required")

hasData := defkit.PathExists("parameter.data")
tpl.SetIf(hasData, "data", defkit.Reference("parameter.data"))
```

```cue title="CUE — generated"
parameter.strategy.type
parameter.strategy.rollingStrategy.maxSurge
parameter.podAffinity.required

if parameter.data != _|_ {
    data: parameter.data
}
```

## Comparison Operators

### `defkit.Eq` / `defkit.Ne` / `defkit.Lt` / `defkit.Le` / `defkit.Gt` / `defkit.Ge`

Comparison operators that produce boolean value expressions. Used as conditions in `.SetIf()`, `.If()`, `tpl.OutputsIf()`, and `.VersionIf()`.

```go title="Go — defkit"
vela := defkit.VelaCtx()

isDeployment  := defkit.Eq(defkit.ParameterField("targetKind"), defkit.Lit("Deployment"))
isNotOnDelete := defkit.Ne(defkit.ParameterField("strategy.type"), defkit.Lit("OnDelete"))

isOldCluster := defkit.Lt(vela.ClusterVersion().Minor(), defkit.Lit(23))
isNewCluster := defkit.Ge(vela.ClusterVersion().Minor(), defkit.Lit(23))

.If(isDeployment).
    Set("spec.strategy.type", strategyType).
EndIf()

.VersionIf(isOldCluster, "autoscaling/v2beta2").
 VersionIf(isNewCluster, "autoscaling/v2")
```

```cue title="CUE — generated"
// Eq → ==
if parameter.targetKind == "Deployment" { ... }

// Ne → !=
if parameter.strategy.type != "OnDelete" { ... }

// Lt / Ge → < / >=
if context.clusterVersion.minor < 23 { "autoscaling/v2beta2" }
if context.clusterVersion.minor >= 23 { "autoscaling/v2" }
```

### `param.IsSet()` / `param.IsTrue()` / `param.Field(name)` / `param.Eq(value)`

Chain methods on `*Param` that produce condition values.

| Method | CUE output | Usage |
|---|---|---|
| `.IsSet()` | `parameter.x != _\|_` | Parameter has been supplied |
| `.IsTrue()` | `parameter.x` | Bool parameter equals `true` |
| `.Field(name)` | `parameter.x.name` | Named field of a Struct/Object parameter |
| `.Eq(v)` | `parameter.x == v` | Equality condition on the parameter value |

```go title="Go — defkit"
cmd    := defkit.StringList("cmd")
create := defkit.Bool("create").Default(false)
cpu    := defkit.Struct("cpu").WithFields(
    defkit.String("type").Default("Utilization"),
    defkit.Int("value").Default(50),
)

.SetIf(cmd.IsSet(), "spec.template.spec.containers[0].command", cmd)

tpl.OutputsIf(create.IsTrue(), "service-account", serviceAccount)

cpuType  := cpu.Field("type")
cpuValue := cpu.Field("value")
.SetIf(cpuType.Eq("Utilization"), "averageUtilization", cpuValue)
```

```cue title="CUE — generated"
if parameter.cmd != _|_ {
    spec: template: spec: containers: [{
        command: parameter.cmd
    }]
}

if parameter.create { outputs: "service-account": { ... } }

if parameter.cpu.type == "Utilization" {
    averageUtilization: parameter.cpu.value
}
```

## Logical Operators

### `defkit.And(exprs...)` / `defkit.Or(exprs...)` / `defkit.LenGt(expr, n)`

```go title="Go — defkit"
privileges      := defkit.Array("privileges").Optional()
clusterPrivsRef := defkit.LetVariable("_clusterPrivileges")

isDeployment  := defkit.Eq(defkit.ParameterField("targetKind"), defkit.Lit("Deployment"))
isNotOnDelete := defkit.Ne(defkit.ParameterField("strategy.type"), defkit.Lit("OnDelete"))

.If(defkit.And(isDeployment, isNotOnDelete)).
    Set("spec.strategy.type", strategyType).
EndIf()

tpl.OutputsGroupIf(
    defkit.And(privileges.IsSet(), defkit.LenGt(clusterPrivsRef, 0)),
    func(g *defkit.OutputGroup) {
        g.Add("cluster-role", clusterRole)
        g.Add("cluster-role-binding", clusterRoleBinding)
    },
)
```

```cue title="CUE — generated"
// And
if parameter.targetKind == "Deployment" &&
   parameter.strategy.type != "OnDelete" {
    spec: strategy: type: parameter.strategy.type
}

// LenGt with OutputsGroupIf
if parameter.privileges != _|_ &&
   len(_clusterPrivileges) > 0 {
    outputs: "cluster-role":         { ... }
    outputs: "cluster-role-binding": { ... }
}
```

## String Operations

### `defkit.StrconvFormatInt(v Value, base int)`

Converts an integer value to a string using CUE's `strconv.FormatInt(v, base)`. The `strconv` import is detected automatically — no explicit `.WithImports("strconv")` call is needed.

```go title="Go — defkit"
protocal := defkit.String("protocal").Default("http")

portStr := defkit.StrconvFormatInt(defkit.Reference("endpoint.port"), 10)

url := defkit.Interpolation(
    protocal,
    defkit.Lit("://"),
    defkit.Reference("endpoint.host"),
    defkit.Lit(":"),
    defkit.Reference("_portStr"),
)

.SetIf(hasEndpoints, "_portStr", portStr)
.SetIf(hasEndpoints, "url", url)
```

```cue title="CUE — generated"
_portStr: strconv.FormatInt(endpoint.port, 10)

url: "\(parameter.protocal)://\(endpoint.host):\(_portStr)"
```

### `defkit.StringsToLower(v Value)`

Converts a string value to lowercase using CUE's `strings.ToLower(v)`. Auto-detects the `"strings"` import requirement.

```go title="Go — defkit"
name := defkit.String("name")

labelValue := defkit.StringsToLower(name)

deploy.Set("metadata.labels.env", defkit.StringsToLower(defkit.ParamRef("env")))
```

```cue title="CUE — generated"
import "strings"

metadata: labels: env: strings.ToLower(parameter.env)
```

## Let Bindings

### `defkit.LetVariable(name string)`

Returns a `Value` that references a CUE `let` variable by name. Use after establishing the binding with `tpl.AddLetBinding(name, expr)`.

```go title="Go — defkit"
privileges := defkit.Array("privileges").Optional()

tpl.AddLetBinding("_clusterPrivileges",
    defkit.From(privileges).
        Filter(defkit.FieldEquals("scope", "cluster")).
        Guard(privileges.IsSet()))

clusterPrivsRef := defkit.LetVariable("_clusterPrivileges")

rules := defkit.ForEachIn(clusterPrivsRef).MapFields(rulesFields)
tpl.OutputsGroupIf(
    defkit.LenGt(clusterPrivsRef, 0),
    func(g *defkit.OutputGroup) { g.Add("role", role) },
)
```

```cue title="CUE — generated"
let _clusterPrivileges = [
    if parameter.privileges != _|_ {
        for p in parameter.privileges if p.scope == "cluster" { p }
    }
]

rules: [for r in _clusterPrivileges { ... }]

if len(_clusterPrivileges) > 0 {
    outputs: role: { ... }
}
```

:::tip
`defkit.LetVariable(name)` is just a reference — it does not create the binding. Always pair it with `tpl.AddLetBinding()` or `tpl.Helper().Build()` to establish the CUE `let` variable first.
:::
