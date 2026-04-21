---
title: Collections API
---

The Collections API transforms list parameters into Kubernetes resource arrays using a chainable pipeline. Use `defkit.Each()` for simple transformations and `defkit.FromFields()` for multi-source operations.

## `defkit.Each()` — Collection Pipeline

`defkit.Each(param)` starts a transformation pipeline on a list parameter. Chain operations to transform, filter, and reshape the output.

**Available chain operations:**

| Method | Description |
|---|---|
| `.Guard(cond)` | Adds a guard prefix to the list comprehension: `[if cond for v in source { ... }]`. The comprehension evaluates to empty when the guard is false. Use to skip iteration when the source parameter is not set. |
| `.Filter(pred Predicate)` | Filters items using a for-comprehension filter clause. Generates `for v in source if v.field == val { ... }`. Build predicates with `FieldEquals()` or `FieldExists()`. |
| `.FilterCond(cond Condition)` | Filters items using a general Condition instead of a Predicate. The condition can reference parameters or context rather than the iteration variable. |
| `.Map(mappings FieldMap)` | Transforms each item by mapping source fields to output fields. FieldMap maps output field names to FieldValues (`F("sourceName")`, `LitField("constant")`, `Nested(subMap)`). |
| `.MapVariant(discriminator, name, mappings)` | Adds a variant-specific mapping block — only applies when the discriminator field equals the variant name. Chain multiple calls for each variant. |
| `.Pick(fields ...string)` | Selects only the named fields from each item, dropping everything else. |
| `.Rename(from, to)` | Renames a field in the output: items with field `from` get it emitted as `to`. |
| `.Wrap(key)` | Wraps each item under a new key. E.g. `Each(secrets).Wrap("name")` transforms `"mysecret"` into `{ name: "mysecret" }`. |
| `.DefaultField(field, default)` | Provides a default value for a field that may be missing. For CUE defaults in generated output, use `FieldRef.Or(fallback)` instead. |
| `.Flatten()` | Flattens nested arrays — items containing sub-arrays are expanded into the parent list. |
| `.Dedupe(keyField)` | Removes duplicate items based on a key field. If two items have the same `keyField` value, only the first is kept. |

```go title="Go — defkit"
ports := defkit.List("ports")

containerPorts := defkit.Each(ports).
    Filter(defkit.FieldEquals("expose", true)).
    Map(defkit.FieldMap{
        "containerPort": defkit.FieldRef("port"),
        "name":          defkit.FieldRef("name"),
    }).
    Pick("containerPort", "name")

renamed := defkit.Each(ports).
    Rename("port", "containerPort")

wrapped := defkit.Each(defkit.StringList("hosts")).
    Wrap("host")

named := defkit.Each(ports).
    DefaultField("name",
        defkit.Format("port-%v", defkit.FieldRef("port")))
```

```cue title="CUE — generated"
// Filter + Map + Pick
[for v in parameter.ports if v.expose == true {
    containerPort: v.port
    name:          v.name
}]

// Rename
[for v in parameter.ports {
    containerPort: v.port
}]

// Wrap
[for v in parameter.hosts { host: v }]

// DefaultField
[for v in parameter.ports {
    name: *"port-\(v.port)" | string
}]
```

## `defkit.FromFields()` — Multi-Source Collections

Combines items from multiple named fields within a struct parameter into a single array. Use when you need to produce one unified list from a parameter that has several differently-typed sub-arrays.

```go title="Go — defkit"
volumeMounts := defkit.Object("volumeMounts")

volumes := defkit.FromFields(volumeMounts, "pvc", "configMap", "secret").
    MapBySource(map[string]defkit.FieldMap{
        "pvc": {
            "name": defkit.FieldRef("name"),
            "persistentVolumeClaim": defkit.Nested(defkit.FieldMap{
                "claimName": defkit.FieldRef("claimName"),
            }),
        },
        "configMap": {
            "name":      defkit.FieldRef("name"),
            "configMap": defkit.Nested(defkit.FieldMap{
                "name": defkit.FieldRef("cmName"),
            }),
        },
    }).
    Dedupe("name")
```

```cue title="CUE — generated"
[
    for v in parameter.volumeMounts.pvc {
        name: v.name
        persistentVolumeClaim: claimName: v.claimName
    },
    for v in parameter.volumeMounts.configMap {
        name:      v.name
        configMap: name: v.cmName
    },
    // duplicates by name removed
]
```

## Field Reference Helpers in Collections

### FieldMap Helpers Summary

| Function | Description |
|---|---|
| `F(name string)` / `FieldRef(name)` | References a field on the current iteration variable. Inside `for v in source`, `F("port")` becomes `v.port`. |
| `LitField(val)` | Creates a literal constant value in a field mapping. Unlike `Lit()` (for Set), `LitField()` is for use inside `Map()` FieldMaps. |
| `Nested(mapping FieldMap)` | Creates a nested struct in the output mapping. Generates `{ outerField: { innerField: v.source } }`. |
| `Optional(field)` | References an optional field that may not exist on every item. Generates a conditional field assignment. |
| `OptionalFieldWithCond(field, cond)` | Like `Optional()` but with an additional condition — field is only included when both it exists and the condition is true. |
| `Format(format, args ...FieldValue)` | Creates a formatted string value. Generates CUE string concatenation. Auto-imports `strconv` for numeric args. |
| `FieldEquals(field, value) Predicate` | Creates a predicate for `Filter()`. Generates `if v.field == value`. |
| `FieldExists(field) Predicate` | Creates a predicate for `Filter()`. Generates `if v.field != _\|_`. |
| `ConcatExpr(source, fields...)` | Concatenates arrays from a StructArrayHelper's named fields into a single list. |
| `FromFields(source, fields...)` | Starts a multi-source collection iterating over multiple named fields. Chain `.MapBySource()` for per-field mappings. |
| `FieldRef.Or(fallback)` | Provides a fallback value when a field is undefined. Generates CUE `*v.field \| fallback`. |
| `FieldRef.OrConditional(fallback)` | Provides a fallback using if/else blocks instead of CUE default syntax. |

### `defkit.Nested(fieldMap)`

Creates a nested object value inside a `FieldMap`.

```go title="Go — defkit"
defkit.FieldMap{
    "persistentVolumeClaim": defkit.Nested(defkit.FieldMap{
        "claimName": defkit.FieldRef("claimName"),
        "readOnly":  defkit.FieldRef("readOnly"),
    }),
}
```

```cue title="CUE — generated"
persistentVolumeClaim: {
    claimName: v.claimName
    readOnly:  v.readOnly
}
```

### `defkit.Optional(name)`

References a field that may be absent — generates a CUE conditional inclusion.

```go title="Go — defkit"
defkit.Optional("subPath")
```

```cue title="CUE — generated"
if v.subPath != _|_ { subPath: v.subPath }
```

### `defkit.Format(template, fields...)`

Builds a formatted string using field references.

```go title="Go — defkit"
defkit.Format("port-%v", defkit.FieldRef("port"))
defkit.Format("%v:%v", defkit.FieldRef("host"), defkit.FieldRef("port"))
```

```cue title="CUE — generated"
name: "port-\(v.port)"
addr: "\(v.host):\(v.port)"
```

## Complete Example

This example combines `FromFields`, `MapBySource`, and `Dedupe` to build a Kubernetes Volumes array from a structured `volumeMounts` parameter:

```go title="Go — defkit"
func volumeTemplate(tpl *defkit.Template) {
    volumeMounts := defkit.Object("volumeMounts")

    volumes := defkit.FromFields(volumeMounts, "pvc", "configMap", "secret", "emptyDir").
        MapBySource(map[string]defkit.FieldMap{
            "pvc": {
                "name": defkit.FieldRef("name"),
                "persistentVolumeClaim": defkit.Nested(defkit.FieldMap{
                    "claimName": defkit.FieldRef("claimName"),
                }),
            },
            "configMap": {
                "name": defkit.FieldRef("name"),
                "configMap": defkit.Nested(defkit.FieldMap{
                    "name": defkit.FieldRef("name"),
                }),
            },
            "secret": {
                "name": defkit.FieldRef("name"),
                "secret": defkit.Nested(defkit.FieldMap{
                    "secretName": defkit.FieldRef("secretName"),
                }),
            },
            "emptyDir": {
                "name":     defkit.FieldRef("name"),
                "emptyDir": defkit.Nested(defkit.FieldMap{}),
            },
        }).
        Dedupe("name")

    mountsArray := tpl.Helper("mountsArray").
        FromFields(volumeMounts, "pvc", "configMap", "secret", "emptyDir").
        Pick("name", "mountPath").
        PickIf(defkit.ItemFieldIsSet("subPath"), "subPath").
        PickIf(defkit.ItemFieldIsSet("readOnly"), "readOnly").
        Build()

    deployment := defkit.NewResource("apps/v1", "Deployment").
        Set("spec.template.spec.volumes", volumes).
        Set("spec.template.spec.containers[0].volumeMounts", mountsArray)

    tpl.Output(deployment)
}
```

```cue title="CUE — generated"
let mountsArray = [for v in ... {
    name:      v.name
    mountPath: v.mountPath
    if v.subPath != _|_ { subPath: v.subPath }
    if v.readOnly != _|_ { readOnly: v.readOnly }
}]

spec: template: spec: {
    volumes: [
        for v in parameter.volumeMounts.pvc {
            name: v.name
            persistentVolumeClaim: claimName: v.claimName
        },
        for v in parameter.volumeMounts.configMap {
            name:      v.name
            configMap: name: v.name
        },
        ...
    ]
    containers: [{
        volumeMounts: mountsArray
    }]
}
```

:::info
`defkit.Each()` and `defkit.FromFields()` operate at different levels:
- `Each` — transforms items within a single flat array parameter
- `FromFields` — combines items from multiple named sub-arrays within a single struct parameter
:::
