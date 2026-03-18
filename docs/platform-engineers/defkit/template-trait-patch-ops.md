---
title: Trait Patch Operations
---

Traits in KubeVela mutate the workload resource rather than creating new outputs. These operations are used on the resource returned by `tpl.Patch()`.

## Advanced Patch Operations

`patch.SpreadIf()`, `patch.ForEach()`, `patch.PatchKey()`, and `patch.Passthrough()` provide flexible ways to apply trait patches.

Applies to: **Trait**

| Method | Description |
|---|---|
| `.SpreadIf(cond, path, param)` | Spreads all key-value pairs from a map parameter into a field conditionally |
| `.ForEach(param, path)` | Iterates a map parameter and applies each key-value pair |
| `.PatchKey(path, key, elem)` | Patches array elements matched by a key field (e.g., sidecar injection) |
| `.Passthrough()` | Forwards the entire parameter object as the patch |

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
    if parameter.labels != _|_ {
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
