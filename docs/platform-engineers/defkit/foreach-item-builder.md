---
title: ForEachWith / ItemBuilder
---

`ForEachWith` produces one array item per element in a source array with complex per-item logic — conditionals, let bindings, and defaults within each item. The callback receives an `*ItemBuilder`.

## `defkit.NewArray().ForEachWith(param, fn)`

```go title="Go — defkit"
ports := defkit.Array("ports").WithFields(
    defkit.Int("port"),
    defkit.String("name").Optional(),
)

namedPorts := defkit.NewArray().ForEachWith(ports, func(item *defkit.ItemBuilder) {
    v := item.Var()
    item.Set("port",       v.Field("port"))
    item.Set("targetPort", v.Field("port"))

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
```

```cue title="CUE — generated"
ports: [for v in parameter.ports {
    port:       v.port
    targetPort: v.port
    if v.name != _|_ {
        name: v.name
    }
    if v.name == _|_ {
        _name: "port-" + strconv.FormatInt(v.port, 10)
        name:  *_name | string
    }
}]
```

## `defkit.NewArray().ForEachWithVar(varName, param, fn)`

The same as `ForEachWith` but lets you specify the loop variable name (default is `v`).

```go title="Go — defkit"
result := defkit.NewArray().ForEachWithVar("p", ports, func(item *defkit.ItemBuilder) {
    v := item.Var()
    item.Set("port", v.Field("port"))
})
```

```cue title="CUE — generated"
[for p in parameter.ports {
    port: p.port
}]
```

## ItemBuilder Methods

| Method | Description |
|---|---|
| `item.Var()` | Returns an `IterVarBuilder` to reference the iteration variable |
| `item.Var().Field("name")` | Reference a field on the iteration variable (`v.name`) |
| `item.Var().Ref()` | Reference the iteration variable itself (`v`) |
| `item.Set(field, value)` | Unconditional field assignment |
| `item.If(cond, fn)` | Conditional block with arbitrary condition |
| `item.IfSet(field, fn)` | Conditional block: `if v.field != _\|_` |
| `item.IfNotSet(field, fn)` | Conditional block: `if v.field == _\|_` |
| `item.Let(name, value)` | Private binding (`_name: expr`), returns a reference |
| `item.SetDefault(field, value, type)` | CUE default: `field: *value \| type` |
| `item.FieldExists(field)` | Condition: `v.field != _\|_` |
| `item.FieldNotExists(field)` | Condition: `v.field == _\|_` |

## `defkit.ItemFieldIsSet(fieldName string)`

Returns a condition that is true when the named field exists on the current iteration element. Used with `.PickIf()` in the `tpl.Helper()` builder to conditionally include optional fields.

```go title="Go — defkit"
volumeMounts := defkit.Object("volumeMounts")

mountsArray := tpl.Helper("mountsArray").
    FromFields(volumeMounts, "pvc", "configMap").
    Pick("name", "mountPath").
    PickIf(defkit.ItemFieldIsSet("subPath"), "subPath").
    PickIf(defkit.ItemFieldIsSet("readOnly"), "readOnly").
    Build()
```

```cue title="CUE — generated"
let mountsArray = [for v in ... {
    name:      v.name
    mountPath: v.mountPath
    if v.subPath != _|_ { subPath: v.subPath }
    if v.readOnly != _|_ { readOnly: v.readOnly }
}]
```

## `ForEachWithGuardedFiltered`

Combines a guard condition, a per-element filter predicate, and an item builder into a single array comprehension. The outer guard wraps the entire expression; the filter predicate is applied per element.

```go title="Go — defkit"
ports := defkit.Array("ports").WithFields(
    defkit.Int("port"),
    defkit.Bool("expose").Default(false),
)

exposePorts := defkit.NewArray().ForEachWithGuardedFiltered(
    ports.IsSet(),
    defkit.FieldEquals("expose", true),
    ports,
    func(item *defkit.ItemBuilder) {
        v := item.Var()
        item.Set("port", v.Field("port"))
        item.Set("targetPort", v.Field("port"))
    },
)
```

```cue title="CUE — generated"
if parameter.ports != _|_ {
    exposePorts: [
        for v in parameter.ports
        if v.expose == true {
            port:       v.port
            targetPort: v.port
        }
    ]
}
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `guard` | `Value` | Outer guard condition — wraps the whole expression (e.g. `param.IsSet()`) |
| `filter` | `FilterPredicate` | Per-element filter — use `defkit.FieldEquals(field, value)` or other predicate constructors |
| `param` | `ArrayParam` | Source array parameter to iterate over |
| `fn` | `func(*ItemBuilder)` | Item builder callback — same as `ForEachWith` |

:::tip
Use `ForEachWithGuardedFiltered` when you need *both* a whole-expression guard (the source param is optional) and an element-level filter (only include items matching a condition). The common case is optional array params where you also want to filter elements.
:::
