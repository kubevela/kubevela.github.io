---
title: PolicyDefinition
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`defkit.NewPolicy(name string) *PolicyDefinition` creates a PolicyDefinition builder. Policies have no workload coupling. Most control lifecycle behaviours like garbage collection, apply-once semantics, or override rules; an [Application-scoped policy](../policy/application-scoped-policy.md) instead transforms the Application before it is rendered, and can be global.

## Chain Methods

### Policy-specific

| Method | Description |
|---|---|
| `.Template(fn func(tpl *PolicyTemplate))` | Provides the policy template closure. Unlike component/trait templates, a `PolicyTemplate` doesn't create Kubernetes resources — it defines computed fields using `Set(name, value)` that KubeVela's policy engine evaluates (e.g. topology selection, override rules). |
| `.ManageHealthCheck()` | Declares that this policy manages health checking for the application. When set, KubeVela delegates health evaluation to this policy's health policy expression instead of using the default per-component health checks. |
| `.ApplicationScoped()` | Makes the policy transform the Application before it is rendered, through the template's `Output()`, instead of producing resources. |
| `.Global()` | Applies the policy to every Application in the namespace it is installed in (every Application when installed in `vela-system`) without being listed in `spec.policies`. A global policy is always Application-scoped. |
| `.Priority(p int32)` | Orders the policy among the Application-scoped policies that apply: lower runs first, ties in name order. Explicit policies run at `0`. |
| `.CtxSchema(fields ...Param)` | Declares an open schema for what the policy puts in `ctx`, read by components and traits as `context.custom`. See [Typed Policy Context](../policy/policy-context-schema.md#in-defkit). |
| `.ClosedCtxSchema(fields ...Param)` | As `CtxSchema`, closed: the policy sets no key it does not declare, and `Register` refuses an `Output().Ctx` it does not declare. |

### Shared base methods

These methods are the same shape as on `ComponentDefinition`. See the [ComponentDefinition page](./definition-component.md) for the longer descriptions.

| Method | Description |
|---|---|
| `.Description(desc string)` | Human-readable description shown in `vela show` and the KubeVela dashboard. |
| `.Annotations(map[string]string)` | Annotations on the PolicyDefinition CR itself. |
| `.Labels(map[string]string)` | Labels on the PolicyDefinition CR. |
| `.Version(v string)` | Definition version string for versioned selection. |
| `.Params(params ...Param)` | Adds parameter definitions that become the `parameter: { ... }` block (insertion order preserved). |
| `.Param(param Param)` | Adds a single parameter — incremental equivalent of `Params()`. |
| `.Helper(name string, param Param)` | Registers a named CUE helper type definition emitted as `#Name: { ... }` before the `parameter` block. Other params reference helpers via `.WithSchemaRef("Name")`. |
| `.CustomStatus(expr string)` | Raw CUE expression for the `status: customStatus:` block. |
| `.HealthPolicy(expr string)` | Raw CUE expression for the `status: healthPolicy:` block. |
| `.HealthPolicyExpr(expr HealthExpression)` | Type-safe `HealthExpression` DSL alternative to `HealthPolicy()`. |
| `.StatusDetails(details string)` | Raw CUE expression for the `status: details:` block. |
| `.RunOn(conditions ...placement.Condition)` | Restricts this policy to clusters whose labels match the given conditions. |
| `.NotRunOn(conditions ...placement.Condition)` | Excludes this policy from clusters whose labels match the given conditions. |
| `.RawCUE(cue string)` | Escape hatch: bypasses the entire builder and emits the raw CUE string as the whole definition. |
| `.WithImports(imports ...string)` | Adds CUE import statements (e.g. `"strings"`, `"strconv"`) to the generated template. |
| `.ToCue() string` | Compiles the policy into a complete CUE string ready to apply as a KubeVela X-Definition. |
| `.ToYAML() ([]byte, error)` | Generates the Kubernetes YAML manifest for the PolicyDefinition CR. |

### PolicyTemplate (closure argument)

`.Template()` passes a `*PolicyTemplate`. A policy doesn't produce resources, so there's no `Patch()`. `Enabled()` and `Output()` are honoured only on an Application-scoped policy, and `Register` refuses them on any other:

| Method | Description |
|---|---|
| `.Set(name string, value Value)` | Assigns a value to a named computed field in the policy's template body. The policy engine reads these fields when it evaluates the policy (e.g. topology selection, override rules). |
| `.Enabled(cond Condition)` | Turns the policy on only when the condition holds, written as `config.enabled`. |
| `.Output()` | Returns the builder for what the policy changes on the Application: `Components`, `Workflow`, `Policies`, `Label`, `Annotation` and `Ctx`. See [Typed Policy Context](../policy/policy-context-schema.md#in-defkit). |

## Example

Let's build a `gc-control` policy — a reusable declaration that tells the platform how to handle the garbage-collection of resources belonging to an Application. Users opt in via `spec.policies[]` on the Application and supply per-resource rules (keep / onAppUpdate / onAppDelete) or app-wide toggles (retain legacy trackers, continue on workflow failure); the policy itself is metadata-only, with no Kubernetes resources emitted by the template.

Behind the scenes the policy exercises most chain methods in a single definition — metadata (`Description`, `Labels`), two reusable `Helper(...)` struct types (`GCSelector` and `GCRule`), `Params` with booleans + an array that references a helper via `WithSchemaRef`. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/policies/`.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go — defkit">

```go
package policies

import "github.com/oam-dev/kubevela/pkg/definition/defkit"

func GCControl() *defkit.PolicyDefinition {
    selector := defkit.Struct("selector").WithFields(
        defkit.Field("componentNames", defkit.ParamTypeArray).
            Description("Select resources by component names").
            Optional(),
        defkit.Field("resourceTypes", defkit.ParamTypeArray).
            Description("Select resources by Kubernetes kind (e.g. Deployment, Service)").
            Optional(),
    )

    rule := defkit.Struct("rule").WithFields(
        defkit.Field("selector", defkit.ParamTypeStruct).
            Description("How to select the resources this rule governs").
            WithSchemaRef("GCSelector"),
        defkit.Field("strategy", defkit.ParamTypeString).
            Description("Recycle behavior: keep | onAppUpdate | onAppDelete").
            Default("onAppUpdate"),
    )

    return defkit.NewPolicy("gc-control").
        Description("Control garbage-collection behavior for selected resources").
        Labels(map[string]string{"tier": "platform"}).
        Helper("GCSelector", selector).
        Helper("GCRule", rule).
        Params(
            defkit.Bool("keepLegacyResource").
                Description("Keep outdated resource trackers instead of garbage-collecting them").
                Default(false),
            defkit.Bool("continueOnFailure").
                Description("Run GC even if the application workflow failed").
                Default(false),
            defkit.Array("rules").
                Description("Per-resource GC rules, evaluated in order").
                WithSchemaRef("GCRule").
                Optional(),
        )
}

func init() { defkit.Register(GCControl()) }
```

</TabItem>
<TabItem value="cue" label="CUE — generated">

```cue
"gc-control": {
  annotations: {}
  description: "Control garbage-collection behavior for selected resources"
  labels: {
    "tier": "platform"
  }
  attributes: {}
  type: "policy"
}

template: {
  #GCSelector: {
    // +usage=Select resources by component names
    componentNames?: [...]
    // +usage=Select resources by Kubernetes kind (e.g. Deployment, Service)
    resourceTypes?: [...]
  }
  #GCRule: {
    // +usage=How to select the resources this rule governs
    selector: #GCSelector
    // +usage=Recycle behavior: keep | onAppUpdate | onAppDelete
    strategy: *"onAppUpdate" | string
  }
  parameter: {
    // +usage=Keep outdated resource trackers instead of garbage-collecting them
    keepLegacyResource: *false | bool
    // +usage=Run GC even if the application workflow failed
    continueOnFailure: *false | bool
    // +usage=Per-resource GC rules, evaluated in order
    rules?: [...#GCRule]
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

> **Heads-up on custom policies at runtime.** KubeVela's built-in policy names (`garbage-collect`, `apply-once`, `topology`, `override`, `shared-resource`, ...) are interpreted by the controller in Go — their CUE schemas serve as user-facing parameter docs, not as the execution path. A custom-named `PolicyDefinition` like `gc-control` applies cleanly and is visible on the cluster, but Applications that reference it will fail policy rendering with `field not found: output` unless (a) the template emits resources via an `output:` field, or (b) a controller or webhook that recognizes the policy name is installed. Treat this example as an authoring-complete, schema-complete policy; runtime enforcement is a platform integration step beyond the `vela def apply-module` flow.

## Policy API Group

PolicyDefinitions are registered under `core.oam.dev/v1beta1`. Users reference policies by name in the `policies` section of an Application:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
spec:
  policies:
    - name: my-apply-once
      type: apply-once
      properties:
        enable: true
        rules:
          - selector:
              componentNames: ["backend"]
            strategy:
              affect: onUpdate
              path: ["spec.replicas"]
```

## Related

- [ComponentDefinition](./definition-component.md) — define workload types
- [TraitDefinition](./definition-trait.md) — patch workloads with traits
- [Register & Output](./definition-register.md) — `defkit.Register()` and output methods
- [Integration](./integration.md) — KubeVela ecosystem integration points
