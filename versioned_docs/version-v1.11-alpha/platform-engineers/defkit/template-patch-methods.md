---
title: Resource & Patch Builder Methods
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Builder methods for constructing and mutating Kubernetes resource manifests inside a definition template. This page covers the resource and array builders used from any `*defkit.Template` (component / trait), plus the trait-only `tpl.Patch()` family. Path syntax supports dot notation, `[0]` array indices, and bracket notation.

## Method Reference

| Method | Applies to | Description |
|---|---|---|
| `defkit.NewResource(apiVersion, kind)` | Component, Trait | Creates a resource builder. Chain `.Set()`, `.SetIf()`, `.SpreadIf()`, `.If()/.EndIf()`. |
| `defkit.NewResourceWithConditionalVersion(kind)` | Component, Trait | Creates a resource whose `apiVersion` is selected at runtime. Chain `.VersionIf(cond, apiVersion)`. |
| `.Set(path, value)` | Component, Trait | Always sets a field at the given path. |
| `.SetIf(cond, path, value)` | Component, Trait | Sets a field only when `cond` is true. Generates `if cond { path: value }`. |
| `.SpreadIf(cond, path, value)` | Component, Trait | Merges a struct value into a path when `cond` is true. Requires at least one sibling field at the same path — see note below. |
| `.If(cond) / .EndIf()` | Component, Trait | Opens and closes a block; every `.Set()` between the two shares one generated `if cond { ... }` block. |
| `defkit.NewArray()` | Component, Trait | Builds a CUE list literal. Chain `.Item(elem)`, `.ItemIf(cond, elem)`, `.ForEachGuarded(cond, source, elem)`. |
| `defkit.NewArrayElement()` | Component, Trait | Builds a struct value (used as an array element or nested object). Chain `.Set(key, value)` and `.SetIf(cond, key, value)`. |
| `tpl.Patch() *PatchResource` | **Trait** | Returns or creates the trait's `patch:` block builder. |
| `tpl.PatchStrategy(strategy)` | **Trait** | Sets the patch merge strategy comment: `"retainKeys"`, `"jsonMergePatch"`, or `"jsonPatch"`. |
| `Patch().PatchKey(path, key, elems...)` | **Trait** | Adds a `// +patchKey=<key>` annotated array patch at `path`. |
| `Patch().Passthrough()` | **Trait** | Emits `patch: parameter` — the entire `parameter` block becomes the patch. |
| `tpl.SetRawPatchBlock(block)` | **Trait** | Escape hatch: replaces the builder-generated patch output with raw CUE. The string must start with `patch:`. |

:::note
`.SpreadIf()` only renders when it has at least one sibling field at the same path (e.g., a static `.Set()` into the same struct). A lone `.SpreadIf()` with nothing to spread into is silently skipped by the code generator. Pair it with a static field or use `.SetIf()` if you want the path to exist only when the condition is true.
:::

See also [Resource Builder](./resource-builder.md) for the full `*Resource` / `*ArrayBuilder` API reference.

## Building resources with `.Set()` / `.SetIf()` / `.SpreadIf()`

The three field setters differ in how they handle presence:

- `.Set()` always emits the field.
- `.SetIf(cond, ...)` wraps a single assignment in `if cond { ... }`.
- `.SpreadIf(cond, ...)` merges a struct value into an existing struct at the path; only the contents are inlined, not a new `path: { ... }` block.

**Applies to:** Component, Trait.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
image := defkit.String("image")
annotations := defkit.StringKeyMap("annotations").Optional()
labels := defkit.StringKeyMap("labels").Optional()

comp := defkit.NewComponent("ex-set").
    Workload("batch/v1", "Job").
    Params(image, annotations, labels).
    Template(func(tpl *defkit.Template) {
        tpl.Output(defkit.NewResource("batch/v1", "Job").
            Set("spec.template.spec.containers[0].image", image).
            SetIf(annotations.IsSet(),
                "spec.template.metadata.annotations", annotations).
            // Static sibling so SpreadIf has a struct to spread into.
            Set("spec.template.metadata.labels.component", defkit.VelaCtx().Name()).
            SpreadIf(labels.IsSet(),
                "spec.template.metadata.labels", labels))
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    output: {
        apiVersion: "batch/v1"
        kind:       "Job"
        spec: {
            template: {
                spec: {
                    containers: {
                        [0]: {
                            image: parameter.image
                        }
                    }
                }
                metadata: {
                    if parameter["annotations"] != _|_ {
                        annotations: parameter.annotations
                    }
                    labels: {
                        if parameter["labels"] != _|_ {
                            parameter.labels
                        }
                        component: context.name
                    }
                }
            }
        }
    }
}
```

</TabItem>
</Tabs>

Two things worth noting in the output above:

- `containers: { [0]: { ... } }` is the code generator's representation of an indexed path when no list literal is present. It is syntactically valid CUE but visually unusual; if you need a traditional list literal, build the element with `NewArrayElement()` and assign via `Set("...containers", defkit.NewArray().Item(elem))`.
- `.IsSet()` on a parameter renders as `parameter["name"] != _|_` (bracket form). Non-presence conditions such as `.Eq()`, `.Lt()` render as `parameter.name == X` (dot form).

## Grouping fields with `.If()` / `.EndIf()`

Use `.If(cond)` when several fields should be set together under the same condition. `.EndIf()` closes the block. All `.Set()` calls between the two compile into a single `if cond { ... }` rather than one per field.

**Applies to:** Component, Trait.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
cpu := defkit.String("cpu").Optional()
memory := defkit.String("memory").Optional()

comp := defkit.NewComponent("ex-ifendif").
    Workload("batch/v1", "Job").
    Params(cpu, memory).
    Template(func(tpl *defkit.Template) {
        tpl.Output(defkit.NewResource("batch/v1", "Job").
            If(cpu.IsSet()).
            Set("spec.template.spec.containers[0].resources.limits.cpu", cpu).
            Set("spec.template.spec.containers[0].resources.requests.cpu", cpu).
            EndIf().
            If(memory.IsSet()).
            Set("spec.template.spec.containers[0].resources.limits.memory", memory).
            Set("spec.template.spec.containers[0].resources.requests.memory", memory).
            EndIf())
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    output: {
        apiVersion: "batch/v1"
        kind:       "Job"
        if parameter["cpu"] != _|_ {
            spec: template: spec: containers: {
                [0]: resources: {
                    limits:   { cpu: parameter.cpu }
                    requests: { cpu: parameter.cpu }
                }
            }
        }
        if parameter["memory"] != _|_ {
            spec: template: spec: containers: {
                [0]: resources: {
                    limits:   { memory: parameter.memory }
                    requests: { memory: parameter.memory }
                }
            }
        }
    }
}
```

</TabItem>
</Tabs>

## Array literals: `NewArray()` / `NewArrayElement()`

`NewArray()` builds a CUE list. Chain:

- `.Item(elem)` — always-present element,
- `.ItemIf(cond, elem)` — conditional element,
- `.ForEachGuarded(cond, source, elem)` — append one element per value in an array parameter, guarded by a condition.

`NewArrayElement()` builds a struct value. It is used both as an array element and as any nested struct value inside a resource.

**Applies to:** Component, Trait.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
cpuP := defkit.Struct("cpu")
mem := defkit.Struct("mem").Optional()
podCustomMetrics := defkit.List("podCustomMetrics").Optional()

cpuMetric := defkit.NewArrayElement().
    Set("type", defkit.Lit("Resource")).
    Set("resource", defkit.NewArrayElement().
        Set("name", defkit.Lit("cpu")).
        Set("target", defkit.NewArrayElement().
            Set("type", defkit.Lit("Utilization")).
            Set("averageUtilization", defkit.Reference("parameter.cpu.value"))))

memMetric := defkit.NewArrayElement().
    Set("type", defkit.Lit("Resource")).
    Set("resource", defkit.NewArrayElement().
        Set("name", defkit.Lit("memory")))

customElem := defkit.NewArrayElement().
    Set("name", defkit.Reference("m.name")).
    Set("value", defkit.Reference("m.value"))

metrics := defkit.NewArray().
    Item(cpuMetric).
    ItemIf(mem.IsSet(), memMetric).
    ForEachGuarded(podCustomMetrics.IsSet(), podCustomMetrics, customElem)

comp := defkit.NewComponent("ex-hpa").
    Workload("autoscaling/v2", "HorizontalPodAutoscaler").
    Params(cpuP, mem, podCustomMetrics).
    Template(func(tpl *defkit.Template) {
        tpl.Output(defkit.NewResource("autoscaling/v2", "HorizontalPodAutoscaler").
            Set("spec.metrics", metrics))
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    output: {
        apiVersion: "autoscaling/v2"
        kind:       "HorizontalPodAutoscaler"
        spec: metrics: [
            {
                resource: {
                    name: "cpu"
                    target: {
                        averageUtilization: parameter.cpu.value
                        type:               "Utilization"
                    }
                }
                type: "Resource"
            },
            if parameter["mem"] != _|_ {
                {
                    resource: { name: "memory" }
                    type:     "Resource"
                }
            },
            if parameter["podCustomMetrics"] != _|_ for m in parameter.podCustomMetrics {
                {
                    name:  m.name
                    value: m.value
                }
            },
        ]
    }
}
```

</TabItem>
</Tabs>

## Conditional API version: `NewResourceWithConditionalVersion()`

When the API group for a resource depends on cluster version (common for HPAs, CronJobs during Kubernetes upgrades), build the resource with `NewResourceWithConditionalVersion(kind)` and chain `.VersionIf(condition, apiVersion)` clauses. The generator emits conditional `apiVersion` assignments inside the resource block.

**Applies to:** Component, Trait.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
vela := defkit.VelaCtx()

hpa := defkit.NewResourceWithConditionalVersion("HorizontalPodAutoscaler").
    VersionIf(defkit.Lt(vela.ClusterVersion().Minor(), defkit.Lit(23)), "autoscaling/v2beta2").
    VersionIf(defkit.Ge(vela.ClusterVersion().Minor(), defkit.Lit(23)), "autoscaling/v2").
    Set("metadata.name", vela.Name())

comp := defkit.NewComponent("ex-conditional-version").
    Workload("apps/v1", "Deployment").
    Template(func(tpl *defkit.Template) {
        tpl.Output(defkit.NewResource("apps/v1", "Deployment").
            Set("metadata.name", vela.Name()))
        tpl.Outputs("hpa", hpa)
    })
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
template: {
    output: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
        metadata: name: context.name
    }
    outputs: {
        hpa: {
            if context.clusterVersion.minor < 23 {
                apiVersion: "autoscaling/v2beta2"
            }
            if context.clusterVersion.minor >= 23 {
                apiVersion: "autoscaling/v2"
            }
            kind: "HorizontalPodAutoscaler"
            metadata: name: context.name
        }
    }
}
```

</TabItem>
</Tabs>

Any resource — primary via `tpl.Output(...)` or auxiliary via `tpl.Outputs(name, ...)` — can use conditional versioning. The example above wraps it as an auxiliary HPA alongside the Deployment workload.

## Trait patches: `tpl.Patch()`

Traits mutate an already-rendered workload by emitting a `patch:` block rather than a new `output:`. `tpl.Patch()` returns a `*PatchResource` builder with the same `.Set()` / `.SetIf()` / `.SpreadIf()` / `.If()` / `.EndIf()` methods as a plain resource, plus patch-specific helpers described below.

**Applies to:** **Trait** only — components render via `tpl.Output(...)`.

### Basic patch + merge strategy

`tpl.PatchStrategy(strategy)` emits a `// +patchStrategy=...` comment consumed by the KubeVela runtime. Common values: `"retainKeys"`, `"jsonMergePatch"`, `"jsonPatch"`.

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

### Array merges: `Patch().PatchKey()`

When patching into a list where Kubernetes needs a merge key (e.g., `containers` by `name`), use `PatchKey(path, key, elems...)`. The generator emits a `// +patchKey=<key>` directive so the strategic-merge controller merges by that key instead of replacing.

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

### Pass-through patches: `Patch().Passthrough()`

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

### Raw CUE: `tpl.SetRawPatchBlock()`

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

## Related

- [Template Output Methods](./template-output-methods.md) — `tpl.Output()` / `tpl.Outputs()` / `tpl.OutputsIf()` / `tpl.OutputsGroupIf()`
- [Resource Builder](./resource-builder.md) — full `*Resource` and `*ArrayBuilder` API reference
- [TraitDefinition](./definition-trait.md) — full trait example combining `Patch()` with `Outputs()`
