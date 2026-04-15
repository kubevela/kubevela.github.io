---
title: Template Patch Methods
---

Resource builder methods for constructing and mutating Kubernetes resource manifests. Path syntax supports dot-notation, array indices (`[0]`), and bracket notation.

## `.Set()` / `.SetIf()` / `.SpreadIf()`

`.Set()` always sets the field. `.SetIf()` wraps the assignment in an `if cond` guard. `.SpreadIf()` spreads a map value (e.g., labels object) into a path conditionally.

Applies to: **All Definition Types**

```go title="Go — defkit"
image       := defkit.String("image")
annotations := defkit.StringKeyMap("annotations")
labels      := defkit.StringKeyMap("labels")

job := defkit.NewResource("batch/v1", "Job").
    Set("spec.template.spec.containers[0].image", image).
    SetIf(annotations.IsSet(),
        "spec.template.metadata.annotations", annotations).
    SpreadIf(labels.IsSet(),
        "spec.template.metadata.labels", labels)
```

```cue title="CUE — generated"
spec: template: spec: containers: [{
    image: parameter.image
}]
if parameter["annotations"] != _|_ {
    spec: template: metadata: annotations: parameter.annotations
}
if parameter["labels"] != _|_ {
    spec: template: metadata: labels: parameter.labels
}
```

## `.If()` / `.EndIf()`

Wraps multiple consecutive `.Set()` calls in a single CUE `if cond { ... }` block. Use when several fields should only be set together under the same condition, avoiding repetitive `.SetIf()` calls.

Applies to: **All Definition Types**

```go title="Go — defkit"
cpu    := defkit.String("cpu")
memory := defkit.String("memory")

job := defkit.NewResource("batch/v1", "Job").
    If(cpu.IsSet()).
        Set("spec.template.spec.containers[0].resources.limits.cpu", cpu).
        Set("spec.template.spec.containers[0].resources.requests.cpu", cpu).
    EndIf().
    If(memory.IsSet()).
        Set("spec.template.spec.containers[0].resources.limits.memory", memory).
        Set("spec.template.spec.containers[0].resources.requests.memory", memory).
    EndIf()
```

```cue title="CUE — generated"
if parameter["cpu"] != _|_ {
    spec: template: spec: containers: [{
        resources: {
            limits:   { cpu: parameter.cpu }
            requests: { cpu: parameter.cpu }
        }
    }]
}
if parameter["memory"] != _|_ {
    spec: template: spec: containers: [{
        resources: {
            limits:   { memory: parameter.memory }
            requests: { memory: parameter.memory }
        }
    }]
}
```

## `defkit.NewArray()` / `defkit.NewArrayElement()`

`defkit.NewArray()` builds a CUE list literal. Chain `.Item(elem)` for always-present elements, `.ItemIf(cond, elem)` for conditional elements, and `.ForEachGuarded(cond, param, template)` to append elements for each value in an array parameter. `defkit.NewArrayElement()` builds one element object using `.Set()` and `.SetIf()`.

Applies to: **All Definition Types**

```go title="Go — defkit"
mem := defkit.Struct("mem").Optional()
podCustomMetrics := defkit.Array("podCustomMetrics").Optional()

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
```

```cue title="CUE — generated"
[
    {
        type: "Resource"
        resource: {
            name: "cpu"
            target: {
                type: "Utilization"
                averageUtilization: parameter.cpu.value
            }
        }
    },
    if parameter["mem"] != _|_ {
        type: "Resource"
        resource: { name: "memory" }
    },
    if parameter["podCustomMetrics"] != _|_ for m in parameter.podCustomMetrics {
        name: m.name
        value: m.value
    },
]
```

## `tpl.Patch()` / `tpl.PatchStrategy()` / `tpl.SetRawPatchBlock()`

`tpl.Patch()` returns a resource builder whose `.Set()` calls build the CUE `patch: { ... }` block. `tpl.PatchStrategy()` sets the merge strategy (e.g., `"retainKeys"`, `"jsonMergePatch"`, `"jsonPatch"`). `tpl.SetRawPatchBlock()` injects a raw CUE string as the entire patch block — use when the fluent builder can't express the needed structure.

Applies to: **Trait**

```go title="Go — defkit"
// Fluent patch builder
name := defkit.String("serviceAccountName")
tpl.PatchStrategy("retainKeys")
tpl.Patch().Set("spec.template.spec.serviceAccountName", name)

// Raw CUE patch block (for complex cases)
tpl.SetRawPatchBlock(`patch: spec: template: spec: {
    containers: [{
        name: parameter.containerName
        env: parameter.env
    }]
}`)
```

```cue title="CUE — generated"
// Fluent builder output
patchStrategy: "retainKeys"
patch: {
    spec: template: spec: {
        serviceAccountName: parameter.serviceAccountName
    }
}

// Raw block output (verbatim)
patch: spec: template: spec: {
    containers: [{...}]
}
```

## `defkit.NewResourceWithConditionalVersion()`

Creates a resource whose `apiVersion` is determined at runtime based on cluster version. Chain `.VersionIf(condition, apiVersion)` clauses to map version ranges to the correct API group.

```go title="Go — defkit"
vela := defkit.VelaCtx()

hpa := defkit.NewResourceWithConditionalVersion("HorizontalPodAutoscaler").
    VersionIf(defkit.Lt(vela.ClusterVersion().Minor(), defkit.Lit(23)), "autoscaling/v2beta2").
    VersionIf(defkit.Ge(vela.ClusterVersion().Minor(), defkit.Lit(23)), "autoscaling/v2").
    Set("metadata.name", vela.Name())
```

```cue title="CUE — generated"
outputs: hpa: {
    apiVersion: {
        if context.clusterVersion.minor < 23 { "autoscaling/v2beta2" }
        if context.clusterVersion.minor >= 23 { "autoscaling/v2" }
    }
    kind: "HorizontalPodAutoscaler"
    metadata: name: context.name
}
```
