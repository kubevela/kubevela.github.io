---
title: PolicyDefinition
---

`defkit.NewPolicy(name string) *PolicyDefinition` creates a PolicyDefinition builder. Policies are applied globally to applications and have no workload coupling. They control lifecycle behaviors like garbage collection, apply-once semantics, or override rules.

## Chain Methods

### Policy-specific

| Method | Description |
|---|---|
| `.Template(fn func(tpl *PolicyTemplate))` | Provides the policy template closure. Unlike component/trait templates, a `PolicyTemplate` doesn't create Kubernetes resources — it defines computed fields using `Set(name, value)` that KubeVela's policy engine evaluates (e.g. topology selection, override rules). |
| `.ManageHealthCheck()` | Declares that this policy manages health checking for the application. When set, KubeVela delegates health evaluation to this policy's health policy expression instead of using the default per-component health checks. |

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

`.Template()` passes a `*PolicyTemplate`. It exposes a single method — policies don't produce resources, so there's no `Output()` or `Patch()`:

| Method | Description |
|---|---|
| `.Set(name string, value Value)` | Assigns a value to a named computed field in the policy's template body. The policy engine reads these fields when it evaluates the policy (e.g. topology selection, override rules). |

## Example

```go title="Go — defkit"
func ApplyOnce() *defkit.PolicyDefinition {
    resourcePolicyRuleSelector := defkit.Struct("selector").WithFields(RuleSelectorFields()...)

    applyOnceStrategy := defkit.Struct("strategy").WithFields(
        defkit.Field("affect", defkit.ParamTypeString).
            Description("When the strategy takes effect, e.g. onUpdate, onStateKeep").
            Optional(),
        defkit.Field("path", defkit.ParamTypeArray).
            Of(defkit.ParamTypeString).
            Description("Specify the path of the resource that allow configuration drift"),
    )

    applyOncePolicyRule := defkit.Struct("rule").WithFields(
        defkit.Field("selector", defkit.ParamTypeStruct).
            Description("Specify how to select the targets of the rule").
            Optional().
            WithSchemaRef("ResourcePolicyRuleSelector"),
        defkit.Field("strategy", defkit.ParamTypeStruct).
            Description("Specify the strategy for configuring the resource level configuration drift behaviour").
            WithSchemaRef("ApplyOnceStrategy"),
    )

    return defkit.NewPolicy("apply-once").
        Description("Allow configuration drift for applied resources, delivery the resource without continuously reconciliation.").
        Helper("ApplyOnceStrategy", applyOnceStrategy).
        Helper("ApplyOncePolicyRule", applyOncePolicyRule).
        Helper("ResourcePolicyRuleSelector", resourcePolicyRuleSelector).
        Params(
            defkit.Bool("enable").
                Description("Whether to enable apply-once for the whole application").
                Default(false),
            defkit.Array("rules").
                Description("Specify the rules for configuring apply-once policy in resource level").
                WithSchemaRef("ApplyOncePolicyRule").
                Optional(),
        )
}

func init() { defkit.Register(ApplyOnce()) }
```

`RuleSelectorFields()` is a shared helper that returns the six standard resource selector fields (`componentNames`, `componentTypes`, `oamTypes`, `traitTypes`, `resourceTypes`, `resourceNames`) as `[]*defkit.StructField`.

```yaml title="Generated — PolicyDefinition (vela def apply-module --dry-run)"
apiVersion: core.oam.dev/v1beta1
kind: PolicyDefinition
metadata:
  annotations:
    definition.oam.dev/description: Allow configuration drift for applied resources, delivery the resource without continuously reconciliation.
  labels: {}
  name: apply-once
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        #ApplyOnceStrategy: {
                // +usage=When the strategy takes effect, e.g. onUpdate, onStateKeep
                affect?: string
                // +usage=Specify the path of the resource that allow configuration drift
                path: [...string]
        }
        #ApplyOncePolicyRule: {
                // +usage=Specify how to select the targets of the rule
                selector?: #ResourcePolicyRuleSelector
                // +usage=Strategy for resource level configuration drift behaviour
                strategy: #ApplyOnceStrategy
        }
        #ResourcePolicyRuleSelector: {
                // +usage=Select resources by component names
                componentNames?: [...string]
                // +usage=Select resources by component types
                componentTypes?: [...string]
                // +usage=Select resources by oamTypes (COMPONENT or TRAIT)
                oamTypes?: [...string]
                // +usage=Select resources by trait types
                traitTypes?: [...string]
                // +usage=Select resources by resource types (like Deployment)
                resourceTypes?: [...string]
                // +usage=Select resources by their names
                resourceNames?: [...string]
        }
        parameter: {
                // +usage=Whether to enable apply-once for the whole application
                enable: *false | bool
                // +usage=Specify the rules for configuring apply-once policy in resource level
                rules?: [...#ApplyOncePolicyRule]
        }
```

## Helper Type Definitions

`.Helper(name, param)` registers a named CUE type definition emitted as `#Name: { ... }` before the `parameter` block. Other parameters reference helpers via `.WithSchemaRef("Name")`:

- **Array + `.WithSchemaRef("X")`** → `field?: [...#X]`
- **Struct field + `.WithSchemaRef("X")`** → `field?: #X` (or `field: #X` with `.Mandatory()`)

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
