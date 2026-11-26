---
title: Value Expressions
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Value expressions are deferred-evaluation constructors and condition builders that produce CUE expressions during code generation — they are not evaluated at Go runtime. Use them to build literals, references, string interpolations, arithmetic expressions, comparison conditions, logical combinations, and CUE standard-library calls that end up inside resource templates, conditional guards, and let-variable bindings.

## Constructors

| Constructor | Description |
|---|---|
| `defkit.Lit(v any)` | Creates a literal value — string, int, or bool. The most basic value type. Generates the Go value verbatim in CUE (e.g. `"tcp"`, `80`, `true`). |
| `defkit.Reference(path string)` | Emits a raw CUE path verbatim. Use for context fields (`"context.namespace"`), output fields (`"context.output.spec"`), or any CUE expression the fluent API does not model. |
| `defkit.Parameter()` | References the entire `parameter` block as a value. Generates `parameter`. |
| `defkit.ParameterField(field string)` | Creates a `parameter.field` reference for a nested path not captured by a typed `*Param` variable. Generates `parameter.field`. |
| `defkit.ParamRef(field string)` | Alias for `ParameterField()`. Prefer `ParamRef` when building expressions manually without a typed param variable in scope. |
| `defkit.ParamPath(path string)` | Creates a reference to a nested parameter path, returning a `*ParamPathRef` that also exposes `.IsSet()` as a condition. Use when the path is deeper than one level (e.g. `"strategy.rollingStrategy.maxSurge"`). |

:::tip
`ParameterField` and `ParamRef` are identical at runtime. Use whichever reads more clearly. `ParamPath` is the preferred form when you also need `.IsSet()` on the resulting reference.
:::

## Interpolation and Concatenation

| Constructor | Description |
|---|---|
| `defkit.Interpolation(parts ...Value)` | Creates a CUE string interpolation expression. Literal string values are inlined; all other values are wrapped in `\(...)` syntax. Generates `"\(part1)\(part2)"`. |
| `defkit.Plus(parts ...Value)` | Creates an addition / concatenation expression. Works for string concatenation and array concatenation. Generates `part1 + part2 + ...`. |

:::tip
Use `Interpolation` when all parts contribute to a single string with embedded references. Use `Plus` when you need ordinary CUE `+` — for example, concatenating a static prefix with a namespace string or splicing two arrays.
:::

## Comparison Operators

All comparison operators accept any two `Expr` values and return a `*Comparison` that implements `Condition`. Use them inside `.SetIf()`, `.If()`/`.EndIf()`, `.OutputsIf()`, `.VersionIf()`, and anywhere a `Condition` is expected.

| Constructor | CUE operator |
|---|---|
| `defkit.Eq(left, right Expr)` | `==` |
| `defkit.Ne(left, right Expr)` | `!=` |
| `defkit.Lt(left, right Expr)` | `<` |
| `defkit.Le(left, right Expr)` | `<=` |
| `defkit.Gt(left, right Expr)` | `>` |
| `defkit.Ge(left, right Expr)` | `>=` |

## Logical Operators

| Constructor | CUE | Notes |
|---|---|---|
| `defkit.And(conditions ...Condition)` | `cond1 && cond2 && ...` | Combines any number of conditions with logical AND. |
| `defkit.Or(conditions ...Condition)` | `cond1 \|\| cond2 \|\| ...` | Combines any number of conditions with logical OR. |
| `defkit.Not(cond Condition)` | `!(cond)` | Negates any condition, including `.IsTrue()` and `.IsSet()`. |

## Length Conditions

Value-level length conditions work on any `Value`, including `LetVariable` references and comprehension results.

| Constructor | CUE |
|---|---|
| `defkit.LenGt(source Value, n int)` | `len(source) > n` |
| `defkit.LenGe(source Value, n int)` | `len(source) >= n` |
| `defkit.LenEq(source Value, n int)` | `len(source) == n` |

## Param Condition Methods

Chain methods on typed `*Param` variables that produce `Condition` values.

| Method | CUE | Usage |
|---|---|---|
| `param.IsSet()` | `parameter["x"] != _\|_` | Parameter has been supplied |
| `param.IsTrue()` | `parameter.x` | Bool parameter is `true` |
| `param.Eq(value)` | `parameter.x == value` | Equality check on the parameter value |
| `param.Lt(n)` | `parameter.x < n` | Numeric less-than (on `IntParam` / `FloatParam`) |
| `param.Field(name)` | `parameter.x.name` | Named field of a Struct/Object parameter |

## Regex Condition

| Constructor | CUE |
|---|---|
| `defkit.RegexMatch(source Value, pattern string)` | `source =~ "pattern"` |

## CUE Standard Library Functions

Auto-import: the generator detects required imports from these constructors and adds the corresponding `import` statement automatically. You do not need `.WithImports()` for them — though you may call it to be explicit.

| Constructor | CUE | Auto-import |
|---|---|---|
| `defkit.StringsToLower(v Value)` | `strings.ToLower(v)` | `"strings"` |
| `defkit.StringsToUpper(v Value)` | `strings.ToUpper(v)` | `"strings"` |
| `defkit.StringsHasPrefix(s Value, prefix string)` | `strings.HasPrefix(s, prefix)` | `"strings"` |
| `defkit.StringsHasSuffix(s Value, suffix string)` | `strings.HasSuffix(s, suffix)` | `"strings"` |
| `defkit.StrconvFormatInt(v Value, base int)` | `strconv.FormatInt(v, base)` | `"strconv"` |
| `defkit.ListConcat(lists ...Value)` | `list.Concat([...])` | `"list"` |

## Let Bindings and LetVariable

| Method | Description |
|---|---|
| `tpl.AddLetBinding(name string, expr Value)` | Establishes a CUE `let` variable at the top of the template block. The `name` must start with `_` by convention. The binding is emitted before `output:` so all subsequent expressions in the template block can reference it. |
| `defkit.LetVariable(name string)` | Returns a `Value` that emits the named `let` variable as a bare CUE identifier. Use inside any value expression after `AddLetBinding` has declared the same name. |

:::caution
`defkit.LetVariable(name)` is only a reference — it does not create the binding. Always pair it with `tpl.AddLetBinding()` to establish the CUE `let` variable first, or the generated CUE will reference an undefined identifier.
:::

## Inline Array Literal

| Constructor | Description |
|---|---|
| `defkit.InlineArray(fields map[string]Value)` | Creates an inline single-element array literal: `[{field: value}]`. Useful for generating deprecated single-item array fallbacks or CRD patterns that expect a one-element array. |

## Raw CUE Escape Hatch

| Constructor | Description |
|---|---|
| `defkit.CUEExpr(rawExpr string)` | Wraps a raw CUE expression string as a `Condition`. Use in `FailWhen()` inside a `Validators()` rule for constraints too complex for the typed condition builders. |

## ForEachMap

| Method | Description |
|---|---|
| `defkit.ForEachMap()` | Creates a map comprehension builder. Returns a `*ForEachMapBuilder`. Chain `.Over()`, `.WithVars()`, and `.WithBody()` before embedding it in a `Set` or `SpreadIf` call. Generates `{for k, v in source { ... }}`. |
| `.Over(source string)` | Sets the CUE path to iterate over. The path is emitted verbatim (e.g. `"parameter.annotations"`). |
| `.WithVars(keyVar, valueVar string)` | Names the CUE loop variables (e.g. `"k"`, `"v"`). Both are required. |
| `.WithBody(ops ...Op)` | Adds field-set operations that execute per iteration. Omit to use the default `(k): v` body. |

## Choosing an apiVersion by cluster version

`NewResourceWithConditionalVersion` with `VersionIf` emits the `apiVersion` whose condition holds, for a kind whose API group changed between Kubernetes versions. CronJob moved from `batch/v1beta1` to `batch/v1` in Kubernetes 1.21:

```go
vela := defkit.VelaCtx()
cron := defkit.NewResourceWithConditionalVersion("CronJob").
    VersionIf(defkit.Lt(vela.ClusterVersion().Minor(), defkit.Lit(21)), "batch/v1beta1").
    VersionIf(defkit.Ge(vela.ClusterVersion().Minor(), defkit.Lit(21)), "batch/v1")
```

```cue
output: {
  if context.clusterVersion.minor < 21 {
    apiVersion: "batch/v1beta1"
  }
  if context.clusterVersion.minor >= 21 {
    apiVersion: "batch/v1"
  }
  kind: "CronJob"
}
```

## Example

Let's build a `namespaced-cache` component that renders a Redis `Deployment` and a `Service` in the Application's namespace. Users supply a replica count, port, protocol, optional extra labels, and a TLS-disable toggle.

Behind the scenes the template exercises every category of value expression in a single definition: `Interpolation` to compose the Redis connection URL from the Service's DNS name and a `namespace:name` instance key; `Plus` to build the internal DNS address by string concatenation; `StringsToLower` to lowercase the component name in a label value; `StrconvFormatInt` to convert the integer port to a string inline within the interpolation; `Gt` with `SetIf` to emit the rolling-update strategy only when `replicas > 1`; `SpreadIf` with `labels.IsSet()` to conditionally merge user-supplied labels; and `Not` with `enableTLS.IsTrue()` inside `NewArray().ItemIf()` to add a `TLS_DISABLED` env var only when TLS is off. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func NamespacedCache() *defkit.ComponentDefinition {
    replicas   := defkit.Int("replicas").Default(1).Description("Number of cache replicas")
    port       := defkit.Int("port").Default(6379).Description("Cache port")
    protocol   := defkit.String("protocol").Default("TCP").Values("TCP", "UDP").Description("Port protocol")
    labels     := defkit.StringKeyMap("labels").Optional().Description("Additional pod labels")
    enableTLS  := defkit.Bool("enableTLS").Default(false).Description("Enable TLS for the cache; when false (default) the container receives a TLS_DISABLED=true env var so the runtime knows TLS is off")

    return defkit.NewComponent("namespaced-cache").
        Description("Redis-like cache showcasing Value Expression helpers").
        Workload("apps/v1", "Deployment").
        PodSpecPath("spec.template.spec").
        Params(replicas, port, protocol, labels, enableTLS).
        Template(namespacedCacheTemplate).
        WithImports("strconv", "strings")
}

func namespacedCacheTemplate(tpl *defkit.Template) {
    vela     := defkit.VelaCtx()
    replicas  := defkit.Int("replicas")
    port      := defkit.Int("port")
    protocol  := defkit.String("protocol")
    labels    := defkit.StringKeyMap("labels")
    enableTLS := defkit.Bool("enableTLS")

    // StrconvFormatInt: convert the integer port to a string inline.
    portStr := defkit.StrconvFormatInt(port, 10)

    // Interpolation + StrconvFormatInt: the Redis URL of the Service below,
    // which has the component's name in the Application's namespace.
    redisURL := defkit.Interpolation(
        defkit.Lit("redis://"),
        vela.Name(),
        defkit.Lit("."),
        vela.Namespace(),
        defkit.Lit(".svc:"),
        portStr,
    )

    // Interpolation: compose a namespace-scoped instance key.
    instanceKey := defkit.Interpolation(
        vela.Namespace(),
        defkit.Lit(":"),
        vela.Name(),
    )

    // Plus: build the internal service DNS address by string concatenation.
    internalAddr := defkit.Plus(
        vela.Name(),
        defkit.Lit("."),
        vela.Namespace(),
        defkit.Lit(".svc"),
    )

    // StringsToLower: lowercase the component name for a label value.
    labelValue := defkit.StringsToLower(vela.Name())

    // Not: emit TLS_DISABLED env var only when TLS is off.
    noTLS := defkit.Not(enableTLS.IsTrue())

    // NewArray + Item + ItemIf(Not(...)): static base env list with
    // a conditional entry controlled by the Not condition.
    envBaseList := defkit.NewArray().
        Item(defkit.NewArrayElement().
            Set("name", defkit.Lit("REDIS_URL")).
            Set("value", redisURL)).
        Item(defkit.NewArrayElement().
            Set("name", defkit.Lit("INSTANCE_KEY")).
            Set("value", instanceKey)).
        Item(defkit.NewArrayElement().
            Set("name", defkit.Lit("INTERNAL_ADDR")).
            Set("value", internalAddr)).
        ItemIf(noTLS, defkit.NewArrayElement().
            Set("name", defkit.Lit("TLS_DISABLED")).
            Set("value", defkit.Lit("true")))

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("metadata.labels[app.oam.dev/component]", labelValue).
        // SpreadIf + labels.IsSet(): merge user labels when provided.
        SpreadIf(labels.IsSet(), "metadata.labels", labels).
        Set("spec.replicas", replicas).
        // Gt + SetIf: emit rolling-update strategy only when replicas > 1.
        SetIf(defkit.Gt(replicas, defkit.Lit(1)), "spec.strategy.type",
            defkit.Lit("RollingUpdate")).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", defkit.Lit("redis:7")).
        Set("spec.template.spec.containers[0].ports[0].containerPort", port).
        Set("spec.template.spec.containers[0].ports[0].protocol", protocol).
        Set("spec.template.spec.containers[0].env", envBaseList)

    tpl.Output(dep)

    svc := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        Set("spec.ports[0].port", port).
        Set("spec.ports[0].protocol", protocol).
        Set("spec.ports[0].targetPort", port)

    tpl.Outputs("service", svc)
}

func init() { defkit.Register(NamespacedCache()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
import (
  "strconv"
  "strings"
)

"namespaced-cache": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Redis-like cache showcasing Value Expression helpers"
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
      labels: {
        if parameter["labels"] != _|_ {
          parameter.labels
        }
        "app.oam.dev/component": strings.ToLower(context.name)
      }
    }
    spec: {
      replicas: parameter.replicas
      if parameter.replicas > 1 {
        strategy: type: "RollingUpdate"
      }
      selector: matchLabels: "app.oam.dev/component": context.name
      template: {
        metadata: labels: "app.oam.dev/component": context.name
        spec: containers: [{
          name:  context.name
          image: "redis:7"
          ports: [{
            containerPort: parameter.port
            protocol:      parameter.protocol
          }]
          env: [
            {
              name:  "REDIS_URL"
              value: "redis://\(context.name).\(context.namespace).svc:\(strconv.FormatInt(parameter.port, 10))"
            },
            {
              name:  "INSTANCE_KEY"
              value: "\(context.namespace):\(context.name)"
            },
            {
              name:  "INTERNAL_ADDR"
              value: context.name + "." + context.namespace + ".svc"
            },
            if !(parameter.enableTLS) {
              {
                name:  "TLS_DISABLED"
                value: "true"
              }
            },
          ]
        }]
      }
    }
  }
  outputs: service: {
    apiVersion: "v1"
    kind:       "Service"
    metadata: name: context.name
    spec: {
      selector: "app.oam.dev/component": context.name
      ports: [{
        port:       parameter.port
        protocol:   parameter.protocol
        targetPort: parameter.port
      }]
    }
  }
  parameter: {
    // +usage=Number of cache replicas
    replicas: *1 | int
    // +usage=Cache port
    port: *6379 | int
    // +usage=Port protocol
    protocol: *"TCP" | "UDP"
    // +usage=Additional pod labels
    labels?: [string]: string
    // +usage=Enable TLS for the cache; when false (default) the container receives a TLS_DISABLED=true env var so the runtime knows TLS is off
    enableTLS: *false | bool
  }
}
```

</TabItem>
<TabItem value="application" label="Application YAML">

```yaml title="cache-demo-app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: cache-demo
  namespace: default
spec:
  components:
    - name: my-cache
      type: namespaced-cache
      properties:
        replicas: 2
        port: 6379
        protocol: TCP
        enableTLS: false
        labels:
          env: staging
          tier: backend
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
vela def apply ./generated-cue/components/namespaced-cache.cue
vela up -f cache-demo-app.yaml
vela status cache-demo --namespace default
```

```
NAME         COMPONENT   TYPE               PHASE     HEALTHY   STATUS   AGE
cache-demo   my-cache    namespaced-cache   running   true               60s
```

Once the Application reaches `running`, inspect the rendered `Deployment` to confirm each value expression:

```shell
$ kubectl get deployment my-cache -n default \
    -o jsonpath='{.spec.template.spec.containers[0].env}' \
  | python3 -m json.tool
[
    {
        "name": "REDIS_URL",
        "value": "redis://my-cache.default.svc:6379"
    },
    {
        "name": "INSTANCE_KEY",
        "value": "default:my-cache"
    },
    {
        "name": "INTERNAL_ADDR",
        "value": "my-cache.default.svc"
    },
    {
        "name": "TLS_DISABLED",
        "value": "true"
    }
]

$ kubectl get deployment my-cache -n default \
    -o jsonpath='replicas={.spec.replicas} strategy={.spec.strategy.type} env-label={.metadata.labels.env}'
replicas=2 strategy=RollingUpdate env-label=staging
```

`REDIS_URL` uses `Interpolation` + `StrconvFormatInt` (rendering `6379` as `"6379"`) to point at the Service, `my-cache` in `default`. `INSTANCE_KEY` is `Interpolation(namespace, ":", name)`. `INTERNAL_ADDR` is `Plus(name, ".", namespace, ".svc")`. `TLS_DISABLED` appears because `ItemIf(Not(enableTLS.IsTrue()), ...)` fires when `enableTLS: false`. `strategy.type: RollingUpdate` appears because `SetIf(Gt(replicas, 1), ...)` fires for `replicas: 2`. The `env: staging` label comes from `SpreadIf(labels.IsSet(), ...)`.

Clean up afterwards:

```shell
vela delete cache-demo -n default --yes
kubectl delete componentdefinition namespaced-cache -n vela-system
```

## Related

- [Resource Builder](./resource-builder.md) — `NewResource`, `Set`, `SetIf`, `SpreadIf`, `If`/`EndIf`, and array builders
- [ForEachWith / ItemBuilder](./foreach-item-builder.md) — per-element builder pattern for complex array items
- [ComponentDefinition](./definition-component.md) — define workload types
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [Helper Builder](./template-helper-builder.md) — `tpl.Helper()`, `tpl.AddLetBinding()`, and let-variable APIs
