---
title: Parameter Chain Methods
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Every parameter constructor — `String`, `Int`, `Bool`, `Float`, `Enum`, `Array`, `Map`, `Object`, `StringKeyMap` — returns a typed pointer that can be chained with constraint, metadata, and expression methods before being passed to `.Params()`. This document covers the full chain-method surface: common metadata and presence modifiers shared by all parameter types; type-specific schema constraints (string pattern and length, numeric range, array item counts, map closed-struct); string and arithmetic expression methods that produce `Value` results for use in `.Set()`; and runtime condition methods that produce `Condition` results for use in `.SetIf()`, `.If()`, and `placement` predicates.

## Common chain methods

These methods are available on every parameter type via `baseParam`. They control the generated CUE field presence marker, default value, and documentation annotations.

| Method | CUE generated | Description |
|---|---|---|
| `.Required() *T` | `name!: type` | User must explicitly provide this field. Cannot be satisfied by defaults or merging. |
| `.Optional() *T` | `name?: type` | Field may be absent from input entirely. Identical to bare param for readability. |
| `.Default(value) *T` | `name: *value \| type` | Sets a default. The parameter becomes non-optional at the CUE level (no `?` or `!`) unless combined with `.Optional()` / `.Required()`. |
| `.Description(desc string) *T` | `// +usage=desc` | Human-readable description shown in `vela show` and generated OpenAPI. |
| `.Short(s string) *T` | `// +short=s` | Single-letter CLI shorthand flag (e.g. `"i"` → `-i`). Available on `String`, `Int`, `Bool`, `Float`, `Enum`. |
| `.Ignore() *T` | `// +ignore` | Excludes the field from `vela show` and OpenAPI output. Available on `String`, `Int`, `Bool`, `Float`, `Enum`. |

:::tip
A bare param with no modifier emits `name?: type` — the same as `.Optional()`. Use `.Optional()` explicitly to signal intent in code that will be read by others.
:::

## String constraints

Available on `*StringParam` (i.e. `defkit.String(...)`). These constraints appear inside the `parameter:` block and are enforced by CUE at apply time.

| Method | CUE generated | Description |
|---|---|---|
| `.Values(values ...string) *StringParam` | `"v1" \| "v2" \| ...` | Restricts the string to a fixed set of allowed values, producing a CUE string disjunction. |
| `.OpenEnum() *StringParam` | `"v1" \| "v2" \| string` | Like `.Values()` but keeps the enum open — any string is also accepted. Useful for well-known values plus user-defined ones. |
| `.Pattern(regex string) *StringParam` | `string & =~"regex"` | Requires the value to match a regular expression. |
| `.MinLen(n int) *StringParam` | `strings.MinRunes(n)` | Minimum UTF-8 rune count. The `"strings"` import is added to the generated CUE for you. |
| `.MaxLen(n int) *StringParam` | `strings.MaxRunes(n)` | Maximum UTF-8 rune count. The `"strings"` import is added for you. |

:::caution
For negative regex constraints (CUE `!~`), use a raw `.WithSchema()` string or a `defkit.CUEExpr` — these are not expressible through the typed chain-method API alone.
:::

## Numeric constraints

Available on `*IntParam` and `*FloatParam`.

| Method | CUE generated | Description |
|---|---|---|
| `.Min(n) *T` | `int & >=n` or `float & >=n` | Inclusive lower bound. |
| `.Max(n) *T` | `int & <=n` or `float & <=n` | Inclusive upper bound. |

When combined with `.Default(v)` the disjunction reads `*v | int & >=n & <=n`.

## Array constraints

Available on `*ArrayParam`.

| Method | CUE generated | Description |
|---|---|---|
| `.MinItems(n int) *ArrayParam` | `list.MinItems(n) & [...]` | Minimum number of array elements. The `"list"` import is added to the generated CUE for you. |
| `.MaxItems(n int) *ArrayParam` | `list.MaxItems(n) & [...]` | Maximum number of array elements. The `"list"` import is added for you. |
| `.OfEnum(values ...string) *ArrayParam` | `[...("v1" \| "v2" \| ...)]` | Constrains each element to one of the given string values. |

## Map constraints

Available on `*MapParam` (and its alias `defkit.Object(...)`).

| Method | CUE generated | Description |
|---|---|---|
| `.Closed() *MapParam` | `close({...})` | Wraps the generated struct in CUE's `close()`, rejecting any extra fields not explicitly declared via `.WithFields()`. |

## String expressions

Available on `*StringParam`. These methods return a `Value` for use in `.Set()` / `.SetIf()` value positions — they do **not** affect the `parameter:` schema block.

| Method | CUE generated | Returns |
|---|---|---|
| `.Concat(suffix string) Value` | `parameter.name + "suffix"` | Value |
| `.Prepend(prefix string) Value` | `"prefix" + parameter.name` | Value |

:::tip
Neither `Concat` nor `Prepend` chains further — both return `Value`, not `*StringParam`. To concatenate two parameters together, use `defkit.Plus(...)` from the value-expression API.
:::

## Arithmetic expressions

Available on `*IntParam`. These return a `Value`.

| Method | CUE generated | Returns |
|---|---|---|
| `.Add(n int) Value` | `parameter.name + n` | Value |
| `.Sub(n int) Value` | `parameter.name - n` | Value |
| `.Mul(n int) Value` | `parameter.name * n` | Value |
| `.Div(n int) Value` | `parameter.name / n` | Value |

Arithmetic results are integer expressions. Do not assign them to Kubernetes fields that require a string (e.g. `env[].value`).

## Runtime conditions — presence

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

## Runtime conditions — boolean, string, and collection predicates

### `BoolParam` conditions

| Method | CUE generated | Description |
|---|---|---|
| `.IsTrue() Condition` | `if parameter.name` | Truthy guard — shorter and more idiomatic than `.Eq(true)`. |
| `.IsFalse() Condition` | `if !parameter.name` | Falsy guard — shorter than `.Eq(false)`. |

### `StringParam` conditions

| Method | CUE generated | Description |
|---|---|---|
| `.In(values ...string) Condition` | `parameter.name == "v1" \|\| ...` | True when the value is one of the listed strings. |
| `.Matches(pattern string) Condition` | `parameter.name =~ "pattern"` | True when the value matches a regex. |
| `.Contains(substr string) Condition` | `strings.Contains(parameter.name, "sub")` | True when the string contains a substring. Requires `"strings"` import. |
| `.StartsWith(prefix string) Condition` | `strings.HasPrefix(parameter.name, "pfx")` | True when the string starts with a prefix. Requires `"strings"` import. |
| `.EndsWith(suffix string) Condition` | `strings.HasSuffix(parameter.name, "sfx")` | True when the string ends with a suffix. Requires `"strings"` import. |

### `IntParam` and `FloatParam` conditions

| Method | CUE generated | Description |
|---|---|---|
| `.In(values ...T) Condition` | `parameter.name == v1 \|\| ...` | True when the value is one of the listed integers or floats. |

### `ArrayParam` runtime conditions

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

### `MapParam` / `StringKeyMap` runtime conditions

| Method | CUE generated | Description |
|---|---|---|
| `.IsSet() Condition` | `parameter["x"] != _|_` | True when the map was supplied. |
| `.IsNotEmpty() Condition` | `len(parameter.x) > 0` | True when present and non-empty. |
| `.IsEmpty() Condition` | two `if` blocks: absent OR empty | Same two-block rendering as `ArrayParam.IsEmpty()`. |
| `.HasKey(key string) Condition` | `parameter.x.key != _|_` | True when the map contains the named key. Available on `*MapParam` and `*StringKeyMapParam`. |
| `.LenEq(n int) Condition` | `len(parameter.x) == n` | Exact entry count. `LenEq(0)` equivalent to `IsEmpty()`. |
| `.LenGt(n int) Condition` | `len(parameter.x) > n` | Entry count greater than `n`. |

## Struct field access

`defkit.Struct(name)` and `defkit.Object(name)` / `defkit.Map(name)` expose a `.Field(fieldPath string)` method that returns a `*ParamFieldRef`. This can be used as a `Value` in `.Set()` positions or tested with `.IsSet()` and `.Eq()` in condition positions.

| Method | CUE generated | Description |
|---|---|---|
| `structParam.Field("x") *ParamFieldRef` | `parameter.struct.x` | Reference to a nested field. |
| `mapParam.Field("x") *ParamFieldRef` | `parameter.map.x` | Same as above for `Map`/`Object`. |
| `ref.IsSet() Condition` | `parameter.struct.x != _|_` | Presence check on the nested field. |
| `ref.Eq(val any) Condition` | `parameter.struct.x == val` | Equality check on the nested field. |
| `ref.Ne(val any) Condition` | `parameter.struct.x != val` | Inequality check. |

## Example

The `chain-methods-demo` component exercises every table in this document. From **Common chain methods**: `image.Required().Short("i").Description(...)` and `readOnly.Default(false)`. From **String constraints**: `appName.Optional().Pattern(...).MinLen(1).MaxLen(48)` and `env.Values("dev","staging","prod").Default("dev")`. From **Numeric constraints**: `replicas.Default(1).Min(1).Max(20)`. From **Array constraints**: `ports.MinItems(1).MaxItems(10)`. From **String expressions**: `appName.Concat("-svc")` and `appName.Prepend("platform-")`. From **Arithmetic expressions**: `replicas.Add(10)` lands in `spec.minReadySeconds`. From **Runtime conditions**: `labels.IsSet()`, `readOnly.IsTrue()`, `readOnly.IsFalse()`, `ports.IsSet()`, `appName.IsSet()`, `env.In(...)`, `env.StartsWith(...)`, `env.Contains(...)`, `env.EndsWith(...)`. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

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
<TabItem value="cue" label="CUE — generated">

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

- [ComponentDefinition](./definition-component.md) — register workload types
- [Collection Parameter Types](./param-collection-types.md) — `StringList`, `Array`, `Map`, `DynamicMap`
- [Complex Parameter Types](./param-complex-types.md) — `Struct`, `Object`, `OneOf`, `ClosedUnion`
- [Resource Builder](./resource-builder.md) — `NewResource`, `Set`, `SetIf`, array builders
- [Value Expressions](./value-expressions.md) — `Lit`, `Reference`, `Plus`, `ParamRef`, logical operators
