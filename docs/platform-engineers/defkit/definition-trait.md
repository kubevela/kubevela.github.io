---
title: TraitDefinition
---

`defkit.NewTrait(name string) *TraitDefinition` creates a TraitDefinition builder. Traits patch or augment existing component workloads. They can target specific workload types and optionally mutate container specs.

## Chain Methods

| Method | Description |
|---|---|
| `.Description(text)` | Human-readable description of the trait's purpose. |
| `.AppliesTo(workloads...)` | Restricts which component types this trait can attach to (e.g., `"webservice"`, `"daemon"`). Omit for universal traits. |
| `.ConflictsWith(traits...)` | Declares mutual exclusion with other named traits. |
| `.WorkloadRefPath(path)` | Specifies the field path (e.g. `"spec.workloadRef"`) to the workload object reference within the trait's resource. Pass an empty string to disable workload ref tracking for this trait. |
| `.PodDisruptive(bool)` | Marks the trait as pod-disruptive (triggers pod restart when changed). |
| `.Stage(stage)` | Sets the dispatch stage for ordering trait application. |
| `.Labels(map)` | Attaches metadata labels to the TraitDefinition CRD. |
| `.Params(params...)` | Registers typed parameter definitions. |
| `.Template(func(tpl))` | Assigns the patch template function. For container mutation use `tpl.UsePatchContainer(config)` inside. |
| `.Helper(name, param)` | Registers a helper variable for use in the template function. |

## Example

```go title="Go — defkit"
func Env() *defkit.TraitDefinition {
    envs := defkit.Array("env").Of(defkit.Struct("envItem").
        WithFields(
            defkit.String("name"),
            defkit.String("value").Optional(),
        )).Description("Environment variables to inject")

    return defkit.NewTrait("env").
        Description("Inject environment variables into containers").
        AppliesTo("webservice", "daemon", "worker").
        PodDisruptive(true).
        Params(envs).
        Template(envTemplate)
}

func init() { defkit.Register(Env()) }
```

```cue title="CUE — generated"
// Generated — env TraitDefinition
#PatchParams: {
  containerName: *"" | string
  replace:       *false | bool
  env: [string]: string
  unset: *[] | [...string]
}
parameter: {
  env?: [...{
    name:   string
    value?: string
  }]
}
```

## Container Mutation

For traits that need to modify container specs (inject env vars, add volume mounts, set resource limits), use `defkit.PatchContainer(...)` combined with `tpl.UsePatchContainer(config)` inside the template function. This generates the correct CUE patch semantics.

## WorkloadRefPath

`.WorkloadRefPath(path)` specifies the JSONPath to the workload object reference within the trait's resource. This is used by the KubeVela controller for resource tracking. Pass an empty string to disable workload ref tracking:

```go
return defkit.NewTrait("my-trait").
    WorkloadRefPath("spec.workloadRef").
    // ...
```

## Related

- [ComponentDefinition](./definition-component.md) — define workload types
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Integration](./integration.md) — KubeVela ecosystem integration points
