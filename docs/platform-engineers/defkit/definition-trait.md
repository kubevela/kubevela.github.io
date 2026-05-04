---
title: TraitDefinition
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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

Let's build a `resource-limits` trait — a reusable patch that sets CPU and memory **requests** and **limits** on the primary container of the workload it attaches to. Users only need to supply the four resource values (or accept the sensible defaults); the trait targets `Deployment` and `StatefulSet` workloads, is declared mutually exclusive with autoscaling traits (`hpa`, `cpuscaler`), and runs before dispatch so that patched pods are created with the right limits from the start.

Behind the scenes the trait exercises most chain methods in a single definition — metadata (`Description`, `Labels`), trait scope (`AppliesTo`, `ConflictsWith`), rollout hints (`PodDisruptive`, `Stage`, `RevisionEnabled`), and a `Template(...)` that uses defkit's container-mutation helper `tpl.UsePatchContainer(...)` to generate the grouped `resources.requests` / `resources.limits` patch on the target container. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/traits/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package traits

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func ResourceLimits() *defkit.TraitDefinition {
    return defkit.NewTrait("resource-limits").
        Description("Set Kubernetes container CPU/memory requests and limits").
        Labels(map[string]string{"tier": "platform"}).
        AppliesTo("deployments.apps", "statefulsets.apps").
        ConflictsWith("hpa", "cpuscaler").
        PodDisruptive(true).
        Stage("PreDispatch").
        RevisionEnabled().
        Template(resourceLimitsTemplate)
}

func resourceLimitsTemplate(tpl *defkit.Template) {
    tpl.UsePatchContainer(defkit.PatchContainerConfig{
        ContainerNameParam:   "containerName",
        DefaultToContextName: true,
        Groups: []defkit.PatchContainerGroup{
            {
                TargetField: "resources",
                SubGroups: []defkit.PatchContainerGroup{
                    {
                        TargetField: "requests",
                        Fields: defkit.PatchFields(
                            defkit.PatchField("cpuRequest").Target("cpu").Str().Default(`"100m"`),
                            defkit.PatchField("memRequest").Target("memory").Str().Default(`"128Mi"`),
                        ),
                    },
                    {
                        TargetField: "limits",
                        Fields: defkit.PatchFields(
                            defkit.PatchField("cpuLimit").Target("cpu").Str().Default(`"500m"`),
                            defkit.PatchField("memLimit").Target("memory").Str().Default(`"512Mi"`),
                        ),
                    },
                },
            },
        },
    })
}

func init() { defkit.Register(ResourceLimits()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"resource-limits": {
  type: "trait"
  annotations: {}
  labels: tier: "platform"
  description: "Set Kubernetes container CPU/memory requests and limits"
  attributes: {
    podDisruptive:   true
    revisionEnabled: true
    stage:           "PreDispatch"
    appliesToWorkloads: ["deployments.apps", "statefulsets.apps"]
    conflictsWith: ["hpa", "cpuscaler"]
  }
}
template: {
  #PatchParams: {
    // +usage=Specify the name of the target container, if not set, use the component name
    containerName: *"" | string
    // +usage=Specify the cpuRequest of the container
    cpuRequest: *"100m" | string
    // +usage=Specify the memRequest of the container
    memRequest: *"128Mi" | string
    // +usage=Specify the cpuLimit of the container
    cpuLimit: *"500m" | string
    // +usage=Specify the memLimit of the container
    memLimit: *"512Mi" | string
  }
  PatchContainer: {
    _params:         #PatchParams
    name:            _params.containerName
    _baseContainers: context.output.spec.template.spec.containers
    _matchContainers_: [for _container_ in _baseContainers if _container_.name == name {_container_}]
    _baseContainer: *_|_ | {...}
    if len(_matchContainers_) == 0 {
      err: "container \(name) not found"
    }
    if len(_matchContainers_) > 0 {
      resources: {
        requests: {
          cpu:    _params.cpuRequest
          memory: _params.memRequest
        }
        limits: {
          cpu:    _params.cpuLimit
          memory: _params.memLimit
        }
      }
    }
  }
  patch: spec: template: spec: {
    // +patchKey=name
    containers: [{
      PatchContainer & {_params: {
        if parameter.containerName == "" {
          containerName: context.name
        }
        if parameter.containerName != "" {
          containerName: parameter.containerName
        }
        cpuRequest: parameter.cpuRequest
        memRequest: parameter.memRequest
        cpuLimit:   parameter.cpuLimit
        memLimit:   parameter.memLimit
      }}
    }]
  }
  parameter: #PatchParams
  errs: [for c in patch.spec.template.spec.containers if c.err != _|_ {c.err}]
}
```

</TabItem>
</Tabs>

Reproduce the CUE on the right with:

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

## Related

- [ComponentDefinition](./definition-component.md) — define workload types
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Integration](./integration.md) — KubeVela ecosystem integration points
