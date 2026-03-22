---
title: Collections API
---

The Collections API transforms list parameters into Kubernetes resource arrays using a chainable pipeline. Use `defkit.Each()` for simple transformations and `defkit.FromFields()` for multi-source operations.

## `defkit.Each()` — Collection Pipeline

`defkit.Each(param)` starts a transformation pipeline on a list parameter. Chain operations to transform, filter, and reshape the output.

**Available chain operations:**

| Method | Description |
|---|---|
| `.Filter(pred)` | Keep only items matching a predicate |
| `.Map(fieldMap)` | Transform each item using a `FieldMap` |
| `.Pick(fields...)` | Select specific fields from each item |
| `.Rename(old, new)` | Rename a field |
| `.Wrap(key)` | Wrap each scalar value in an object |
| `.Flatten()` | Flatten nested arrays |
| `.DefaultField(name, val)` | Add a default field to each item |

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
