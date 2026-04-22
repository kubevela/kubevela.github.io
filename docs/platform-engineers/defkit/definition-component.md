---
title: ComponentDefinition
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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

Let's build an `api-service` component — a reusable definition for internal HTTP services that render to a Kubernetes `Deployment`. Users of this component only need to supply a container image; the rest (replica count, rolling-vs-recreate strategy, optional env vars) is configurable with sensible defaults, and the rollout is guarded so `RollingUpdate` can't be used with fewer than 2 replicas.

Behind the scenes the component exercises most chain methods in a single definition — metadata (`Description`, `Labels`), workload (`Workload`, `PodSpecPath`), typed parameters with a value enum and default, a cross-field `Validators(...)` rule, a real `Template(...)`, health via `HealthPolicyExpr`, status via `StatusDetails`, cluster `RunOn` placement, and `WithImports("strings")` so the template body can call `strings.ToLower(...)`. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package components

import (
    "github.com/oam-dev/kubevela/pkg/definition/defkit"
    "github.com/oam-dev/kubevela/pkg/definition/defkit/placement"
)

func APIService() *defkit.ComponentDefinition {
    image := defkit.String("image").
        Description("Container image")
    replicas := defkit.Int("replicas").Default(1).
        Description("Desired replica count")
    strategy := defkit.String("strategy").
        Values("Recreate", "RollingUpdate").
        Default("RollingUpdate").
        Description("Deployment strategy")
    env := defkit.List("env").
        Description("Extra environment variables (Kubernetes envVar list)")

    rollingOK := defkit.Validate(
        "strategy=RollingUpdate requires replicas>=2").
        WithName("_validateRolling").
        OnlyWhen(defkit.String("strategy").Eq("RollingUpdate")).
        FailWhen(defkit.Int("replicas").Lt(2))

    return defkit.NewComponent("api-service").
        Description("Internal HTTP API backed by a Deployment").
        Labels(map[string]string{"tier": "api"}).
        Workload("apps/v1", "Deployment").
        PodSpecPath("spec.template.spec").
        Params(image, replicas, strategy, env).
        Validators(rollingOK).
        Template(apiServiceTemplate).
        HealthPolicyExpr(
            defkit.Health().Condition("Available").IsTrue()).
        StatusDetails(`replicas: parameter.replicas`).
        RunOn(placement.Label("env").Eq("production")).
        WithImports("strings")
}

func apiServiceTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")
    replicas := defkit.Int("replicas")
    strategy := defkit.String("strategy")
    env := defkit.List("env")

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        Set("metadata.labels[app.oam.dev/component]",
            defkit.StringsToLower(vela.Name())).
        Set("spec.replicas", replicas).
        Set("spec.strategy.type", strategy).
        Set("spec.selector.matchLabels[app.oam.dev/component]",
            vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]",
            vela.Name()).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        SetIf(env.IsSet(),
            "spec.template.spec.containers[0].env", env)

    tpl.Output(dep)
}

func init() { defkit.Register(APIService()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
import (
  "strings"
)

"api-service": {
  type: "component"
  annotations: {}
  labels: {
    "tier": "api"
  }
  description: "Internal HTTP API backed by a Deployment"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
      }
      type: "deployments.apps"
    }
    status: {
      healthPolicy: #"""
        _availableCond: [ for c in context.output.status.conditions if c.type == "Available" { c } ]
        isHealth: len(_availableCond) > 0 && _availableCond[0].status == "True"
        """#
      details: #"""
        replicas: parameter.replicas
        """#
    }
  }
}
template: {
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: {
      name: context.name
      labels: {
        "app.oam.dev/component": strings.ToLower(context.name)
      }
    }
    spec: {
      replicas: parameter.replicas
      strategy: {
        type: parameter.strategy
      }
      selector: {
        matchLabels: {
          "app.oam.dev/component": context.name
        }
      }
      template: {
        metadata: {
          labels: {
            "app.oam.dev/component": context.name
          }
        }
        spec: {
          containers: [{
            name: context.name
            image: parameter.image
            if parameter["env"] != _|_ {
              env: parameter.env
            }
          }]
        }
      }
    }
  }
  parameter: {
    // +usage=Container image
    image: string
    // +usage=Desired replica count
    replicas: *1 | int
    // +usage=Deployment strategy
    strategy: *"RollingUpdate" | "Recreate"
    // +usage=Extra environment variables (Kubernetes envVar list)
    env: [..._]
    if parameter.strategy == "RollingUpdate" {
      _validateRolling: {
        "strategy=RollingUpdate requires replicas>=2": true
        if parameter.replicas < 2 {
          "strategy=RollingUpdate requires replicas>=2": false
        }
      }
    }
  }
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

- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [Quick Start](./quick-start.md) — end-to-end example
