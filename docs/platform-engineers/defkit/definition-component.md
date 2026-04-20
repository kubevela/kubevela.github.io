---
title: ComponentDefinition
---

`defkit.NewComponent(name string) *ComponentDefinition` creates a ComponentDefinition builder. Returns a fluent chain to configure the workload type, parameters, and CUE template function.

## Chain Methods

### Metadata

| Method | Description |
|---|---|
| `.Description(desc string)` | Sets the human-readable description shown in `vela show` and the KubeVela dashboard. Generates CUE `description: "..."` in the definition header. |
| `.Annotations(map[string]string)` | Sets annotations on the X-Definition Kubernetes resource itself (not on the workload). These are metadata annotations on the `ComponentDefinition` CR, used for UI hints, categorization, or custom tooling. |
| `.Labels(map[string]string)` | Sets labels on the X-Definition Kubernetes resource. Common labels include `ui-hidden: "true"` to hide from the dashboard or custom labels for filtering definitions. |
| `.Version(v string)` | Sets the definition version string. Used when multiple versions of the same definition coexist, allowing version-based selection during application deployment. |

### Workload

| Method | Description |
|---|---|
| `.Workload(apiVersion, kind string)` | Declares the primary Kubernetes workload this component creates (e.g. `"apps/v1", "Deployment"`). KubeVela uses this to understand what resource the component manages and to wire up traits that patch it. Generates `attributes: workload: { definition: {apiVersion, kind}, type: "deployments.apps" }` — the `type` field is auto-inferred from the GVK (suppress with `OmitWorkloadType()`). |
| `.AutodetectWorkload()` | Sets the workload type to the special sentinel `"autodetects.core.oam.dev"`, telling KubeVela to infer the workload type from the primary `output` resource at runtime instead of declaring it statically. Use when the output apiVersion or kind varies — e.g. CronJob switching between `batch/v1beta1` and `batch/v1` by cluster version, or `k8s-objects` where the kind is user-provided. |
| `.OmitWorkloadType()` | Suppresses the auto-inferred `type:` field from the `workload:` block while keeping the `definition: {apiVersion, kind}`. Use with `Workload()` when the GVK is a custom CRD that the generator can't infer a type for — e.g. Crossplane claims like `"database.example.com/v1alpha1", "PostgreSQL"`. Without this, the generator would produce an incorrect `type:` value. |
| `.ChildResourceKind(apiVersion, kind, selector)` | Declares a child resource kind that this component creates besides its primary output. KubeVela uses this to track ownership and garbage-collect child resources. The selector map filters which instances belong to this component. |
| `.PodSpecPath(path string)` | Tells KubeVela where to find the PodSpec within the output resource (e.g. `"spec.template.spec"` for Deployments). Traits that modify containers, volumes, or other pod-level fields use this path to locate the correct spec to patch. |

### Parameters & Template

| Method | Description |
|---|---|
| `.Params(params ...Param)` | Adds one or more parameter definitions that become the `parameter: { ... }` block in the generated CUE. These are the user-facing inputs shown in `vela show` and validated at apply time. Parameters are rendered in insertion order (the order you pass them). |
| `.Param(param Param)` | Adds a single parameter. Same as `Params()` but for one at a time when building incrementally. |
| `.Template(fn func(tpl *Template))` | Provides the template closure where you define output resources, patches, helpers, and let-bindings. The closure receives a `*Template` you populate with `Output()`, `Outputs()`, `Patch()`, etc. This becomes the entire `template: { ... }` block in CUE. |
| `.Helper(name string, param Param)` | Registers a named CUE helper type definition (`#Name`) with the given parameter schema. Helpers appear as reusable type definitions at the top of the template block (e.g. `#HealthProbe: { path: string, port: int }`) and can be referenced from parameters or outputs. |
| `.Validators(validators ...*Validator)` | Attaches cross-field validation rules that generate CUE `_validate*` blocks. These enforce constraints across multiple parameters (e.g. mutual exclusion, "if A is set then B must also be set"). Build validators with `Validate(msg).FailWhen(cond)`. |
| `.ConditionalParams(block *ConditionalParamBlock)` | Adds parameter fields that appear conditionally based on other parameter values. For example, showing `strategy` and `maxSurge` only when `kind == "Deployment"`. Generates CUE `if parameter.kind == "Deployment" { ... }` blocks inside the parameter schema. |

### Health & Status

| Method | Description |
|---|---|
| `.CustomStatus(expr string)` | Sets a raw CUE expression for the `status: customStatus:` block. This controls the user-visible status message (e.g. `"Ready: 3/3"`) shown in `vela status`. For a builder-based approach, use the `Status()` DSL instead. |
| `.HealthPolicy(expr string)` | Sets a raw CUE expression for the `status: healthPolicy:` block. This must evaluate to `isHealth: true/false` and determines whether KubeVela considers the component healthy. For a builder-based approach, use `HealthPolicyExpr()`. |
| `.HealthPolicyExpr(expr HealthExpression)` | Sets the health policy using the type-safe `HealthExpression` DSL (from `Health().Condition("Ready").IsTrue()` etc.) instead of raw CUE strings. The DSL generates the condition-filtering preamble and `isHealth` expression automatically. |
| `.StatusDetails(details string)` | Sets a raw CUE expression for the `status: details:` block, which provides structured status information beyond the simple message. Used for rich status reporting in the KubeVela dashboard. |

### Placement

| Method | Description |
|---|---|
| `.RunOn(conditions ...placement.Condition)` | Restricts this definition to only run on clusters whose identity labels match the given conditions. The definition is skipped during `vela def apply-module` if the target cluster doesn't match. Build conditions with `placement.Label("key").Eq("value")`. |
| `.NotRunOn(conditions ...placement.Condition)` | Excludes this definition from clusters whose labels match the given conditions. The inverse of `RunOn` — if any NotRunOn condition matches, the definition is skipped even if RunOn conditions also match. |

### Escape Hatches

| Method | Description |
|---|---|
| `.RawCUE(cue string)` | Escape hatch: bypasses the entire builder pipeline and uses the provided raw CUE string verbatim as the definition output. When set, all other builder methods are ignored. Use this for definitions too complex for the builder API or when migrating existing CUE. |
| `.WithImports(imports ...string)` | Adds CUE import statements to the generated definition (e.g. `"strings"`, `"strconv"`). The generator also auto-detects required imports from expressions like `StringsToLower()`, but use this for imports the auto-detection misses or for custom packages. |

### Output

| Method | Description |
|---|---|
| `.ToCue() string` | Compiles the entire definition into a complete CUE string ready to be applied as a KubeVela X-Definition. This is the main output method — it runs the CUE generator, which processes all parameters, templates, outputs, health policies, validators, and placement constraints into valid CUE. |
| `.ToCueWithImports(imports ...string) string` | Same as `ToCue()` but prepends additional CUE import statements. Useful when you need imports beyond what the generator auto-detects, without modifying the definition itself. |
| `.ToParameterSchema() string` | Generates only the `parameter: { ... }` CUE block without the full definition wrapper. Useful for documentation generation, schema validation tooling, or embedding the parameter schema in other contexts. |
| `.ToYAML() ([]byte, error)` | Generates the definition as a Kubernetes YAML manifest (`ComponentDefinition` CR) ready to be applied with `kubectl apply`. The CUE template is embedded in the `.spec.schematic.cue.template` field of the YAML. |

## Example

```go title="Go — defkit"
func Webservice() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Description("Container image to run")
    replicas := defkit.Int("replicas").Default(1).
        Description("Number of replicas")

    return defkit.NewComponent("webservice").
        Description("HTTP microservice backed by a Deployment").
        Workload("apps/v1", "Deployment").
        Params(image, replicas).
        Template(webserviceTemplate)
}

func init() { defkit.Register(Webservice()) }
```

```cue title="CUE — generated"
// Generated by defkit — ComponentDefinition CUE template
parameter: {
  // +usage=Container image to run
  image:    string
  // +usage=Number of replicas
  replicas: *1 | int
}
output: {
  apiVersion: "apps/v1"
  kind: "Deployment"
  metadata: name: context.name
  spec: {
    selector: matchLabels: "app.oam.dev/component": context.name
    replicas: parameter.replicas
    template: {
      metadata: labels: "app.oam.dev/component": context.name
      spec: containers: [{
        image: parameter.image
      }]
    }
  }
}
```

## OmitWorkloadType

For custom resource types (e.g., Crossplane claims), defkit auto-generates a `workload.type` field. If your CUE source does not include this field, suppress it with `OmitWorkloadType()`:

```go
comp := defkit.NewComponent("my-claim").
    Workload("database.example.com/v1alpha1", "PostgreSQL").
    OmitWorkloadType()
```

## AutodetectWorkload

Use `.AutodetectWorkload()` instead of `.Workload()` when the component template can produce different resource kinds depending on parameters (e.g., `k8s-objects` accepts arbitrary manifests, `ref-objects` references existing resources).

```go title="Go — defkit"
// Use AutodetectWorkload when the output kind varies
return defkit.NewComponent("k8s-objects").
    Description("Deploy arbitrary Kubernetes resources").
    AutodetectWorkload().   // no fixed GVK — KubeVela detects
    Params(objects).
    Template(k8sObjectsTemplate)
```

```cue title="When to use vs .Workload()"
// .Workload("apps/v1", "Deployment")
// → use when the component always produces
//   exactly one fixed resource kind

// .AutodetectWorkload()
// → use when template may output multiple
//   different resource kinds, or zero
//   (k8s-objects, ref-objects patterns)
```

## RawCUE

Use `.RawCUE()` to inject a raw CUE string as the template body, bypassing the fluent resource builder. Use when the CUE logic cannot be expressed with the builder DSL (e.g., highly dynamic object iteration). Mutually exclusive with `.Template()`.

```go title="Go — defkit"
rawBody := `
    outputs: {
        for i, obj in parameter.objects {
            "object-\(i)": obj
        }
    }
`

return defkit.NewComponent("k8s-objects").
    AutodetectWorkload().
    Params(objects).
    RawCUE(rawBody)   // bypasses .Template()
```

## WithImports

Use `.WithImports()` when your template body references CUE standard library packages (e.g., `strings`, `math`) or custom KubeVela packages.

```go title="Go — defkit"
return defkit.NewComponent("my-component").
    Description("Uses CUE strings package").
    Workload("apps/v1", "Deployment").
    WithImports("strings").  // adds: import "strings"
    Params(name).
    Template(myTemplate)
```

```cue title="CUE — generated header"
import (
    "strings"
)

// template body can now use:
//   strings.ToLower(parameter.name)
```

## Related

- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [Quick Start](./quick-start.md) — end-to-end example
