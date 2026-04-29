---
title: Trait Patch Methods
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Traits in KubeVela mutate an already-rendered workload by emitting a `patch:` block rather than a new `output:`. This page covers all methods for building trait patches — the template-level entry points on `*defkit.Template`, the field-setter methods on `*PatchResource`, and the high-level `tpl.UsePatchContainer()` helper for container-targeting traits.

## Method Reference

### Template Entry Points

| Method | Description |
|---|---|
| `tpl.Patch() *PatchResource` | Returns or creates the trait's `patch:` block builder. Chain `.Set()`, `.SetIf()`, `.SpreadIf()`, `.If()/.EndIf()`, and patch-specific methods. |
| `tpl.PatchStrategy(strategy)` | Sets the patch merge strategy comment: `"retainKeys"`, `"jsonMergePatch"`, or `"jsonPatch"`. |
| `tpl.SetRawPatchBlock(block)` | Escape hatch: replaces the builder-generated patch output with raw CUE. The string must start with `patch:`. |
| `tpl.UsePatchContainer(config)` | High-level helper for traits that patch individual containers. Generates the full `patchSets` / `patch` CUE block with container targeting, optional multi-container support, and field declarations. |

### PatchResource Methods

These methods are available on the `*PatchResource` returned by `tpl.Patch()`.

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

## Basic Patch

`tpl.Patch()` returns a `*PatchResource` builder. `tpl.PatchStrategy(strategy)` emits a `// +patchStrategy=...` comment consumed by the KubeVela runtime. Common values: `"retainKeys"`, `"jsonMergePatch"`, `"jsonPatch"`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
saName := defkit.String("serviceAccountName")

tr := defkit.NewTrait("ex-patch").
    AppliesTo("deployments.apps").
    Params(saName).
    Template(func(tpl *defkit.Template) {
        tpl.PatchStrategy("retainKeys")
        tpl.Patch().Set("spec.template.spec.serviceAccountName", saName)
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    // +patchStrategy=retainKeys
    patch: spec: template: spec: serviceAccountName: parameter.serviceAccountName
}
```

</TabItem>
</Tabs>

## Field Setters: `.SetIf()` / `.SpreadIf()`

`.Set()` always emits a patch field. `.SetIf()` wraps the assignment in an `if cond` guard. `.SpreadIf()` merges a map value (such as a labels map) into an existing struct at the path — only the contents are inlined, not a new `path: { ... }` block.

:::note
`.SpreadIf()` only renders when it has at least one sibling field at the same path (e.g., a static `.Set()` into the same struct). A lone `.SpreadIf()` with nothing to spread into is silently skipped by the code generator. Pair it with a static field or use `.SetIf()` if you want the path to exist only when the condition is true.
:::

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
labels := defkit.StringKeyMap("labels").Optional()

tpl.Patch().
    // Static sibling so SpreadIf has a struct to spread into
    Set("spec.template.metadata.labels.managed-by", defkit.Lit("vela")).
    SpreadIf(labels.IsSet(), "spec.template.metadata.labels", labels)
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
patch: spec: template: metadata: labels: {
    "managed-by": "vela"
    if parameter["labels"] != _|_ {
        parameter.labels
    }
}
```

</TabItem>
</Tabs>

## Conditional Block: `.If()` / `.EndIf()`

Use `.If(cond)` when several fields should be set together under the same condition. All `.Set()` calls between `.If()` and `.EndIf()` compile into a single `if cond { ... }` block.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
cpu    := defkit.String("cpu").Optional()
memory := defkit.String("memory").Optional()

tr := defkit.NewTrait("ex-resource-limits").
    AppliesTo("deployments.apps").
    Params(cpu, memory).
    Template(func(tpl *defkit.Template) {
        tpl.Patch().
            If(cpu.IsSet()).
            Set("spec.template.spec.containers[0].resources.limits.cpu", cpu).
            Set("spec.template.spec.containers[0].resources.requests.cpu", cpu).
            EndIf().
            If(memory.IsSet()).
            Set("spec.template.spec.containers[0].resources.limits.memory", memory).
            Set("spec.template.spec.containers[0].resources.requests.memory", memory).
            EndIf()
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    if parameter["cpu"] != _|_ {
        patch: spec: template: spec: containers: {
            [0]: resources: {
                limits:   { cpu: parameter.cpu }
                requests: { cpu: parameter.cpu }
            }
        }
    }
    if parameter["memory"] != _|_ {
        patch: spec: template: spec: containers: {
            [0]: resources: {
                limits:   { memory: parameter.memory }
                requests: { memory: parameter.memory }
            }
        }
    }
}
```

</TabItem>
</Tabs>

## Map Iteration: `.ForEach()`

`.ForEach(source, path)` iterates over a map parameter and spreads each key-value pair into the path. Use when the user provides a map of labels, annotations, or other key-value data. Generates `for k, v in source { (k): v }`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
labels := defkit.Object("labels")

tr := defkit.NewTrait("ex-foreach").
    AppliesTo("deployments.apps").
    Params(labels).
    Template(func(tpl *defkit.Template) {
        tpl.Patch().ForEach(labels, "spec.template.metadata.labels")
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    patch: spec: template: metadata: labels: {
        for k, v in parameter.labels { (k): v }
    }
}
```

</TabItem>
</Tabs>

## Array Merge: `Patch().PatchKey()`

When patching into a list where Kubernetes needs a merge key (e.g., `containers` by `name`), use `PatchKey(path, key, elems...)`. The generator emits a `// +patchKey=<key>` directive so the strategic-merge controller merges by that key instead of replacing the entire list.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
containerName := defkit.String("containerName")

extraEnv := defkit.NewArrayElement().
    Set("name", defkit.Reference(`"EXTRA"`)).
    Set("value", defkit.Reference(`"true"`))

tr := defkit.NewTrait("ex-patch-key").
    AppliesTo("deployments.apps").
    Params(containerName).
    Template(func(tpl *defkit.Template) {
        tpl.Patch().PatchKey(
            "spec.template.spec.containers", "name",
            defkit.NewArrayElement().
                Set("name", containerName).
                Set("env", defkit.NewArray().Item(extraEnv)),
        )
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    patch: spec: {
        template: {
            spec: {
                // +patchKey=name
                containers: [{
                    env: [
                        {
                            name:  "EXTRA"
                            value: "true"
                        },
                    ]
                    name: parameter.containerName
                }]
            }
        }
    }
}
```

</TabItem>
</Tabs>

## Pass-through: `Patch().Passthrough()`

When a trait's parameter schema already matches the patch shape verbatim, `Passthrough()` emits `patch: parameter`, promoting the entire parameter block to be the patch.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
tr := defkit.NewTrait("ex-passthrough").
    AppliesTo("deployments.apps").
    Params(defkit.Struct("patch").Optional()).
    Template(func(tpl *defkit.Template) {
        tpl.Patch().Passthrough()
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    patch: parameter
}
```

</TabItem>
</Tabs>

## Raw CUE: `tpl.SetRawPatchBlock()`

Escape hatch for patches the fluent builder can't express cleanly (nested patchKeys, custom strategic merge, complex comprehensions). The string you pass is dropped into the template verbatim — it **must** begin with `patch:`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
containerName := defkit.String("containerName")
env := defkit.List("env").Optional()

tr := defkit.NewTrait("ex-raw-patch").
    AppliesTo("deployments.apps").
    Params(containerName, env).
    Template(func(tpl *defkit.Template) {
        tpl.SetRawPatchBlock(`patch: spec: template: spec: {
    containers: [{
        name: parameter.containerName
        env:  parameter.env
    }]
}`)
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    patch: spec: template: spec: {
        containers: [{
            name: parameter.containerName
            env:  parameter.env
        }]
    }
}
```

</TabItem>
</Tabs>

## Container Patching: `tpl.UsePatchContainer()`

High-level helper for traits that patch individual containers. Generates the full `patchSets` / `patch` CUE block with container targeting, optional multi-container support, and field declarations. Use when your trait mutates container fields (env, resources, image, ports, security context, etc.).

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

### Complete Env Injection Trait Example

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

## Related

- [Template Output Methods](./template-output-methods.md) — `tpl.Output()` / `tpl.Outputs()` / `tpl.OutputsIf()` / `tpl.OutputsGroupIf()`
- [Resource Builder](./resource-builder.md) — full `*Resource` and `*ArrayBuilder` API reference
- [TraitDefinition](./definition-trait.md) — full trait example combining `Patch()` with `Outputs()`
