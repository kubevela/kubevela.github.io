---
title: VelaCtx — Runtime Context
---

`defkit.VelaCtx()` returns a KubeVela context accessor that compiles to CUE `context.*` references, evaluated by the controller at deploy time.

## `defkit.VelaCtx() *VelaContext`

Call at the top of your template function or definition constructor. Each method returns a `Value` that produces the corresponding `context.*` CUE path.

```go title="Go — defkit"
vela := defkit.VelaCtx()

vela.Name()                    // component name
vela.AppName()                 // application name
vela.Namespace()               // namespace
vela.Revision()                // revision name
vela.ClusterVersion().Minor()  // cluster minor version (int)
```

```cue title="CUE — generated"
vela.Name()                   → context.name
vela.AppName()                → context.appName
vela.Namespace()              → context.namespace
vela.Revision()               → context.revision
vela.ClusterVersion().Minor() → context.clusterVersion.minor
```

## Context Fields Reference

| Go method | CUE path | Description |
|---|---|---|
| `vela.Name()` | `context.name` | Component instance name |
| `vela.AppName()` | `context.appName` | Parent Application name |
| `vela.Namespace()` | `context.namespace` | Deployment namespace |
| `vela.Revision()` | `context.revision` | App revision string |
| `vela.ClusterVersion().Minor()` | `context.clusterVersion.minor` | Kubernetes minor version (int) |

## Usage in Resource Fields

The most common use of `VelaCtx` is setting metadata on generated resources:

```go title="Go — defkit"
vela := defkit.VelaCtx()

resource := defkit.NewResource("apps/v1", "Deployment").
    Set("metadata.name", vela.Name()).
    Set("metadata.namespace", vela.Namespace()).
    Set("metadata.labels[app.oam.dev/name]", vela.AppName()).
    Set("metadata.labels[app.oam.dev/component]", vela.Name())
```

```cue title="CUE — generated"
metadata: {
    name:      context.name
    namespace: context.namespace
    labels: {
        "app.oam.dev/name":      context.appName
        "app.oam.dev/component": context.name
    }
}
```

## Usage in Conditions and Comparisons

Context values can be used in comparison expressions for runtime-conditional behaviour:

```go title="Go — defkit"
vela := defkit.VelaCtx()

hpa := defkit.NewResourceWithConditionalVersion("HorizontalPodAutoscaler").
    VersionIf(defkit.Lt(vela.ClusterVersion().Minor(), defkit.Lit(23)), "autoscaling/v2beta2").
    VersionIf(defkit.Ge(vela.ClusterVersion().Minor(), defkit.Lit(23)), "autoscaling/v2").
    Set("metadata.name", vela.Name())
```

```cue title="CUE — generated"
apiVersion: {
    if context.clusterVersion.minor < 23 { "autoscaling/v2beta2" }
    if context.clusterVersion.minor >= 23 { "autoscaling/v2" }
}
kind: "HorizontalPodAutoscaler"
metadata: name: context.name
```

## Usage in String Interpolation

Context values integrate naturally with `defkit.Interpolation()`:

```go title="Go — defkit"
vela := defkit.VelaCtx()
name := defkit.String("name")

clusterScopedName := defkit.Interpolation(
    vela.Namespace(),
    defkit.Lit("/"),
    name,
)
```

```cue title="CUE — generated"
"\(context.namespace)/\(parameter.name)"
```

## Reading Component Output in Traits

Traits can inspect the component's output resource using `defkit.ContextOutput()`:

```go title="Go — defkit"
ref := defkit.ContextOutput()

templateRef := defkit.ContextOutput().Field("spec.template")

hasTemplate := defkit.ContextOutput().HasPath("spec.template")

patch := defkit.NewPatchResource()
patch.If(hasTemplate).
    Set("spec.template.metadata.labels.app", defkit.Lit("test")).
    EndIf()
```

```cue title="CUE — generated"
// .HasPath("spec.template")
context.output.spec.template != _|_

// .Field("spec.template")
context.output.spec.template
```

:::info
All `VelaCtx` methods return `Value` objects — they are not evaluated in Go. The actual values are substituted by the KubeVela controller at deploy time when the CUE template is executed against the Application spec.
:::
