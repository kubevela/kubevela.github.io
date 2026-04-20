---
title: TraitDefinition
---

`defkit.NewTrait(name string) *TraitDefinition` creates a TraitDefinition builder. Traits patch or augment existing component workloads. They can target specific workload types and optionally mutate container specs.

## Chain Methods

### Trait-specific

| Method | Description |
|---|---|
| `.AppliesTo(workloads ...string)` | Restricts which workload types this trait can attach to. Values use `pluralKind.group` format: `"deployments.apps"`, `"statefulsets.apps"`, `"jobs.batch"`. Use `"*"` to apply to all workload types. If omitted, the trait can apply to any workload. Generates `appliesToWorkloads: [...]`. |
| `.ConflictsWith(traits ...string)` | Declares that this trait cannot be used alongside the listed traits on the same component. KubeVela rejects applications where conflicting traits are both attached (e.g. `"scaler"` conflicts with `"hpa"`). Generates `conflictsWith: [...]`. |
| `.PodDisruptive(bool)` | Indicates whether applying this trait may cause pod restarts or disruption. When `true`, KubeVela can warn users or enforce approval workflows before rolling out changes. Always emitted in CUE as `podDisruptive: true/false`. |
| `.ManageWorkload()` | Marks this trait as a workload manager — it takes ownership of the entire workload resource rather than just patching it. Workload-managing traits generate the primary resource instead of the component, allowing traits to replace the default output entirely. |
| `.ControlPlaneOnly()` | Marks this trait to execute only on the control plane cluster, even in multi-cluster deployments. The trait's template runs once centrally rather than being dispatched to each managed cluster. |
| `.RevisionEnabled()` | Enables revision tracking for this trait, causing KubeVela to create a new revision each time the trait configuration changes. This supports canary deployments and rollback scenarios where trait state needs to be versioned. |
| `.Stage(stage string)` | Controls when this trait executes relative to other traits. Common values: `"PreDispatch"` (before resources are sent to clusters), `"PostDispatch"` (after deployment, e.g. for creating Services). Generates `stage: "..."`. |
| `.WorkloadRefPath(path string)` | Specifies a custom path within the trait's output where KubeVela should inject the workload reference. The default path is auto-detected, but complex traits may need to explicitly declare where the workload object reference goes. Pass `""` to disable workload ref tracking. |
| `.TemplateBlock(cue string)` | Escape hatch for the template section only: provides raw CUE for the `template: { ... }` block while still using the builder for the definition header (description, appliesToWorkloads, etc.). Unlike `RawCUE()`, this only replaces the template, not the entire definition. |

### Shared base methods

These methods are the same shape as on `ComponentDefinition`. See the [ComponentDefinition page](./definition-component.md) for the longer descriptions.

| Method | Description |
|---|---|
| `.Description(desc string)` | Human-readable description shown in `vela show` and the KubeVela dashboard. |
| `.Annotations(map[string]string)` | Annotations on the TraitDefinition CR itself (not on the patched resource). |
| `.Labels(map[string]string)` | Labels on the TraitDefinition CR. Use `ui-hidden: "true"` to hide from the dashboard. |
| `.Version(v string)` | Definition version string for versioned selection. |
| `.Params(params ...Param)` | Adds parameter definitions that become the `parameter: { ... }` block in CUE (insertion order preserved). |
| `.Param(param Param)` | Adds a single parameter — incremental equivalent of `Params()`. |
| `.Template(fn func(tpl *Template))` | Provides the patch template closure. For container mutation, call `tpl.UsePatchContainer(config)` inside. Use `tpl.Patch()` for the patch block. |
| `.Helper(name string, param Param)` | Registers a named CUE helper type definition (`#Name: { ... }`) referenced from params or outputs. |
| `.CustomStatus(expr string)` | Raw CUE expression for the `status: customStatus:` block. |
| `.HealthPolicy(expr string)` | Raw CUE expression for the `status: healthPolicy:` block — must evaluate to `isHealth: true/false`. |
| `.HealthPolicyExpr(expr HealthExpression)` | Type-safe `HealthExpression` DSL alternative to `HealthPolicy()` for building condition-based health checks. |
| `.StatusDetails(details string)` | Raw CUE expression for the `status: details:` block for structured status output. |
| `.RunOn(conditions ...placement.Condition)` | Restricts this trait to clusters whose identity labels match the given conditions. |
| `.NotRunOn(conditions ...placement.Condition)` | Excludes this trait from clusters whose labels match the given conditions (inverse of `RunOn`). |
| `.RawCUE(cue string)` | Escape hatch: bypasses the entire builder and emits the raw CUE string as the whole definition. |
| `.WithImports(imports ...string)` | Adds CUE import statements to the generated template (e.g. `"strings"`, `"strconv"`). |
| `.ToCue() string` | Compiles the trait into a complete CUE string ready to apply as a KubeVela X-Definition. |
| `.ToYAML() ([]byte, error)` | Generates the Kubernetes YAML manifest for the TraitDefinition CR. |

> Note: TraitDefinition deliberately omits Component-only methods (`Workload`, `AutodetectWorkload`, `OmitWorkloadType`, `ChildResourceKind`, `PodSpecPath`, `Validators`, `ConditionalParams`, `ToCueWithImports`, `ToParameterSchema`). Cross-field validation on traits is instead expressed on the parameter types themselves.

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

`.WorkloadRefPath(path)` specifies the dot-notation field path to the workload object reference within the trait's resource. This is used by the KubeVela controller for resource tracking. Pass an empty string to disable workload ref tracking:

```go
return defkit.NewTrait("my-trait").
    WorkloadRefPath("spec.workloadRef").
    // ...
```

## Related

- [ComponentDefinition](./definition-component.md) — define workload types
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Integration](./integration.md) — KubeVela ecosystem integration points
