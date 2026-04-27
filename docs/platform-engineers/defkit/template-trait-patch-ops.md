---
title: Trait Patch Operations
---

Traits in KubeVela mutate the workload resource rather than creating new outputs. These operations are used on the resource returned by `tpl.Patch()`.

## Advanced Patch Operations

`patch.SpreadIf()`, `patch.ForEach()`, `patch.PatchKey()`, and `patch.Passthrough()` provide flexible ways to apply trait patches.

Applies to: **Trait**

| Method | Description |
|---|---|
| `.Set(path, value)` | Sets a field in the patch. Generates `patch: path: value`. |
| `.SetIf(cond, path, value)` | Conditionally sets a patch field. Generates `if cond { patch: path: value }`. |
| `.SpreadIf(cond, path, value)` | Conditionally spreads a map value into a path. Use for merging labels, annotations. |
| `.If(cond)` / `.EndIf()` | Opens/closes a conditional block where all enclosed patch operations share the same condition. |
| `.ForEach(source, path)` | Iterates over a map and spreads each key-value pair into the path. Generates `for k, v in source { (k): v }`. |
| `.PatchKey(path, key, elements...)` | Adds `// +patchKey=key` directive and array elements. For strategic merge patch by key field (e.g. `name` for containers). |
| `.SpreadAll(path, elements...)` | Applies each element as a spread constraint on every item in the target array. |
| `.PatchStrategyAnnotation(path, strategy)` | Adds `// +patchStrategy=strategy` comment at the given path. |
| `.Passthrough()` | Generates `patch: parameter` — the entire parameter becomes the patch. |

```go title="Go — defkit"
labels := defkit.Object("labels")

// SpreadIf: spread map conditionally
tpl.Patch().SpreadIf(labels.IsSet(), "spec.template.metadata.labels", labels)

// ForEach: iterate map entries
tpl.Patch().ForEach(labels, "spec.template.metadata.labels")

// PatchKey: patch array element by key
containerName := defkit.String("containerName")
image         := defkit.String("image")
container := defkit.NewArrayElement().
    Set("name", containerName).
    Set("image", image)
tpl.Patch().PatchKey("spec.template.spec.containers", "name", container)

// Passthrough: forward all params as patch
tpl.Patch().Passthrough()
```

```cue title="CUE — generated"
// SpreadIf — spreads user labels INSIDE the labels block
// (block always exists from other Set() calls; user labels are merged in conditionally)
patch: spec: template: metadata: labels: {
    if parameter["labels"] != _|_ {
        parameter.labels
    }
}

// ForEach
patch: spec: template: metadata: labels: {
    for k, v in parameter.labels { (k): v }
}

// PatchKey
patch: spec: template: spec: {
    // +patchKey=name
    containers: [{
        name:  parameter.containerName
        image: parameter.image
    }]
}

// Passthrough
patch: parameter
```

## `defkit.PatchContainer()` + `tpl.UsePatchContainer()`

### Context Introspection

| Function | Description |
|---|---|
| `ContextOutput() *ContextOutputRef` | Returns a reference to the primary output resource (`context.output`). Chain with `.Field(path)` to access fields or `.HasPath(path)` for existence conditions. |

### PatchField Chain Methods

`PatchField(name)` defines a single patch field for container mutation. Chain methods: `.Target(t)` sets target field, `.Default(val)` sets CUE default, `.Type(t)`/`.Int()`/`.Bool()`/`.Str()`/`.StringArray()` set param type, `.Strategy(s)` sets patch strategy, `.IsSet()`/`.NotEmpty()` set conditions, `.Eq(val)`/`.Ne(val)`/`.Gt(val)`/`.Gte(val)`/`.Lt(val)`/`.Lte(val)` set comparisons, `.RawCondition(c)` sets raw CUE condition, `.Description(d)` sets description, `.Build()` finalizes.

### Convenience Conditions

| Function | Description |
|---|---|
| `ParamIsSet(name)` | Standalone condition: true when the named parameter is provided. Generates `parameter["name"] != _\|_`. |
| `ParamNotSet(name)` | Standalone condition: true when the named parameter is not provided. |
| `ContextOutputExists(path)` | Condition checking if a path exists on the primary output resource. Generates `context.output.path != _\|_`. |
| `AllConditions(conditions...)` | Combines multiple conditions with logical AND. |

High-level helper for traits that patch individual containers. Generates the full `patchSets` / `patch` CUE block with container targeting, optional multi-container support, and field declarations. Use when your trait mutates container fields (env, resources, image, ports, security context, etc.).

Applies to: **Trait**

```go title="Go — defkit"
tpl.UsePatchContainer(defkit.PatchContainerConfig{
    ContainerNameParam:    "containerName",
    DefaultToContextName:  true,   // use context.name if unset
    AllowMultiple:         true,   // allow multi-container
    ContainersParam:       "containers",
    ContainersDescription: "Specify containers to patch",
    PatchFields: []defkit.PatchContainerField{
        {
            ParamName:    "replace",
            TargetField:  "replace",
            ParamType:    "bool",
            ParamDefault: "false",
            Description:  "Replace all env vars",
        },
        {
            ParamName:   "env",
            TargetField: "env",
            ParamType:   "[string]: string",
            Description: "Env vars to merge",
        },
    },
    // Optional: inject raw CUE body for complex logic
    CustomPatchContainerBlock: `_params: #PatchParams
name: _params.containerName
env: [for k, v in _params.env { name: k, value: v }]`,
})
```

```cue title="CUE — generated"
#PatchParams: {
    containerName?: *context.name | string
    containers?: [...{
        containerName?: string
        replace: *false | bool
        env: [string]: string
    }]
}

patchSets: [{
    name: "container-patch"
    patches: [...]
}]
patch: { ... }
```

## Complete Env Injection Trait Example

A typical env-injection trait uses `UsePatchContainer` to inject environment variables into a targeted container:

```go title="Go — defkit"
func envTemplate(tpl *defkit.Template) {
    tpl.UsePatchContainer(defkit.PatchContainerConfig{
        ContainerNameParam:   "containerName",
        DefaultToContextName: true,
        PatchFields: []defkit.PatchContainerField{
            {
                ParamName:   "env",
                TargetField: "env",
                ParamType:   "[string]: string",
                Description: "Environment variables to inject",
            },
        },
        CustomPatchContainerBlock: `_params: #PatchParams
name: _params.containerName
env: [for k, v in _params.env { name: k, value: v }]`,
    })
}
```

:::info
`UsePatchContainer` handles the boilerplate of container selection, multi-container iteration, and patchSets generation. Reserve `tpl.Patch().PatchKey()` for cases where you need direct control over the patch structure.
:::
