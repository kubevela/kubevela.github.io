---
title: ForEachWith / ItemBuilder
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`ForEachWith` and its variants produce one CUE array item per element in a source array with complex per-item logic — conditionals, let bindings, and defaults within each item. The callback receives an `*ItemBuilder` you populate with `Set()`, `IfSet()`, `Let()`, etc.

## Chain Methods

### Array Iteration

Top-level methods on `defkit.NewArray()` that produce a CUE array comprehension.

| Method | Description |
|---|---|
| `.ForEachWith(param, fn)` | Iterates over a source `ArrayParam` and produces one item per element. The callback receives an `*ItemBuilder` to populate the per-item fields. The default loop variable name in the generated CUE is `v`. Generates `[for v in parameter.<param> { ... }]`. |
| `.ForEachWithVar(varName, param, fn)` | Same as `ForEachWith` but lets you specify the loop variable name (e.g. `"p"`, `"item"`) instead of the default `v`. Use when you need to reference the iteration variable by a specific name in the generated CUE for readability or to avoid clashes with existing identifiers. |
| `.ForEachWithGuardedFiltered(guard, filter, param, fn)` | Combines an outer guard condition (wraps the whole expression — typically `param.IsSet()` for optional source arrays), a per-element `FilterPredicate` (e.g. `defkit.FieldEquals("expose", true)`), and an item builder callback. Generates `if guard { result: [for v in parameter.<param> if <filter> { ... }] }`. |
| `.ForEachWithGuardedFilteredVar(varName, guard, filter, param, fn)` | Same as `ForEachWithGuardedFiltered` but with a custom loop variable name. The whole comprehension is emitted inline as `[if <guard> for <varName> in parameter.<param> if <filter> { ... }]`. |

### ItemBuilder

The callback in every `ForEachWith*` method receives an `*ItemBuilder`. Use it to assemble the fields, conditionals, and let-bindings that make up each item of the produced array.

| Method | Description |
|---|---|
| `item.Var()` | Returns an `IterVarBuilder` that references the iteration variable (`v` by default, or whatever name you passed to the `*Var` variant). All field references inside the item should go through this. |
| `item.Var().Field("name")` | References a field on the iteration variable — generates `v.name`. Use this when reading values from the source element to assign into the produced item. |
| `item.Var().Ref()` | References the iteration variable itself (`v`) without descending into a field. Use it as a value when the source element already has the shape the output field needs: `item.Set("spec", v.Ref())` generates `spec: v`. When only some fields carry over, copy each with `.Field()` instead, as in `item.Set("valueFrom", v.Field("valueFrom"))`. |
| `item.Set(field, value)` | Unconditional field assignment. Generates `field: <value>` at the top level of the item. |
| `item.If(cond, fn)` | Conditional block with an arbitrary condition. The callback runs against the same `*ItemBuilder`, and any `Set` calls inside it are wrapped in `if <cond> { ... }`. |
| `item.IfSet(field, fn)` | Convenience for `item.If(item.FieldExists(field), fn)` — generates `if v.<field> != _\|_ { ... }`. Use when an output field should only be emitted if the source element has the named field set. |
| `item.IfNotSet(field, fn)` | Inverse of `IfSet` — generates `if v.<field> == _\|_ { ... }`. Use to provide a fallback when the source element omits the named field. |
| `item.Let(name, value)` | Emits a private CUE binding (`_name: <value>`) inside the item and returns a reference you can pass to `Set()` or `SetDefault()`. Use to compute an expression once and reuse it. |
| `item.SetDefault(field, value, type)` | Emits a CUE default — generates `field: *<value> \| <type>`. Pair with `Let` to produce a defaulted field whose default value is computed from the iteration variable. |
| `item.FieldExists(field)` | Returns the condition `v.<field> != _\|_` for use with `item.If(...)`. |
| `item.FieldNotExists(field)` | Returns the condition `v.<field> == _\|_` for use with `item.If(...)`. |

### Predicates and Conditions

Top-level helpers that produce conditions for filters and field selection.

| Function | Description |
|---|---|
| `defkit.FieldEquals(field, value)` | Produces a `FilterPredicate` for `ForEachWithGuardedFiltered` — keeps only elements where the named field equals the given value. Generates `if v.<field> == <value>` inside the array comprehension. |
| `defkit.HasExposedPorts(ports)` | Returns a condition that is true when any element of `ports` has `expose: true`. Generates `len([for p in parameter.ports if p.expose == true { p }]) > 0`. The field name `expose` is fixed. The condition reads the parameter directly, so it fails to render when the parameter is optional and absent: give the parameter a default (`.Default([]any{})`) instead of `.Optional()`. Use with `tpl.OutputsIf()` to emit a Service only when there is a port to publish. |
| `defkit.ItemFieldIsSet(field)` | Returns a condition that is true when the named field exists on the current iteration element (`v.<field> != _\|_`). Used with `.PickIf()` on the `tpl.Helper()` builder to conditionally include optional fields when projecting elements through a helper. |

:::tip
Use `ForEachWithGuardedFiltered` when you need *both* an outer guard (the source param is optional) and an element-level filter (only include items matching a condition). Plain `ForEachWith` is enough when the source param is required and you want every element.
:::

## Example

Let's build a `web-service` component that wires a `Deployment` and an optional `Service` from a `ports` parameter and a `env` parameter — every port entry contributes a named container port, entries marked `expose: true` additionally publish a service port (with the Service itself emitted only when at least one port asks to be exposed, so we don't ship a Kubernetes-invalid Service with empty `spec.ports`), and every env entry becomes a container env var (with a string fallback when `value` is omitted). The component shows how the four `ForEachWith*` variants cooperate from different source arrays, with `ItemBuilder` assembling per-item conditionals, defaults, let bindings, and field-existence checks.

Behind the scenes the example exercises most helpers on this page in a single template: `ForEachWith` to build the container-port array (using `IfSet`/`IfNotSet`, `Let`, and `SetDefault` to derive `port-<N>` names when the user omits one), `ForEachWithVar` with a custom iteration name to build the env array (using `item.If` with `item.FieldExists`/`item.FieldNotExists` for the value fallback), `ForEachWithGuardedFiltered` with `defkit.FieldEquals("expose", true)` to build the filtered service-port array, `defkit.HasExposedPorts` to emit the Service only when a port is exposed, and `WithImports("strconv")` so the generated CUE can call `strconv.FormatInt(...)`. `ForEachWithGuardedFilteredVar` takes the same arguments plus a leading `varName` if you need to rename the iteration variable; pair it with var-aware predicates when you do. `defkit.ItemFieldIsSet` returns a `Condition` for the `tpl.Helper().PickIf()` projector and is covered in the [Helper Builder](./template-helper-builder.md) page. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func WebService() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Description("Container image")
    ports := defkit.Array("ports").
        Description("Container ports; set expose=true to publish via Service").
        WithFields(
            defkit.Int("port"),
            defkit.String("name").Optional(),
            defkit.Bool("expose").Default(false),
        ).
        // A default, not Optional(): HasExposedPorts reads the list directly,
        // so it must exist even when the user sets no ports.
        Default([]any{})
    env := defkit.Array("env").
        Description("Container env vars; entries without value default to empty string").
        WithFields(
            defkit.String("name"),
            defkit.String("value").Optional(),
        ).Optional()

    return defkit.NewComponent("web-service").
        Description("HTTP service with container ports and optional Service exposure").
        Workload("apps/v1", "Deployment").
        PodSpecPath("spec.template.spec").
        Params(image, ports, env).
        Template(webServiceTemplate).
        WithImports("strconv")
}

func webServiceTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")
    ports := defkit.Array("ports").WithFields(
        defkit.Int("port"),
        defkit.String("name").Optional(),
        defkit.Bool("expose").Default(false),
    )
    env := defkit.Array("env").WithFields(
        defkit.String("name"),
        defkit.String("value").Optional(),
    )

    // Container ports — ForEachWith with default "v" iter var.
    // Uses item.IfSet / IfNotSet / Let / SetDefault to derive a name when omitted.
    containerPorts := defkit.NewArray().ForEachWith(ports,
        func(item *defkit.ItemBuilder) {
            v := item.Var()
            item.Set("containerPort", v.Field("port"))

            item.IfSet("name", func() {
                item.Set("name", v.Field("name"))
            })
            item.IfNotSet("name", func() {
                nameRef := item.Let("_name",
                    defkit.Plus(defkit.Lit("port-"),
                        defkit.StrconvFormatInt(v.Field("port"), 10)))
                item.SetDefault("name", nameRef, "string")
            })
        })

    // Container env — ForEachWithVar with named "e" iter var.
    // Demonstrates item.If with item.FieldExists / FieldNotExists.
    containerEnv := defkit.NewArray().ForEachWithVar("e", env,
        func(item *defkit.ItemBuilder) {
            e := item.Var()
            item.Set("name", e.Field("name"))

            // item.If with an arbitrary Condition produced by item.FieldExists.
            item.If(item.FieldExists("value"), func() {
                item.Set("value", e.Field("value"))
            })
            // item.FieldNotExists is the inverse — used for the fallback.
            item.If(item.FieldNotExists("value"), func() {
                item.Set("value", defkit.Lit(""))
            })
        })

    // Service ports — ForEachWithGuardedFiltered with FieldEquals predicate.
    // ForEachWithGuardedFilteredVar takes the same arguments plus a leading
    // varName to rename the iteration variable; pair it with var-aware
    // predicates when you need a non-default name.
    servicePorts := defkit.NewArray().ForEachWithGuardedFiltered(
        ports.IsSet(),
        defkit.FieldEquals("expose", true),
        ports,
        func(item *defkit.ItemBuilder) {
            v := item.Var()
            item.Set("port", v.Field("port"))
            item.Set("targetPort", v.Field("port"))
        })

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        SetIf(env.IsSet(),
            "spec.template.spec.containers[0].env", containerEnv).
        SetIf(ports.IsSet(),
            "spec.template.spec.containers[0].ports", containerPorts)

    svc := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        Set("spec.ports", servicePorts)

    tpl.Output(dep)
    // Emit the Service only when at least one port has expose: true. Always
    // emitting it would leave spec.ports empty when no port is exposed and
    // the Kubernetes API server rejects that ("spec.ports: Required value").
    tpl.OutputsIf(defkit.HasExposedPorts(ports), "service", svc)
}

func init() { defkit.Register(WebService()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
import (
  "strconv"
)

"web-service": {
  type: "component"
  annotations: {}
  labels: {}
  description: "HTTP service with container ports and optional Service exposure"
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
        metadata: labels: "app.oam.dev/component": context.name
        spec: containers: [{
          name:  context.name
          image: parameter.image
          if parameter["env"] != _|_ {
            env: [for e in parameter.env {
              name: e.name
              if e.value != _|_ { value: e.value }
              if e.value == _|_ { value: "" }
            }]
          }
          if parameter["ports"] != _|_ {
            ports: [for v in parameter.ports {
              containerPort: v.port
              if v.name != _|_ {
                name: v.name
              }
              if v.name == _|_ {
                _name: "port-" + strconv.FormatInt(v.port, 10)
                name:  *_name | string
              }
            }]
          }
        }]
      }
    }
  }
  outputs: {
    if len([for p in parameter.ports if p.expose == true { p }]) > 0 {
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
            },
          ]
        }
      }
    }
  }
  parameter: {
    // +usage=Container image
    image: string
    // +usage=Container ports; set expose=true to publish via Service
    ports: [...{
      port:   int
      name?:  string
      expose: *false | bool
    }]
    // +usage=Container env vars; entries without value default to empty string
    env?: [...{
      name:   string
      value?: string
    }]
  }
}
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

## Related

- [ComponentDefinition](./definition-component.md) — define workload types
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
